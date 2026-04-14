import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Trophy, Star, Zap, RotateCcw, Timer, 
  User, History, Crown, Play, ChevronLeft,
  AlertCircle, CheckCircle2, Calculator, Orbit, Sparkles, Rocket
} from 'lucide-react';

// --- Types ---
interface PlayerStats {
  studentId: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface GameState {
  p1Id: string;
  p2Id: string;
  p1Score: number;
  p2Score: number;
  currentRound: number;
  maxRounds: number; // 3 for BO3, 5 for BO5
  isRanked: boolean;
  numbers: number[];
  startTime: number;
  timeLeft: number;
  isLocked: boolean; // During card flipping
  p1Freeze: number; // Timestamp until freeze ends
  p2Freeze: number;
  p1Input: string;
  p2Input: string;
  p1Cursor: number;
  p2Cursor: number;
  winner: 'p1' | 'p2' | 'draw' | null;
  timeoutAnswer: string | null;
}

// --- Utils ---
const getSolution = (nums: number[]): string | null => {
  const solve = (items: { val: number; expr: string }[]): string | null => {
    if (items.length === 1) {
      if (Math.abs(items[0].val - 24) < 0.0001) return items[0].expr;
      return null;
    }
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items.length; j++) {
        if (i === j) continue;
        const nextItems = items.filter((_, idx) => idx !== i && idx !== j);
        const a = items[i];
        const b = items[j];
        
        const ops = [
          { val: a.val + b.val, expr: `(${a.expr}+${b.expr})` },
          { val: a.val - b.val, expr: `(${a.expr}-${b.expr})` },
          { val: a.val * b.val, expr: `(${a.expr}×${b.expr})` },
        ];
        if (b.val !== 0) ops.push({ val: a.val / b.val, expr: `(${a.expr}÷${b.expr})` });
        
        for (const op of ops) {
          const res = solve([...nextItems, op]);
          if (res) return res;
        }
      }
    }
    return null;
  };
  return solve(nums.map(n => ({ val: n, expr: n.toString() })));
};

const solve24 = (nums: number[]): boolean => {
  if (nums.length === 1) return Math.abs(nums[0] - 24) < 0.0001;
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (i === j) continue;
      const nextNums = nums.filter((_, idx) => idx !== i && idx !== j);
      const a = nums[i];
      const b = nums[j];
      const results = [a + b, a - b, b - a, a * b];
      if (b !== 0) results.push(a / b);
      if (a !== 0) results.push(b / a);
      for (const res of results) {
        if (solve24([...nextNums, res])) return true;
      }
    }
  }
  return false;
};

const generateSolvableNumbers = (): number[] => {
  while (true) {
    // Simplify: Use numbers 1-10 more often, 11-13 less often
    const nums = Array.from({ length: 4 }, () => {
      const rand = Math.random();
      if (rand < 0.8) return Math.floor(Math.random() * 10) + 1;
      return Math.floor(Math.random() * 13) + 1;
    });
    if (solve24(nums)) return nums;
  }
};

const evaluateExpression = (expr: string, targetNums: number[]): { success: boolean; result?: number; error?: string } => {
  // Replace visual symbols with math symbols for calculation
  const mathExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');

  // 1. Check characters
  if (!/^[0-9+\-*/().\s]+$/.test(mathExpr)) {
    return { success: false, error: '包含非法字符' };
  }

  // 2. Extract numbers and check if they match targetNums
  const usedNums = mathExpr.match(/\d+/g)?.map(Number) || [];
  if (usedNums.length !== 4) {
    return { success: false, error: '必须使用全部4个数字' };
  }

  const sortedUsed = [...usedNums].sort((a, b) => a - b);
  const sortedTarget = [...targetNums].sort((a, b) => a - b);
  if (!sortedUsed.every((val, idx) => val === sortedTarget[idx])) {
    return { success: false, error: '使用的数字不匹配' };
  }

  // 3. Evaluate
  try {
    // Safe eval for simple math
    // eslint-disable-next-line no-new-func
    const res = new Function(`return ${mathExpr}`)();
    return { success: true, result: res };
  } catch (e) {
    return { success: false, error: '算式格式错误' };
  }
};

// --- Components ---

interface Student {
  id: number;
  name: string;
}

interface Log {
  id: string;
  studentId: number;
  studentName: string;
  amount: number;
  reason: string;
  timestamp: number;
  dateKey: string;
}

export default function Game24({ onExit, students, logs, dateKey, showNotification }: { 
  onExit: () => void, 
  students: Student[],
  logs: Log[],
  dateKey: string,
  showNotification: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void
}) {
  const [view, setView] = useState<'menu' | 'login' | 'playing' | 'leaderboard' | 'gameOver'>('menu');
  const [mode, setMode] = useState<'training' | 'ranked'>('training');
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [game, setGame] = useState<GameState | null>(null);
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [scoringEffect, setScoringEffect] = useState<'p1' | 'p2' | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Leaderboard
  useEffect(() => {
    const saved = localStorage.getItem('game24_leaderboard');
    if (saved) setLeaderboard(JSON.parse(saved));
  }, []);

  const saveStats = (id: string, isWin: boolean) => {
    const current = [...leaderboard];
    const idx = current.findIndex(p => p.studentId === id);
    if (idx > -1) {
      current[idx].totalGames += 1;
      if (isWin) current[idx].wins += 1;
      else current[idx].losses += 1;
      current[idx].winRate = (current[idx].wins / current[idx].totalGames) * 100;
    } else {
      current.push({
        studentId: id,
        totalGames: 1,
        wins: isWin ? 1 : 0,
        losses: isWin ? 0 : 1,
        winRate: isWin ? 100 : 0
      });
    }
    const sorted = current.sort((a, b) => b.winRate - a.winRate || b.totalGames - a.totalGames);
    setLeaderboard(sorted);
    localStorage.setItem('game24_leaderboard', JSON.stringify(sorted));
  };

  const startNewRound = useCallback((prevGame: GameState) => {
    const nums = generateSolvableNumbers();
    return {
      ...prevGame,
      numbers: nums,
      timeLeft: 90,
      isLocked: true,
      p1Input: '',
      p2Input: '',
      p1Cursor: 0,
      p2Cursor: 0,
      p1Freeze: 0,
      p2Freeze: 0,
      startTime: Date.now(),
      timeoutAnswer: null
    };
  }, []);

  const initGame = () => {
    const s1 = students.find(s => s.id.toString() === p1Id);
    const s2 = students.find(s => s.id.toString() === p2Id);

    if (!s1 || !s2) {
      showNotification('请输入有效的学号（需在宇航员档案中存在）', 'error');
      return;
    }

    if (p1Id === p2Id) {
      showNotification('两位玩家学号不能相同', 'warning');
      return;
    }

    setP1Name(s1.name);
    setP2Name(s2.name);

    // Check Eligibility only for Ranked mode
    if (mode === 'ranked') {
      const checkEligibility = (studentId: number) => {
        return logs.some(l => 
          l.studentId === studentId && 
          l.dateKey === dateKey && 
          ['完美作业', '周末完美作业', '今日事今日毕', '补订正', '周末作业清零'].includes(l.reason)
        );
      };

      const p1Eligible = checkEligibility(s1.id);
      const p2Eligible = checkEligibility(s2.id);

      if (!p1Eligible && !p2Eligible) {
        showNotification(`${s1.id}号和${s2.id}号，请先完成当天订正任务`, 'warning');
        return;
      }
      if (!p1Eligible) {
        showNotification(`${s1.id}号，请先完成当天订正任务`, 'warning');
        return;
      }
      if (!p2Eligible) {
        showNotification(`${s2.id}号，请先完成当天订正任务`, 'warning');
        return;
      }
    }

    const maxRounds = mode === 'training' ? 1 : 5;
    const initialGame: GameState = {
      p1Id,
      p2Id,
      p1Score: 0,
      p2Score: 0,
      currentRound: 1,
      maxRounds,
      isRanked: mode === 'ranked',
      numbers: generateSolvableNumbers(),
      startTime: Date.now(),
      timeLeft: 90,
      isLocked: true,
      p1Freeze: 0,
      p2Freeze: 0,
      p1Input: '',
      p2Input: '',
      p1Cursor: 0,
      p2Cursor: 0,
      winner: null,
      timeoutAnswer: null
    };
    setGame(initialGame);
    setView('playing');
    
    // Unlock after animation
    setTimeout(() => {
      setGame(g => g ? { ...g, isLocked: false } : null);
    }, 500);
  };

  // Timer Effect
  useEffect(() => {
    if (view === 'playing' && game && !game.winner && !game.timeoutAnswer) {
      timerRef.current = setInterval(() => {
        setGame(g => {
          if (!g || g.isLocked || g.timeoutAnswer) return g;
          if (g.timeLeft <= 0) {
            const answer = getSolution(g.numbers);
            // Show answer first
            setTimeout(() => {
              setGame(cur => {
                if (!cur) return null;
                if (cur.currentRound >= cur.maxRounds || Math.max(cur.p1Score, cur.p2Score) > cur.maxRounds / 2) {
                  // End Game
                  const finalWinner = cur.p1Score > cur.p2Score ? 'p1' : (cur.p2Score > cur.p1Score ? 'p2' : 'draw');
                  if (cur.isRanked && finalWinner !== 'draw') {
                    saveStats(cur.p1Id, finalWinner === 'p1');
                    saveStats(cur.p2Id, finalWinner === 'p2');
                  }
                  return { ...cur, winner: finalWinner, timeoutAnswer: null };
                }
                const next = startNewRound(cur);
                setTimeout(() => setGame(c => c ? { ...c, isLocked: false } : null), 500);
                return { ...next, currentRound: cur.currentRound + 1 };
              });
            }, 4000);
            return { ...g, timeoutAnswer: answer || '无解' };
          }
          return { ...g, timeLeft: g.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view, game?.winner, game?.timeoutAnswer, startNewRound]);

  const handleInput = (player: 'p1' | 'p2', char: string) => {
    setGame(g => {
      if (!g || g.isLocked) return g;
      const now = Date.now();
      if (player === 'p1' && g.p1Freeze > now) return g;
      if (player === 'p2' && g.p2Freeze > now) return g;

      const input = player === 'p1' ? g.p1Input : g.p2Input;
      const cursor = player === 'p1' ? g.p1Cursor : g.p2Cursor;

      if (char === '撤回') {
        if (cursor === 0) return g;
        const newInput = input.slice(0, cursor - 1) + input.slice(cursor);
        return player === 'p1'
          ? { ...g, p1Input: newInput, p1Cursor: cursor - 1 }
          : { ...g, p2Input: newInput, p2Cursor: cursor - 1 };
      }
      if (char === '清空') {
        return player === 'p1' 
          ? { ...g, p1Input: '', p1Cursor: 0 } 
          : { ...g, p2Input: '', p2Cursor: 0 };
      }
      
      const newInput = input.slice(0, cursor) + char + input.slice(cursor);
      return player === 'p1'
        ? { ...g, p1Input: newInput, p1Cursor: cursor + char.length }
        : { ...g, p2Input: newInput, p2Cursor: cursor + char.length };
    });
  };

  const handleSubmit = (player: 'p1' | 'p2') => {
    setGame(g => {
      if (!g || g.isLocked) return g;
      const now = Date.now();
      if (player === 'p1' && g.p1Freeze > now) return g;
      if (player === 'p2' && g.p2Freeze > now) return g;

      const input = player === 'p1' ? g.p1Input : g.p2Input;
      const evalResult = evaluateExpression(input, g.numbers);

      if (evalResult.success && Math.abs((evalResult.result || 0) - 24) < 0.0001) {
        // Correct!
        setScoringEffect(player);
        setTimeout(() => setScoringEffect(null), 1500);

        const newP1Score = player === 'p1' ? g.p1Score + 1 : g.p1Score;
        const newP2Score = player === 'p2' ? g.p2Score + 1 : g.p2Score;
        const targetScore = Math.ceil(g.maxRounds / 2);

        if (newP1Score >= targetScore || newP2Score >= targetScore) {
          // Game Over
          const finalWinner = newP1Score > newP2Score ? 'p1' : 'p2';
          if (g.isRanked) {
            saveStats(g.p1Id, finalWinner === 'p1');
            saveStats(g.p2Id, finalWinner === 'p2');
          }
          return { ...g, p1Score: newP1Score, p2Score: newP2Score, winner: finalWinner };
        }

        // Next Round
        const next = startNewRound({ ...g, p1Score: newP1Score, p2Score: newP2Score });
        setTimeout(() => setGame(cur => cur ? { ...cur, isLocked: false } : null), 2500);
        return { ...next, currentRound: g.currentRound + 1 };
      } else {
        // Wrong! Freeze
        return player === 'p1'
          ? { ...g, p1Freeze: now + 3000 }
          : { ...g, p2Freeze: now + 3000 };
      }
    });
  };

  // --- Renderers ---

  const renderCard = (num: number, index: number) => {
    const isRanked = game?.isRanked;
    const display = num === 1 ? 'A' : num === 11 ? 'J' : num === 12 ? 'Q' : num === 13 ? 'K' : num.toString();

    if (!isRanked) {
      // Training Mode: Simple Number with Neon Yellow Glow
      return (
        <motion.div
          key={`${game?.currentRound}-${index}`}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-32 bg-slate-900/80 backdrop-blur-xl border-2 border-amber-400/50 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-transparent opacity-50" />
          <span className="text-5xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">{num}</span>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform" />
        </motion.div>
      );
    }

    // Ranked Mode: 3D Playing Cards
    return (
      <motion.div
        key={`${game?.currentRound}-${index}`}
        initial={{ rotateY: 180, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ delay: index * 0.4, duration: 0.6 }}
        className="w-24 h-32 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center border-2 border-amber-200 relative overflow-hidden"
      >
        <div className="absolute top-2 left-2 text-amber-600 font-bold text-lg leading-none">{display}</div>
        <div className="text-4xl font-black text-slate-800">{display}</div>
        <div className="absolute bottom-2 right-2 text-amber-600 font-bold text-lg leading-none rotate-180">{display}</div>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none"></div>
      </motion.div>
    );
  };

  const renderKeyboard = (player: 'p1' | 'p2') => {
    const isP1 = player === 'p1';
    const colorClass = isP1 ? 'from-rose-500 to-pink-600' : 'from-cyan-500 to-blue-600';
    const shadowClass = isP1 ? 'shadow-rose-900/50' : 'shadow-cyan-900/50';
    const borderClass = isP1 ? 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)]';
    const isFrozen = game && (player === 'p1' ? game.p1Freeze : game.p2Freeze) > Date.now();

    const keys = [
      ...(game?.numbers.map(n => n.toString()) || []),
      '+', '-', '×', '÷', '(', ')', '撤回', '清空'
    ];

    return (
      <div className={`relative h-full flex flex-col pt-64 px-8 pb-8 transition-all duration-500 ${isP1 ? 'bg-rose-950/10' : 'bg-cyan-950/10'}`}>
        {/* Interactive Display - Click to Position Cursor */}
        <div 
          onClick={() => {
            const input = isP1 ? game?.p1Input : game?.p2Input;
            setGame(g => g ? (isP1 ? { ...g, p1Cursor: input?.length || 0 } : { ...g, p2Cursor: input?.length || 0 }) : null);
          }}
          className={`h-20 mb-8 border-b-2 ${isP1 ? 'border-rose-500 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.7)]' : 'border-cyan-500 shadow-[0_4px_20px_-4px_rgba(6,182,212,0.7)]'} flex items-center px-4 relative cursor-pointer group/display transition-all hover:border-b-4`}
        >
          <div className={`absolute inset-0 bg-gradient-to-t ${isP1 ? 'from-rose-500/15' : 'from-cyan-500/15'} to-transparent opacity-0 group-hover/display:opacity-100 transition-opacity`} />
          <div className="flex items-center text-5xl font-mono font-black text-white relative z-10 tracking-[0.25em]">
            {(isP1 ? game?.p1Input : game?.p2Input)?.split('').map((char, idx) => (
              <span 
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setGame(g => g ? (isP1 ? { ...g, p1Cursor: idx } : { ...g, p2Cursor: idx }) : null);
                }}
                className="relative hover:bg-white/10 transition-colors"
              >
                {idx === (isP1 ? game?.p1Cursor : game?.p2Cursor) && (
                  <motion.span 
                    animate={{ opacity: [1, 0, 1] }} 
                    transition={{ repeat: Infinity, duration: 1 }} 
                    className={`absolute -left-1 top-0 w-1.5 h-12 ${isP1 ? 'bg-rose-400' : 'bg-cyan-400'}`} 
                  />
                )}
                {char}
              </span>
            ))}
            {(isP1 ? game?.p1Cursor : game?.p2Cursor) === (isP1 ? game?.p1Input : game?.p2Input)?.length && (
              <motion.span 
                animate={{ opacity: [1, 0, 1] }} 
                transition={{ repeat: Infinity, duration: 1 }} 
                className={`w-1.5 h-12 ${isP1 ? 'bg-rose-400' : 'bg-cyan-400'} ml-1`} 
              />
            )}
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/display:opacity-100 transition-opacity">
            <RotateCcw size={24} className={isP1 ? 'text-rose-400' : 'text-cyan-400'} />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-5 flex-1">
          {keys.map((key, i) => (
            <button
              key={i}
              onClick={() => handleInput(player, key)}
              className={`h-20 rounded-2xl bg-slate-900/40 backdrop-blur-md border-2 ${isP1 ? 'border-rose-500/20 hover:border-rose-500/60' : 'border-cyan-500/20 hover:border-cyan-500/60'} text-2xl font-black text-white active:translate-y-1 transition-all flex items-center justify-center relative group overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${isP1 ? 'from-rose-500/10' : 'from-cyan-500/10'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              <span className="relative z-10">{key}</span>
            </button>
          ))}
          <button
            onClick={() => handleSubmit(player)}
            className={`col-span-3 h-24 rounded-3xl bg-gradient-to-r ${colorClass} ${shadowClass} shadow-lg text-3xl font-black text-white active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 border-t border-white/20`}
          >
            <Star className="fill-current animate-spin-slow" /> 摘星提交
          </button>
        </div>

        {/* Freeze Overlay */}
        <AnimatePresence>
          {isFrozen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 z-20 rounded-[3rem] backdrop-blur-sm flex flex-col items-center justify-center ${isP1 ? 'bg-rose-900/60' : 'bg-cyan-900/60'}`}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="bg-white/10 p-6 rounded-full border-2 border-white/30 mb-4"
              >
                <RotateCcw size={48} className="text-white animate-spin-slow" />
              </motion.div>
              <h3 className="text-3xl font-black text-white tracking-widest">引擎冷却中...</h3>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#02040a] overflow-hidden font-sans select-none">
      {/* Deep Space Background with Multiple Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#0a0f1d_0%,_#02040a_100%)]" />
      
      {/* Star Field Background (Static) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Distant Stars (Small, static) */}
        {Array.from({ length: 400 }).map((_, i) => (
          <div 
            key={`distant-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 1.5 + 0.5 + 'px',
              height: Math.random() * 1.5 + 0.5 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.4 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Floating Planets/Nebula Elements (Static) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 -right-40 w-[900px] h-[900px] bg-purple-900/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-1/3 w-[1000px] h-[1000px] bg-blue-900/5 rounded-full blur-[200px]" />
      </div>

      {/* Header / Exit */}
      <div className="absolute top-6 left-6 z-[110]">
        <button 
          onClick={onExit}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white transition-all group"
        >
          <X size={24} className="group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {view === 'menu' && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="h-full flex flex-col items-center justify-center relative z-10"
          >
            <div className="mb-16 text-center relative">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  filter: ["drop-shadow(0 0 15px rgba(245,158,11,0.2))", "drop-shadow(0 0 30px rgba(245,158,11,0.4))", "drop-shadow(0 0 15px rgba(245,158,11,0.2))"]
                }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="inline-block p-8 bg-black/40 backdrop-blur-xl rounded-[3.5rem] border border-amber-500/30 mb-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
              >
                <div className="relative">
                  <Star size={100} className="text-amber-400 fill-amber-400/20 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]" />
                  <motion.div 
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Star size={100} className="text-amber-400 fill-amber-400 opacity-20 blur-sm" />
                  </motion.div>
                </div>
              </motion.div>
              
              <h1 className="text-8xl font-black tracking-tighter mb-6 relative">
                <span className="absolute inset-0 text-white blur-xl opacity-20">摘星24点大作战</span>
                <span className="relative bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
                  摘星24点大作战
                </span>
              </h1>
              
              <div className="flex items-center justify-center gap-6">
                <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                <p className="text-amber-200/60 font-black tracking-[0.8em] uppercase text-sm drop-shadow-md">Star Quest: 24 Points Battle</p>
                <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
              </div>
              <p className="mt-6 text-slate-500 font-medium tracking-[0.4em] text-xs opacity-60">星 际 探 险 · 极 限 思 维 · 摘 星 之 旅</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl px-6">
              <button 
                onClick={() => { setMode('training'); setView('login'); }}
                className="group relative p-10 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] hover:border-rose-500/30 transition-all duration-500 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="p-6 bg-rose-500/10 rounded-3xl text-rose-400 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                    <Rocket size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-3 tracking-tight group-hover:text-rose-400 transition-colors">星际训练</h2>
                  <p className="text-slate-500 text-sm font-bold tracking-wide group-hover:text-slate-400 transition-colors">BO3 练习模式 · 磨炼心算</p>
                </div>
              </button>

              <button 
                onClick={() => { setMode('ranked'); setView('login'); }}
                className="group relative p-10 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] hover:border-cyan-500/30 transition-all duration-500 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="p-6 bg-cyan-500/10 rounded-3xl text-cyan-400 mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                    <Orbit size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-3 tracking-tight group-hover:text-cyan-400 transition-colors">排位征战</h2>
                  <p className="text-slate-500 text-sm font-bold tracking-wide group-hover:text-slate-400 transition-colors">BO5 竞技模式 · 争夺星冠</p>
                </div>
              </button>

              <button 
                onClick={() => setView('leaderboard')}
                className="sm:col-span-2 group relative p-8 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] hover:border-amber-500/30 transition-all duration-500 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-center gap-8">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 12, ease: "linear" }}>
                    <Sparkles className="text-amber-500/40" size={24} />
                  </motion.div>
                  <span className="text-2xl font-black text-slate-300 tracking-[0.5em] group-hover:text-amber-400 transition-colors">查看星际风云榜</span>
                  <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 12, ease: "linear" }}>
                    <Sparkles className="text-amber-500/40" size={24} />
                  </motion.div>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {view === 'login' && (
          <motion.div 
            key="login"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="h-full flex flex-col items-center justify-center relative z-10 px-6"
          >
            <div className="bg-slate-900/80 backdrop-blur-2xl border-2 border-white/10 p-12 rounded-[3rem] w-full max-w-xl shadow-2xl">
              <h2 className="text-4xl font-black text-white text-center mb-12 flex items-center justify-center gap-4">
                <User size={40} className="text-indigo-400" /> 宇航员登入
              </h2>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-slate-400 font-black mb-3 ml-2 uppercase tracking-widest text-sm">左侧玩家学号</label>
                  <input 
                    type="number" 
                    min="1"
                    value={p1Id}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || parseInt(val) >= 0) {
                        setP1Id(val);
                      }
                    }}
                    placeholder="请输入学号"
                    className="w-full h-20 bg-black/50 border-2 border-white/10 rounded-2xl px-6 text-2xl font-black text-white focus:border-rose-500/50 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-black mb-3 ml-2 uppercase tracking-widest text-sm">右侧玩家学号</label>
                  <input 
                    type="number" 
                    min="1"
                    value={p2Id}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || parseInt(val) >= 0) {
                        setP2Id(val);
                      }
                    }}
                    placeholder="请输入学号"
                    className="w-full h-20 bg-black/50 border-2 border-white/10 rounded-2xl px-6 text-2xl font-black text-white focus:border-cyan-500/50 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                <button 
                  onClick={() => setView('menu')}
                  className="flex-1 h-20 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft /> 返回
                </button>
                <button 
                  onClick={() => {
                    if (p1Id && p2Id && p1Id !== p2Id) initGame();
                    else showNotification('请输入不同的有效学号', 'warning');
                  }}
                  className="flex-[2] h-20 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-900/50 transition-all flex items-center justify-center gap-2"
                >
                  开始探索 <Play fill="currentColor" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'playing' && game && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex relative"
          >
            {/* Top Cards Area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pt-8 flex flex-col items-center">
              <div className="flex gap-6 mb-6">
                {game.numbers.map((num, i) => renderCard(num, i))}
              </div>
              
              {/* Score HUD */}
              <div className="flex items-center gap-10 bg-slate-950/80 backdrop-blur-2xl border-2 border-amber-400/30 px-10 py-3 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{p1Id}</span>
                    <span className="text-sm font-black text-white">{p1Name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star size={24} className="text-rose-400 fill-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
                    <span className="text-3xl font-black text-white">{game.p1Score}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className="text-[10px] font-black text-amber-400/60 uppercase tracking-[0.4em]">
                    Round {game.currentRound} / {game.maxRounds}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-white">{game.p2Score}</span>
                    <Star size={24} className="text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{p2Id}</span>
                    <span className="text-sm font-black text-white">{p2Name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Capsule Timers */}
            <div className="absolute top-6 left-6 z-50">
              <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-xl border border-rose-500/30 px-5 py-2 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                <Timer size={18} className={game.timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-rose-400'} />
                <span className={`text-xl font-mono font-black ${game.timeLeft <= 10 ? 'text-rose-500' : 'text-white'}`}>
                  {game.timeLeft}s
                </span>
              </div>
            </div>

            <div className="absolute top-6 right-6 z-50">
              <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-xl border border-cyan-500/30 px-5 py-2 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                <span className={`text-xl font-mono font-black ${game.timeLeft <= 10 ? 'text-rose-500' : 'text-white'}`}>
                  {game.timeLeft}s
                </span>
                <Timer size={18} className={game.timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'} />
              </div>
            </div>

            {/* Players Split Screen */}
            <div className="flex-1 border-r border-white/5">
              {renderKeyboard('p1')}
            </div>
            <div className="flex-1">
              {renderKeyboard('p2')}
            </div>

            {/* Scoring Star Animation */}
            <AnimatePresence>
              {scoringEffect && (
                <motion.div
                  initial={{ 
                    x: scoringEffect === 'p1' ? '25%' : '75%', 
                    y: '70%', 
                    scale: 1, 
                    opacity: 1 
                  }}
                  animate={{ 
                    x: scoringEffect === 'p1' ? '40%' : '60%', 
                    y: '10%', 
                    scale: 2, 
                    opacity: 0 
                  }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="absolute z-[150] pointer-events-none"
                >
                  <Star size={64} className="text-amber-400 fill-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.8)]" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Winner Overlay */}
            <AnimatePresence>
              {game.timeoutAnswer && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 z-[180] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8"
                >
                  <div className="bg-slate-900 border-2 border-amber-500/50 p-10 rounded-[3rem] text-center shadow-[0_0_50px_rgba(245,158,11,0.3)]">
                    <AlertCircle size={64} className="text-amber-400 mx-auto mb-6" />
                    <h3 className="text-4xl font-black text-white mb-4">时间到！无人摘星</h3>
                    <p className="text-slate-400 font-bold mb-8">本局平局，参考答案如下：</p>
                    <div className="bg-black/50 p-6 rounded-2xl border border-white/10 mb-2">
                      <span className="text-5xl font-mono font-black text-amber-400 tracking-widest">
                        {game.timeoutAnswer} = 24
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {game.winner && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-12"
                >
                  <motion.div
                    initial={{ scale: 0.5, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="text-center"
                  >
                    <div className="inline-block p-8 bg-amber-500/20 rounded-[3rem] border-4 border-amber-500/50 shadow-[0_0_100px_rgba(245,158,11,0.5)] mb-12">
                      <Trophy size={120} className="text-amber-400" />
                    </div>
                    <h2 className="text-8xl font-black text-white mb-4 tracking-tighter">
                      {game.winner === 'draw' ? '平分秋色' : (game.winner === 'p1' ? `摘星之王 ${game.p1Id}` : `摘星之王 ${game.p2Id}`)}
                    </h2>
                    <p className="text-4xl font-black text-amber-400 uppercase tracking-widest mb-16">
                      {game.winner === 'draw' ? 'DRAW' : '摘星成功 STAR PICKED'}
                    </p>
                    
                    <div className="flex gap-6">
                      <button 
                        onClick={() => setView('menu')}
                        className="px-12 h-24 bg-slate-800 hover:bg-slate-700 text-white text-2xl font-black rounded-3xl transition-all flex items-center gap-3"
                      >
                        <ChevronLeft size={32} /> 返回大厅
                      </button>
                      <button 
                        onClick={initGame}
                        className="px-12 h-24 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-2xl font-black rounded-3xl shadow-xl shadow-amber-900/50 transition-all flex items-center gap-3"
                      >
                        再战一局 <RotateCcw size={32} />
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {view === 'leaderboard' && (
          <motion.div 
            key="leaderboard"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="h-full flex flex-col items-center justify-center relative z-10 px-6"
          >
            <div className="bg-slate-900/80 backdrop-blur-2xl border-2 border-white/10 p-10 rounded-[3rem] w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-4xl font-black text-white flex items-center gap-4">
                  <Crown size={40} className="text-amber-400" /> 星空风云榜
                </h2>
                <button 
                  onClick={() => setView('menu')}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-900 z-10">
                    <tr className="text-slate-500 uppercase tracking-widest text-xs font-black">
                      <th className="pb-6 pl-4">排名</th>
                      <th className="pb-6">宇航员</th>
                      <th className="pb-6">探索次数</th>
                      <th className="pb-6">摘星</th>
                      <th className="pb-6">迷失</th>
                      <th className="pb-6 pr-4 text-right">胜率</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leaderboard.length > 0 ? leaderboard.map((p, i) => (
                      <tr key={p.studentId} className="group hover:bg-white/5 transition-colors">
                        <td className="py-6 pl-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                            i === 0 ? 'bg-amber-500 text-slate-900' : 
                            i === 1 ? 'bg-slate-300 text-slate-900' : 
                            i === 2 ? 'bg-amber-700 text-white' : 
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {i + 1}
                          </div>
                        </td>
                        <td className="py-6">
                          <span className="text-xl font-black text-white">{p.studentId}</span>
                        </td>
                        <td className="py-6 text-slate-400 font-bold">{p.totalGames}</td>
                        <td className="py-6 text-emerald-400 font-bold">{p.wins}</td>
                        <td className="py-6 text-rose-400 font-bold">{p.losses}</td>
                        <td className="py-6 pr-4 text-right">
                          <span className="text-2xl font-black text-indigo-400">{p.winRate.toFixed(1)}%</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="py-20 text-center text-slate-500 font-bold text-xl">
                          暂无探索记录，快去开启你的星际征程吧！
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
