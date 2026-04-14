import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, Trophy, Search, User, Users, Lock, Unlock, Save, Award, TrendingUp, 
  Medal, Gift, X, Loader, Sparkles, Zap, Package, Edit2, Edit3, ChevronRight, Hash, 
  StarHalf, CheckCircle2, AlertCircle, RotateCcw, Plus, Undo2, Trash2, KeyRound, 
  Fingerprint, Crown, Rocket, Download, Upload, History, Megaphone, HelpCircle, 
  MessageCircle, Smile, UserPlus, UserMinus, Coins, ChevronLeft, Ticket, ArrowLeft,
  Settings, ArrowRightLeft, BookOpen, PenTool, Shield, AlertTriangle, Camera,
  ScrollText, MinusCircle, Minus, CalendarDays, Calendar, Dices, RotateCw, BrainCircuit, Calculator, CheckCircle, Check,
  Gamepad2, Target, Shapes, ClipboardList, GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as LucideIcons from 'lucide-react';
import Game24 from './components/Game24';
import HomeworkSubmissionList from './components/HomeworkSubmissionList';
import ClassLogo from './components/ClassLogo';
import GeoBackground from './components/GeoBackground';
import { GeoStatsPanel } from './components/GeoStats';
import GeoTower from './components/GeoTower';
import { generateDailyEncouragement, analyzeClassData, generateSpeedEncouragement, analyzeDailyLogs, generateStudentEvaluation } from './services/qwenService';

// --- 类型定义 ---
interface Student {
  id: number;
  name: string;
  groupId: number;
  totalStars: number;
  availableStars: number;
  avatar: string | null;
}

interface Log {
  id: number;
  studentId: number;
  studentName: string;
  amount: number;
  reason: string;
  timestamp: string;
  dateKey: string;
  taskId?: string;
}

interface Prize {
  id: string;
  tier?: number;
  level: string;
  name: string;
  probability: number;
  stock: number | null;
  color: string;
  items: string[];
}

interface PendingPrize {
  id: number;
  studentId: number;
  studentName: string;
  tierName: string;
  prizeName: string;
  color: string;
  timestamp: string;
  redeemedAt?: string;
}

// --- 可拖拽组件 ---
const SortableVisualizationItem = (props: { 
  viz: Visualization; 
  onDelete: (id: string) => void;
  onOpen: (viz: Visualization) => void;
  key?: string;
}) => {
  const { viz, onDelete, onOpen } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: viz.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-colors"></div>
      
      <div className="relative z-10 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div 
              {...attributes} 
              {...listeners}
              className="p-2 text-slate-300 hover:text-emerald-500 cursor-grab active:cursor-grabbing transition-colors"
            >
              <GripVertical size={20} />
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shadow-sm border border-emerald-100 group-hover:scale-110 transition-transform duration-500">
              <BookOpen size={20} />
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(viz.id); }}
            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
        
        <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">{viz.title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
          {viz.description || '暂无描述'}
        </p>
      </div>
      
      <button 
        onClick={() => onOpen(viz)}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center relative z-10"
      >
        <Zap size={18} className="mr-2"/> 
        {(['作业本p1.4', '作业本p28.4', '数学书p21', '探索“排水法”求体积', '探索图形', '数学书p43（宫灯）', '月任务：立体蛋糕', '第三单元讲解', '分数解决问题'].includes(viz.id)) ? '立即跳转' : '立即探索'}
      </button>
    </div>
  );
};

const DroppableCategory = ({ 
  id, 
  title, 
  items, 
  onDelete, 
  onOpen 
}: { 
  id: string; 
  title: string; 
  items: Visualization[]; 
  onDelete: (id: string) => void;
  onOpen: (viz: Visualization) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
        <h3 className="text-2xl font-black text-slate-800">{title}</h3>
        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-sm font-bold">
          {items.length}
        </span>
      </div>
      
      <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
        <div 
          ref={setNodeRef}
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[200px] p-4 rounded-[2.5rem] transition-all duration-300 ${
            isOver ? 'bg-emerald-50 ring-4 ring-emerald-200 ring-inset' : 
            items.length === 0 ? 'bg-slate-50 border-4 border-dashed border-slate-200' : 'bg-slate-50/30'
          }`}
        >
          {items.map((viz) => (
            <SortableVisualizationItem 
              key={viz.id} 
              viz={viz} 
              onDelete={onDelete} 
              onOpen={onOpen} 
            />
          ))}
          {items.length === 0 && !isOver && (
            <div className="col-span-full flex flex-col items-center justify-center text-slate-400 py-12">
              <ArrowRightLeft size={48} className="mb-4 opacity-20" />
              <p className="font-bold">拖拽题目到此处进行分类</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

interface TeamStat {
  id: number;
  name: string;
  members: Student[];
  totalStars: number;
}

interface MathLifeTask {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly';
  reward: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'archived';
  awardedStudents?: { studentId: number; name: string; stars: number }[];
}

interface MathGame {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string; // Icon name from lucide-react
  color: string; // Tailwind color class
}

interface Visualization {
  id: string;
  title: string;
  description: string;
  htmlContent: string;
  createdAt: string;
  category?: '教材' | '作业本' | '周、月任务' | '试卷分析';
}

interface WeeklyChampion {
  weekKey: string;
  teamId: number;
  totalStars: number;
  startDate: string;
  endDate: string;
}

// --- 初始数据与配置 ---
const rawStudents = [
  { id: 1, name: '陈梓豪' }, { id: 2, name: '潘昊宇' }, { id: 3, name: '戴宥宸' }, { id: 4, name: '何诺' },
  { id: 5, name: '李梓冉' }, { id: 6, name: '胡景畅' }, { id: 7, name: '林当' }, { id: 8, name: '楼文恺' },
  { id: 9, name: '楼翊辰' }, { id: 10, name: '邵梓聪' }, { id: 11, name: '王绍丞' }, { id: 12, name: '王诗晨' },
  { id: 13, name: '王煜宸' }, { id: 14, name: '尹晨鑫' }, { id: 16, name: '张嘉懿' }, { id: 17, name: '张睿翔' },
  { id: 18, name: '高诚锴' }, { id: 21, name: '蔡晨欣' }, { id: 22, name: '曹珺涵' }, { id: 23, name: '柴依晴' },
  { id: 24, name: '陈与韩' }, { id: 25, name: '陈臻' }, { id: 26, name: '褚佳倪' }, { id: 27, name: '戴欣蕾' },
  { id: 28, name: '方思' }, { id: 29, name: '方子颖' }, { id: 30, name: '蒋羽涵' }, { id: 31, name: '齐悦彤' },
  { id: 32, name: '钱诗文' }, { id: 33, name: '沈梦莹' }, { id: 34, name: '沈昕妍' }, { id: 35, name: '汪艺宣' },
  { id: 36, name: '王裳洁' }, { id: 37, name: '王晨熹' }, { id: 38, name: '项小凡' }, { id: 39, name: '杨菲' },
  { id: 40, name: '杨彧' }, { id: 41, name: '叶洛菡' }, { id: 42, name: '张恩惠' }, { id: 43, name: '朱欣悦' }
];

const INITIAL_STUDENTS = rawStudents.map((s, index) => ({
  ...s,
  groupId: Math.floor(index / 4) + 1,
  totalStars: 0,     // 经验值：只增不减（惩罚除外），用于排名
  availableStars: 0, // 流通币：用于抽奖消耗
  avatar: null
}));

const GACHA_MODES = [
  { 
    id: 1, 
    name: "基础探索", 
    cost: 15, 
    description: "基础探索模式，适合日常练手",
    weights: { tier1: 0, tier2: 5, tier3: 25, tier4: 70 }
  },
  { 
    id: 2, 
    name: "进阶探索", 
    cost: 30, 
    description: "进阶探索，更高概率获得稀有奖项",
    weights: { tier1: 5, tier2: 15, tier3: 50, tier4: 30 }
  },
  { 
    id: 3, 
    name: "深度探索", 
    cost: 60, 
    description: "深度探索，排除四等奖，保底三等奖",
    weights: { tier1: 10, tier2: 60, tier3: 30, tier4: 0 }
  },
  { 
    id: 4, 
    name: "终极探索", 
    cost: 80, 
    description: "终极探索，必中一等奖！",
    weights: { tier1: 100, tier2: 0, tier3: 0, tier4: 0 }
  }
];

const INITIAL_PRIZES = [
  { 
    id: 'tier4', 
    tier: 4,
    level: "四等奖", 
    name: "星尘盲盒", 
    probability: 50, 
    stock: 999, 
    color: "bg-slate-500", 
    items: [
      "神笔马良（特殊笔）", 
      "甜蜜补给（糖果/饼干）", 
      "美丽绷带（修正带）", 
      "粗心橡皮擦（抵消粗心扣分）", 
      "星空测量仪（直尺）", 
      "星空测量仪（量角器）", 
      "星空测量仪（圆规）"
    ] 
  },
  { 
    id: 'tier3', 
    tier: 3,
    level: "三等奖", 
    name: "行星护卫", 
    probability: 30, 
    stock: 999, 
    color: "bg-blue-500", 
    items: [
      "快乐能量包（进阶零食）", 
      "免死金牌（抵消任意常规扣分）", 
      "好友同享卡（除一等奖外奖励共享）", 
      "课间DJ（允许课前播放任意音乐）", 
      "隐形披风（练习或抄题作业中，免抄题目，仅写答案）"
    ] 
  },
  { 
    id: 'tier2', 
    tier: 2,
    level: "二等奖", 
    name: "几何舰队", 
    probability: 15, 
    stock: 28, 
    color: "bg-purple-500", 
    items: [
      "智慧宝库（课外书/高阶魔方）", 
      "特邀车模体验", 
      "桌面小摆件", 
      "减负光波（当天常规数学作业全免特权）", 
      "几何大师套装（高颜值厚草稿本+精美套尺）"
    ] 
  },
  { 
    id: 'tier1', 
    tier: 1,
    level: "一等奖", 
    name: "宇宙奇观", 
    probability: 5, 
    stock: 4, 
    color: "bg-amber-500", 
    items: [
      "金总霸王餐（KFC小食桶）", 
      "学霸特权（一周常规计算免做）", 
      "万能神灯（合理愿望）", 
      "时空折叠卡（免除一次完整的周末数学大作业或常规卷）"
    ] 
  },
];

const ACTION_REASONS = [
  // --- 个人专属操作 ---
  { label: "完美作业", score: 1, type: 'success', target: 'personal' },
  { label: "周末完美作业", score: 1, type: 'success', target: 'personal' },
  { label: "周周练全对", score: 2, type: 'success', target: 'personal' },
  { label: "今日事今日毕", score: 0.5, type: 'success', target: 'personal' },
  { label: "周末作业清零", score: 0.5, type: 'success', target: 'personal' },
  { label: "口算达标并订正", score: 0.5, type: 'success', target: 'personal' },
  { label: "规范作图", score: 0.5, type: 'success', target: 'personal' },
  { label: "锋芒毕露(讲解)", score: 1, type: 'success', target: 'personal' },
  { label: "深度思考(提问)", score: 1, type: 'success', target: 'personal' },
  { label: "积极互动", score: 0.5, type: 'success', target: 'personal' },
  { label: "金总鼓励奖", score: 0.5, type: 'special', target: 'personal' },
  { label: "思维突破", score: 5, type: 'warning', target: 'personal' },
  { label: "单元闯关", score: 10, type: 'warning', target: 'personal' },
  { label: "生活数学家", score: 5, type: 'warning', target: 'personal' },
  { label: "拖欠作业", score: -2, type: 'danger', target: 'personal' },
  { label: "忘带学具", score: -0.5, type: 'danger', target: 'personal' },
  { label: "扰乱课堂", score: -1, type: 'danger', target: 'personal' },
  { label: "抄袭作假(红线)", score: -5, type: 'danger', target: 'personal' },

  // --- 团队专属操作 ---
  { label: "全员清零(当日)", score: 0.5, type: 'success', target: 'team' },
  { label: "团队:优秀智囊", score: 1, type: 'info', target: 'team' },
  { label: "共同进退(大考)", score: 5, type: 'warning', target: 'team' },
  { label: "课堂纪律待加强", score: -1, type: 'danger', target: 'team' },
  { label: "团队短板(连带)", score: -5, type: 'danger', target: 'team' },
];

const PRIZE_VERSION = '20260330_v2';

export default function App() {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('504_v2_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });
  
  const [prizes, setPrizes] = useState<Prize[]>(() => {
    const saved = localStorage.getItem('504_v2_prizes');
    return saved ? JSON.parse(saved) : INITIAL_PRIZES;
  });

  const [logs, setLogs] = useState<Log[]>(() => {
    const saved = localStorage.getItem('504_v2_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [pendingPrizes, setPendingPrizes] = useState<PendingPrize[]>(() => {
    const saved = localStorage.getItem('504_v2_pending');
    return saved ? JSON.parse(saved) : [];
  });

  const [redeemedHistory, setRedeemedHistory] = useState<PendingPrize[]>(() => {
    const saved = localStorage.getItem('504_v2_redeemed');
    return saved ? JSON.parse(saved) : [];
  });

  const [teamBonuses, setTeamBonuses] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('504_v2_team_bonuses');
    return saved ? JSON.parse(saved) : {};
  });

  const [teamNames, setTeamNames] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('504_v2_team_names');
    return saved ? JSON.parse(saved) : {};
  });

  const [incompleteHomeworks, setIncompleteHomeworks] = useState<Record<string, number[]>>(() => {
    const saved = localStorage.getItem('504_v2_incomplete_homeworks');
    return saved ? JSON.parse(saved) : {};
  });

  const [incompleteRemarks, setIncompleteRemarks] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('504_v2_incomplete_remarks');
    return saved ? JSON.parse(saved) : {};
  });

  const [hiddenOverdueDates, setHiddenOverdueDates] = useState<string[]>(() => {
    const saved = localStorage.getItem('504_v2_hidden_overdue_dates');
    return saved ? JSON.parse(saved) : [];
  });

  const [mathLifeTasks, setMathLifeTasks] = useState<MathLifeTask[]>(() => {
    const saved = localStorage.getItem('504_v2_math_life_tasks');
    let tasks = saved ? JSON.parse(saved) : [];
    
    // 自动导入第一个任务：空间魔术师
    const firstTaskId = "task-space-magician-20260306";
    if (!tasks.some((t: any) => t.id === firstTaskId)) {
      const firstTask: MathLifeTask = {
        id: firstTaskId,
        title: "数学生活家——空间魔术师！",
        description: `📢 周末挑战：数学生活家——空间魔术师！
各位探险家，本周我们要玩个“空间魔术”，把平面的纸变成立体图形，挑战你的空间想象力！
🚀 【通关任务】
1. 动手制作（画、剪、拼）
用硬纸板选一种你喜欢的平面展开图（如 1-4-1、2-3-1、2-2-2 或 3-3 型），画好剪下，拼搭成一个长方体或正方体。
2. 打卡讲解（拍、传、说）
拍下照片或录一段拼搭视频发到【班级圈】。
⚠️ 关键要求： 视频或照片配文中，必须像小老师一样介绍：“我用的是（ ）型展开图，它的长（  ）厘米、宽（  ）厘米、高（  ）厘米！”
🌟 【星空系统奖励】
🎖️ 基础奖： 班级圈成功打卡，获 【生活数学家】（+4星）！
👑 高阶奖： 视频讲解声音洪亮、长宽高数据完全准确，额外触发 【锋芒毕露】（+6星）！
⏰ 截止时间： 本周日晚 20:00 前。

期待你们的精彩魔术，班级圈见！✨`,
        type: 'weekly',
        reward: '4-6',
        createdAt: new Date().toISOString(),
        startDate: '2026.3.6',
        endDate: '2026.3.8',
        status: 'active',
        awardedStudents: []
      };
      tasks = [firstTask, ...tasks];
    }

    // 自动导入新任务：空间测量局
    const newTaskId = "task-space-measurement-20260313";
    if (!tasks.some((t: any) => t.id === newTaskId)) {
      const newTask: MathLifeTask = {
        id: newTaskId,
        title: "数学生活家——空间测量局",
        description: `📢 周末挑战：数学生活家——空间测量局！
各位探险家，本周我们要给家里的物品“量体裁衣”，用尺子和计算探秘隐藏在家里的空间密码！
🚀 【通关任务】
寻找测量（找、量、记）
在家中分别找出一个你认为“最大”和一个“最小”的长方体（或正方体）物品（例如：大衣柜、小橡皮、冰箱、药盒等）。用直尺或卷尺准确测量出它们的长、宽、高数据。
计算打卡（算、拍、说）
根据测量的数据，计算出这两个物品的真实体积。拍下物品照片或录制一段测量讲解视频发到【班级圈】。
⚠️ 关键要求：
视频或照片配文中，像小老师一样介绍：“最大的长方体是（ ），它的长、宽、高分别是（ ）、（ ）、（ ），体积是（ ）；最小的是（ ），它的长、宽、高分别是（ ）、（ ）、（ ），体积是（ ）！”
🌟 【星空系统奖励】
🎖️ 基础奖：班级圈成功打卡，获【生活数学家】（+4星）！
👑 高阶奖：视频讲解声音洪亮、测量数据与体积计算准确，额外触发【锋芒毕露】（+5星）！
⏰ 截止时间：本周日晚 20:00 前。
期待你们的精彩测量，班级圈见！✨`,
        type: 'weekly',
        reward: '4-5',
        createdAt: new Date().toISOString(),
        startDate: '2026.3.13',
        endDate: '2026.3.15',
        status: 'active',
        awardedStudents: []
      };
      tasks = [newTask, ...tasks];
    }

    // 自动导入月度任务：立体蛋糕设计师
    const monthlyTaskId = "task-cake-designer-20260320";
    if (!tasks.some((t: any) => t.id === monthlyTaskId)) {
      const monthlyTask: MathLifeTask = {
        id: monthlyTaskId,
        title: "数学创想家——立体蛋糕设计师！",
        description: `📢 本月挑战：数学创想家——立体蛋糕设计师！
各位探险家，为了庆祝我们的数学世界取得阶段性胜利，几何后勤部需要大家亲手设计一款“三层立体庆典蛋糕”！本次任务分为基础与高阶两部分，量力而行，挑战自我！
🚀 【通关任务】
1.寻找与拼搭（造蛋糕）在家中寻找3个大小递减的长方体（或正方体）纸盒（例如：鞋盒、药盒、香皂盒等）。像叠罗汉一样，将它们居中叠放，用双面胶固定，做成一个三层蛋糕模型。
2.基础测算（全员必做：算体积）用直尺分别测量这三个盒子的长、宽、高。计算制作这个三层蛋糕总共需要多少立方厘米的“蛋糕胚”（即求三个盒子的总体积）。
3.进阶挑战（学霸选做：算奶油面积）蛋糕做好了，我们需要在外部涂满诱人的“奶油”（注意：最底下的面贴着桌面不涂，盒子互相重叠压住的部分也不涂）。请你精确计算，涂抹奶油的总面积是多少平方厘米？
4.💡 隐藏提示：你能找出比“算出三个总表面积再一点点减去重叠面”更快的简便算法吗？私信金老师可获得提示
⚠️ 关键打卡要求：
拍下你的蛋糕作品发到【班级圈】。配文或视频中必须像小老师一样讲解：“我的三层蛋糕总体积是（ ）；涂奶油的面积是（ ）平方厘米，我是用（具体怎么算的/发现了什么简便方法）算出来的！”
🌟 【星空系统奖励】
🎖️ 基础奖：完成模型拼搭与体积计算，班级圈打卡成功，获【生活数学家】（+5星）！
👑 高阶奖：成功算出“奶油面积”，且视频讲解思路清晰、数据准确，额外触发【思维突破】（+10星）！
⏰ 截止时间：本月底 20:00 前。
期待看到你们独一无二的蛋糕设计，班级圈见！✨`,
        type: 'monthly',
        reward: '5-10',
        createdAt: new Date().toISOString(),
        startDate: '2026.3.20',
        endDate: '2026.3.31',
        status: 'active',
        awardedStudents: []
      };
      tasks = [monthlyTask, ...tasks];
    }
    return tasks;
  });

  const [visualizations, setVisualizations] = useState<Visualization[]>(() => {
    const saved = localStorage.getItem('504_v2_visualizations');
    let initial = saved ? JSON.parse(saved) : [];
    
    // Ensure all existing items have a category
    initial = initial.map((v: any) => {
      // Force correct category for hardcoded IDs
      if (v.id === '作业本p1.4') return { ...v, category: '作业本' };
      if (v.id === '作业本p28.4') return { ...v, category: '作业本' };
      if (v.id === '月任务：立体蛋糕') return { ...v, category: '周、月任务' };
      if (v.id === '第三单元讲解') return { ...v, category: '试卷分析' };
      if (['数学书p21', '探索“排水法”求体积', '探索图形', '数学书p43（宫灯）', '分数解决问题'].includes(v.id)) {
        return { ...v, category: '教材' };
      }
      if (v.category) return v;
      return { ...v, category: '教材' }; // Default for custom items
    });
    
    // Add the new items if not exists
    if (!initial.some((v: any) => v.id === '分数解决问题')) {
        initial.push({
            id: '分数解决问题',
            title: '分数解决问题',
            description: '点击跳转到分数解决问题可视化工具',
            htmlContent: '',
            createdAt: new Date().toISOString(),
            category: '教材'
        });
    }
    if (!initial.some((v: any) => v.id === '作业本p1.4')) {
        initial.push({
            id: '作业本p1.4',
            title: '作业本p1.4',
            description: '点击跳转到作业本p1.4',
            htmlContent: '',
            createdAt: new Date().toISOString(),
            category: '作业本'
        });
    }
    if (!initial.some((v: any) => v.id === '作业本p28.4')) {
        initial.push({
            id: '作业本p28.4',
            title: '作业本p28.4',
            description: '点击跳转到作业本p28.4',
            htmlContent: '',
            createdAt: new Date().toISOString(),
            category: '作业本'
        });
    }
    if (!initial.some((v: any) => v.id === '月任务：立体蛋糕')) {
        initial.push({
            id: '月任务：立体蛋糕',
            title: '月任务：立体蛋糕',
            description: '点击跳转到月任务：立体蛋糕可视化工具',
            htmlContent: '',
            createdAt: new Date().toISOString(),
            category: '周、月任务'
        });
    }
    if (!initial.some((v: any) => v.id === '数学书p21')) {
        initial.push({
            id: '数学书p21',
            title: '数学书p21',
            description: '点击跳转到数学书p21可视化工具',
            htmlContent: '',
            createdAt: new Date().toISOString(),
            category: '教材'
        });
    }
    if (!initial.some((v: any) => v.id === '探索“排水法”求体积')) {
        initial.push({
            id: '探索“排水法”求体积',
            title: '探索“排水法”求体积',
            description: '点击跳转到探索“排水法”求体积交互式学习单',
            htmlContent: '',
            createdAt: new Date().toISOString(),
            category: '教材'
        });
    }
    if (!initial.some((v: any) => v.id === '探索图形')) {
        initial.push({
            id: '探索图形',
            title: '探索图形',
            description: '点击跳转到探索图形可视化工具',
            htmlContent: '',
            createdAt: new Date().toISOString(),
            category: '教材'
        });
    }
    if (!initial.some((v: any) => v.id === '数学书p43（宫灯）')) {
        initial.push({
            id: '数学书p43（宫灯）',
            title: '数学书p43（宫灯）',
            description: '点击跳转到数学书p43（宫灯）可视化工具',
            htmlContent: '',
            createdAt: new Date().toISOString(),
            category: '教材'
        });
    }
    if (!initial.some((v: any) => v.id === '第三单元讲解')) {
        initial.push({
            id: '第三单元讲解',
            title: '第三单元讲解',
            description: '点击跳转到第三单元试卷讲解',
            htmlContent: '',
            createdAt: new Date().toISOString(),
            category: '试卷分析'
        });
    }
    return initial;
  });

  const [weeklyChampions, setWeeklyChampions] = useState<WeeklyChampion[]>(() => {
    const saved = localStorage.getItem('504_v2_weekly_champions');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedViz, setSelectedViz] = useState<Visualization | null>(null);
  const [showAddVizModal, setShowAddVizModal] = useState(false);
  const [newViz, setNewViz] = useState<Partial<Visualization>>({ title: '', description: '', htmlContent: '', category: '教材' });
  const [mentalMathInput, setMentalMathInput] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 如果拖拽到分类容器上
    if (overId === '教材' || overId === '作业本' || overId === '周、月任务' || overId === '试卷分析') {
      setVisualizations((prev: Visualization[]) => prev.map((v: Visualization) => 
        v.id === activeId ? { ...v, category: overId as any } : v
      ));
      return;
    }

    // 如果拖拽到另一个项目上
    const activeIndex = visualizations.findIndex((v: Visualization) => v.id === activeId);
    const overIndex = visualizations.findIndex((v: Visualization) => v.id === overId);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      const overItem: Visualization = visualizations[overIndex];
      const newVisualizations: Visualization[] = arrayMove(visualizations, activeIndex, overIndex);
      
      // 更新被拖拽项的分类为目标项的分类
      if (overItem.category) {
        const activeIdx = newVisualizations.findIndex((v: Visualization) => v.id === activeId);
        if (activeIdx !== -1) {
          newVisualizations[activeIdx].category = overItem.category;
        }
      }
      
      setVisualizations(newVisualizations);
    }
  };

  const [mathGames] = useState<MathGame[]>([
    {
      id: 'game-1',
      title: '数学消消乐',
      description: '通过计算数学题来消除方块，挑战你的心算速度！',
      url: '#',
      icon: 'Gamepad2',
      color: 'from-rose-400 to-orange-500'
    },
    {
      id: 'game-2',
      title: '24点大作战',
      description: '经典的24点游戏，看看谁能最快找到答案。',
      url: '#',
      icon: 'Target',
      color: 'from-blue-400 to-indigo-500'
    },
    {
      id: 'game-3',
      title: '几何拼图',
      description: '利用几何图形拼出指定的形状，锻炼空间想象力。',
      url: '#',
      icon: 'Shapes',
      color: 'from-emerald-400 to-teal-500'
    }
  ]);

  useEffect(() => {
    const currentVersion = localStorage.getItem('504_v2_prize_version');
    if (currentVersion !== PRIZE_VERSION) {
      setPrizes(INITIAL_PRIZES);
      localStorage.setItem('504_v2_prize_version', PRIZE_VERSION);
      localStorage.setItem('504_v2_prizes', JSON.stringify(INITIAL_PRIZES));
      console.log('[Prize Sync] 奖池已自动同步到最新版本');
    }
  }, []);

  // --- 自动备份逻辑 ---
  useEffect(() => {
    const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const lastBackupDate = localStorage.getItem('504_v2_last_backup_date');

    if (lastBackupDate !== today) {
      // 执行备份
      const backupData = {
        students: localStorage.getItem('504_v2_students'),
        prizes: localStorage.getItem('504_v2_prizes'),
        logs: localStorage.getItem('504_v2_logs'),
        pending: localStorage.getItem('504_v2_pending'),
        redeemed: localStorage.getItem('504_v2_redeemed'),
        team_bonuses: localStorage.getItem('504_v2_team_bonuses'),
        team_names: localStorage.getItem('504_v2_team_names'),
        incomplete_homeworks: localStorage.getItem('504_v2_incomplete_homeworks'),
        incomplete_remarks: localStorage.getItem('504_v2_incomplete_remarks'),
        hidden_overdue_dates: localStorage.getItem('504_v2_hidden_overdue_dates'),
        math_life_tasks: localStorage.getItem('504_v2_math_life_tasks'),
        visualizations: localStorage.getItem('504_v2_visualizations'),
        backupDate: today,
        timestamp: new Date().toISOString()
      };

      // 获取当前备份索引 (0-4)
      const currentIndexStr = localStorage.getItem('504_v2_backup_index');
      const currentIndex = currentIndexStr ? parseInt(currentIndexStr) : 0;

      // 存储备份
      localStorage.setItem(`504_v2_backup_${currentIndex}`, JSON.stringify(backupData));
      
      // 更新索引和最后备份日期
      localStorage.setItem('504_v2_backup_index', ((currentIndex + 1) % 5).toString());
      localStorage.setItem('504_v2_last_backup_date', today);
      
      console.log(`[Backup] 自动备份已完成 (索引: ${currentIndex}, 日期: ${today})`);
    }
  }, []);

  // --- 每周冠军统计逻辑 ---
  useEffect(() => {
    const now = new Date();
    // 只有在周一才进行统计 (0=周日, 1=周一)
    if (now.getDay() !== 1) return;

    // 计算上周一的日期
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - 7);
    
    // 生成唯一的周标识 (以周一日期为准)
    const weekId = lastMonday.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });

    // 如果已经统计过这一周，则跳过
    if (weeklyChampions.some(c => c.weekKey === weekId)) return;

    // 获取上周一到上周五的所有工作日日期字符串
    const workDays: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(lastMonday);
      d.setDate(lastMonday.getDate() + i);
      workDays.push(d.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    }

    // 统计各战队在上周工作日的总得分
    const teamWeeklyStars: Record<number, number> = {};
    logs.forEach(log => {
      if (workDays.includes(log.dateKey)) {
        const student = students.find(s => s.id === log.studentId);
        if (student && student.groupId) {
          teamWeeklyStars[student.groupId] = (teamWeeklyStars[student.groupId] || 0) + log.amount;
        }
      }
    });

    const entries = Object.entries(teamWeeklyStars);
    if (entries.length === 0) return;

    // 选出得分最高的战队
    const [winnerId, winnerStars] = entries.reduce((prev, curr) => curr[1] > prev[1] ? curr : prev);

    const newChampion: WeeklyChampion = {
      weekKey: weekId,
      teamId: parseInt(winnerId),
      totalStars: winnerStars,
      startDate: workDays[0],
      endDate: workDays[4]
    };

    setWeeklyChampions(prev => [newChampion, ...prev]);
  }, [logs, students, weeklyChampions]);

  const handleRestoreBackup = (backupJson: string) => {
    try {
      const data = JSON.parse(backupJson);
      if (data.students) setStudents(JSON.parse(data.students));
      if (data.prizes) setPrizes(JSON.parse(data.prizes));
      if (data.logs) setLogs(JSON.parse(data.logs));
      if (data.pending) setPendingPrizes(JSON.parse(data.pending));
      if (data.redeemed) setRedeemedHistory(JSON.parse(data.redeemed));
      if (data.team_bonuses) setTeamBonuses(JSON.parse(data.team_bonuses));
      if (data.team_names) setTeamNames(JSON.parse(data.team_names));
      if (data.incomplete_homeworks) setIncompleteHomeworks(JSON.parse(data.incomplete_homeworks));
      if (data.incomplete_remarks) setIncompleteRemarks(JSON.parse(data.incomplete_remarks));
      if (data.hidden_overdue_dates) setHiddenOverdueDates(JSON.parse(data.hidden_overdue_dates));
      if (data.math_life_tasks) setMathLifeTasks(JSON.parse(data.math_life_tasks));
      if (data.visualizations) setVisualizations(JSON.parse(data.visualizations));
      
      showNotification('备份恢复成功！', 'success');
    } catch (e) {
      showNotification('备份恢复失败，数据格式错误', 'error');
    }
  };

  const [isEditingOverdue, setIsEditingOverdue] = useState(false);

  const [incompleteInput, setIncompleteInput] = useState('');

  const [viewMode, setViewMode] = useState('dashboard');
  const [showTaskPopup, setShowTaskPopup] = useState(false);
  const [isTaskPopupExpanded, setIsTaskPopupExpanded] = useState(false);

  useEffect(() => {
    const isDateToday = (dateStr: string) => {
      if (!dateStr) return false;
      const normalized = dateStr.replace(/\./g, '-');
      // Handle cases like 2026-3-13 vs 2026-03-13
      const d = new Date(normalized);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth() === now.getMonth() &&
             d.getDate() === now.getDate();
    };

    const hasNewTaskToday = mathLifeTasks.some(t => isDateToday(t.startDate));

    if (hasNewTaskToday) {
      setShowTaskPopup(true);
    } else {
      setShowTaskPopup(false);
    }
  }, [mathLifeTasks]);
  const [notification, setNotification] = useState<{ msg: string; type: string } | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<Student | null>(null);
  const [selectedTeamForAction, setSelectedTeamForAction] = useState<TeamStat | null>(null); 
  const [selectedTeamDetailId, setSelectedTeamDetailId] = useState<number | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [sortMode, setSortMode] = useState<'id' | 'stars'>('id'); 
  const [redemptionFilterId, setRedemptionFilterId] = useState('');
  
  const [bulkStarAmount, setBulkStarAmount] = useState(1);
  const [quickActionStudentId, setQuickActionStudentId] = useState('');
  const [quickActionReason, setQuickActionReason] = useState(ACTION_REASONS[0].label);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRewardSelector, setShowRewardSelector] = useState(false);
  const [viewingMonth, setViewingMonth] = useState(new Date());
  const [showAIScanModal, setShowAIScanModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [aiScanResult, setAIScanResult] = useState<any[]>([]);
  const [aiScanError, setAIScanError] = useState('');

  const currentDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { 
      timeZone: 'Asia/Shanghai', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    };
    return new Intl.DateTimeFormat('zh-CN', options).format(selectedDate);
  }, [selectedDate]);

  const selectedDateKey = useMemo(() => {
    return selectedDate.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
  }, [selectedDate]);

  const todayDateKey = useMemo(() => {
    return new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
  }, []);

  const yesterdayDateKey = useMemo(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
  }, [selectedDate]);

  const datesWithLogs = useMemo(() => {
    const dates = new Set<string>();
    logs.forEach(log => {
      if (log.dateKey) dates.add(log.dateKey);
    });
    return dates;
  }, [logs]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoAnalyzeTriggeredRef = useRef<Record<string, boolean>>({});

  // 新增：用于配置奖项的编辑模式状态
  const [isEditingPrizes, setIsEditingPrizes] = useState(false);
  const [editingPrizesData, setEditingPrizesData] = useState<Prize[]>([]);

  // 抽奖机状态
  const [gachapon, setGachapon] = useState<{
    isOpen: boolean;
    stage: string;
    studentId: string;
    studentName: string;
    result: Prize | null;
    resultItem: string | null;
    selectedMode: number;
    cost: number;
  }>({
    isOpen: false,
    stage: 'auth', // auth, spinning, result, denied
    studentId: '',
    studentName: '',
    result: null,
    resultItem: null,
    selectedMode: 1,
    cost: 15
  });

  const [probModeId, setProbModeId] = useState<number>(1);
  const [showProbSection, setShowProbSection] = useState<boolean>(false);

  // 持久化存储
  useEffect(() => { localStorage.setItem('504_v2_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('504_v2_prizes', JSON.stringify(prizes)); }, [prizes]);
  useEffect(() => { localStorage.setItem('504_v2_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('504_v2_pending', JSON.stringify(pendingPrizes)); }, [pendingPrizes]);
  useEffect(() => { localStorage.setItem('504_v2_redeemed', JSON.stringify(redeemedHistory)); }, [redeemedHistory]);
  useEffect(() => { localStorage.setItem('504_v2_team_bonuses', JSON.stringify(teamBonuses)); }, [teamBonuses]);
  useEffect(() => { localStorage.setItem('504_v2_team_names', JSON.stringify(teamNames)); }, [teamNames]); 
  useEffect(() => { localStorage.setItem('504_v2_incomplete_homeworks', JSON.stringify(incompleteHomeworks)); }, [incompleteHomeworks]);
  useEffect(() => { localStorage.setItem('504_v2_incomplete_remarks', JSON.stringify(incompleteRemarks)); }, [incompleteRemarks]);
  useEffect(() => { localStorage.setItem('504_v2_hidden_overdue_dates', JSON.stringify(hiddenOverdueDates)); }, [hiddenOverdueDates]);
  useEffect(() => { localStorage.setItem('504_v2_math_life_tasks', JSON.stringify(mathLifeTasks)); }, [mathLifeTasks]);
  useEffect(() => { localStorage.setItem('504_v2_visualizations', JSON.stringify(visualizations)); }, [visualizations]);
  useEffect(() => { localStorage.setItem('504_v2_weekly_champions', JSON.stringify(weeklyChampions)); }, [weeklyChampions]);

  // 新增：AI功能状态
  const [dailyEncouragement, setDailyEncouragement] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // 新增：学生个性化评价状态
  const [evaluatingStudentId, setEvaluatingStudentId] = useState('');
  const [studentEvaluationResult, setStudentEvaluationResult] = useState<string | null>(null);
  const [isEvaluatingStudent, setIsEvaluatingStudent] = useState(false);
  const [showEvalInput, setShowEvalInput] = useState(false);
  const [showEvalConfirm, setShowEvalConfirm] = useState(false);
  const [isFreeView, setIsFreeView] = useState(false);

  const handleEvaluateStudent = async () => {
    if (!evaluatingStudentId) {
      showNotification('请输入学号', 'warning');
      return;
    }

    const student = students.find(s => s.id === parseInt(evaluatingStudentId));
    if (!student) {
      showNotification('未找到该学号的学生', 'error');
      return;
    }

    // 获取当前周标识 (YYYY-WW)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    const weekKey = `${now.getFullYear()}-W${weekNum}`;
    
    const usageKey = `report_usage_weekly_${student.id}_${weekKey}`;
    const isUsed = localStorage.getItem(usageKey);

    if (isUsed) {
      if (student.availableStars < 5) {
        showNotification(`星星不足！本周第二次查看评价需要 5 颗星，你当前只有 ${student.availableStars} 颗。`, 'warning');
        return;
      }
      setIsFreeView(false);
    } else {
      setIsFreeView(true);
    }
    setShowEvalConfirm(true);
  };

  const confirmEvaluateStudent = async (isFree: boolean = false) => {
    const student = students.find(s => s.id === parseInt(evaluatingStudentId));
    if (!student) return;

    setShowEvalConfirm(false);
    setIsEvaluatingStudent(true);
    setStudentEvaluationResult(null);

    try {
      if (!isFree && !isFreeView) {
        // 扣除星星
        const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        const dateKey = selectedDateKey;
        
        const deductionLog: Log = {
          id: Date.now(),
          studentId: student.id,
          studentName: student.name,
          amount: -5,
          reason: '查看AI个性化评价(周续查)',
          timestamp: timestamp,
          dateKey: dateKey
        };

        setStudents(prev => prev.map(s => 
          s.id === student.id ? { ...s, availableStars: s.availableStars - 5 } : s
        ));
        setLogs(prev => [deductionLog, ...prev].slice(0, 500));
      } else {
        // 标记为已使用免费机会
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        const weekKey = `${now.getFullYear()}-W${weekNum}`;
        const usageKey = `report_usage_weekly_${student.id}_${weekKey}`;
        localStorage.setItem(usageKey, 'true');
      }
      
      // 搜集该学生的数据
      const studentLogs = logs.filter(l => l.studentId === student.id);
      
      // 1. 作业情况
      const homeworkStats = {
        perfect: studentLogs.filter(l => l.reason === '完美作业' || l.reason === '周末完美作业').length,
        completed: studentLogs.filter(l => l.reason === '今日事今日毕' || l.reason === '周末作业清零').length,
        delayed: studentLogs.filter(l => l.reason.includes('未完成作业')).length,
      };

      // 2. 数学生活家
      const mathLifeStats = mathLifeTasks.filter(t => t.awardedStudents?.some(as => as.studentId === student.id)).map(t => t.title);

      // 3. 日常加减分
      const dailyStats = {
        positive: studentLogs.filter(l => l.amount > 0 && !['完美作业', '周末完美作业', '今日事今日毕', '周末作业清零'].includes(l.reason)).map(l => l.reason),
        negative: studentLogs.filter(l => l.amount < 0 && !l.reason.includes('未完成作业')).map(l => l.reason),
      };

      const dataSummary = `
        - 作业表现：完美作业 ${homeworkStats.perfect} 次，准时完成 ${homeworkStats.completed} 次，逾期 ${homeworkStats.delayed} 次。
        - 数学生活家：参与了 ${mathLifeStats.length} 个挑战（${mathLifeStats.join('、') || '暂无'}）。
        - 日常表现：
          * 亮点：${dailyStats.positive.slice(0, 5).join('、') || '表现稳健'}
          * 需注意：${dailyStats.negative.slice(0, 5).join('、') || '暂无明显违规'}
        - 当前总星数：${student.totalStars}
      `;

      const evaluation = await generateStudentEvaluation(student.name, dataSummary);
      setStudentEvaluationResult(evaluation);
    } catch (error) {
      console.error('Evaluation Error:', error);
      showNotification('评价生成失败，请重试', 'error');
    } finally {
      setIsEvaluatingStudent(false);
    }
  };

  // Math Life States
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MathLifeTask | null>(null);
  const [newTask, setNewTask] = useState<Partial<MathLifeTask>>({
    title: '',
    description: '',
    type: 'weekly',
    reward: '5',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active'
  });

  const handleAddTask = () => {
    if (!newTask.title || !newTask.description) {
      showNotification('请填写完整任务信息', 'warning');
      return;
    }
    if (newTask.id) {
      // 编辑现有任务
      setMathLifeTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, ...newTask } as MathLifeTask : t));
      if (selectedTask && selectedTask.id === newTask.id) {
        setSelectedTask({ ...selectedTask, ...newTask } as MathLifeTask);
      }
      showNotification('任务更新成功！', 'success');
    } else {
      // 发布新任务
      const task: MathLifeTask = {
        id: Date.now().toString(),
        title: newTask.title || '',
        description: newTask.description || '',
        type: (newTask.type as 'weekly' | 'monthly') || 'weekly',
        reward: newTask.reward || '5',
        createdAt: new Date().toISOString(),
        startDate: newTask.startDate || new Date().toISOString().split('T')[0],
        endDate: newTask.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active'
      };
      setMathLifeTasks([task, ...mathLifeTasks]);
      showNotification('任务发布成功！', 'success');
    }
    setShowAddTaskModal(false);
    setNewTask({ 
      title: '', 
      description: '', 
      type: 'weekly', 
      reward: '5', 
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active' 
    });
  };

  const handleAIScan = async () => {
    setIsScanning(true);
    setShowAIScanModal(true);
    setAIScanResult([]);
    setAIScanError('');

    try {
      // Filter today's logs
      const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
      const todayLogs = logs.filter(log => log.dateKey === today);

      if (todayLogs.length === 0) {
        setAIScanError('今日暂无加减分记录，快去给同学们加分吧！✨');
        setIsScanning(false);
        return;
      }

      // Group by reason and count
      const summaryMap: Record<string, { add: number, sub: number, students: Set<string>, ids: Set<number> }> = {};
      
      todayLogs.forEach(log => {
        if (!summaryMap[log.reason]) {
          summaryMap[log.reason] = { add: 0, sub: 0, students: new Set(), ids: new Set() };
        }
        if (log.amount > 0) {
          summaryMap[log.reason].add++;
        } else {
          summaryMap[log.reason].sub++;
        }
        summaryMap[log.reason].students.add(log.studentName);
        summaryMap[log.reason].ids.add(log.studentId);
      });

      const summaryLines = Object.entries(summaryMap).map(([reason, data]) => {
        const parts = [];
        if (data.add > 0) parts.push(`${data.add}人加分`);
        if (data.sub > 0) parts.push(`${data.sub}人扣分`);
        return `- ${reason}: ${parts.join('，')} (涉及学生: ${Array.from(data.students).join(', ')})`;
      });

      const logsSummary = summaryLines.join('\n');
      const aiRemarks = await analyzeDailyLogs(logsSummary);
      
      // Merge local data with AI remarks
      const finalRows = Object.entries(summaryMap).map(([reason, data]) => {
        const aiMatch = Array.isArray(aiRemarks) ? aiRemarks.find((r: any) => r.reason === reason) : null;
        return {
          reason,
          count: data.add + data.sub,
          ids: Array.from(data.ids).sort((a, b) => a - b).join(', '),
          remark: aiMatch ? aiMatch.remark : '表现优秀，继续保持！'
        };
      });

      setAIScanResult(finalRows);
    } catch (error) {
      console.error('AI Scan Error:', error);
      setAIScanError('AI 扫描失败，请检查网络连接。');
    } finally {
      setIsScanning(false);
    }
  };

  // 当今日作业订正全员通关时，自动触发智能分析
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const isToday = selectedDateKey === todayStr;
    if (!isToday) return;

    const isMonday = selectedDate.getDay() === 1;
    const incompleteMonday = students.filter(s => !logs.some(l => l.studentId === s.id && l.dateKey === selectedDateKey && (l.reason === '完美作业' || l.reason === '今日事今日毕')));
    const incompleteWeekend = isMonday ? students.filter(s => !logs.some(l => l.studentId === s.id && l.dateKey === selectedDateKey && (l.reason === '周末作业清零' || l.reason === '完美作业'))) : [];
    
    const allClear = isMonday ? (incompleteWeekend.length === 0) : (incompleteMonday.length === 0);

    // 只有在有学生（非空）且全员通关的情况下触发
    if (students.length > 0 && allClear && !autoAnalyzeTriggeredRef.current[selectedDateKey]) {
      // 检查是否是因为刚刚完成（即之前有记录但现在全清了）
      // 这里我们简单处理：只要是全清状态且今日未触发过，就触发
      autoAnalyzeTriggeredRef.current[selectedDateKey] = true;
      handleAIScan();
    }
  }, [logs, selectedDateKey, students, selectedDate]);

  const [awardStudentId, setAwardStudentId] = useState('');
  const [awardStars, setAwardStars] = useState(5);

  const handleAwardStudent = () => {
    if (!selectedTask || !awardStudentId) return;
    
    const student = students.find(s => s.id === parseInt(awardStudentId));
    if (!student) {
      showNotification('未找到该学号的学生', 'error');
      return;
    }

    const starsToAdd = Number(awardStars);
    if (isNaN(starsToAdd) || starsToAdd <= 0) {
      showNotification('请输入有效的星星数量', 'error');
      return;
    }

    // Update student stars
    const updatedStudents = students.map(s => {
      if (s.id === student.id) {
        return {
          ...s,
          totalStars: s.totalStars + starsToAdd,
          availableStars: s.availableStars + starsToAdd
        };
      }
      return s;
    });
    setStudents(updatedStudents);

    // Update task awarded students
    const updatedTask = {
      ...selectedTask,
      awardedStudents: [
        ...(selectedTask.awardedStudents || []),
        { studentId: student.id, name: student.name, stars: starsToAdd }
      ]
    };
    
    // Update tasks list
    const updatedTasks = mathLifeTasks.map(t => 
      t.id === selectedTask.id ? updatedTask : t
    );
    setMathLifeTasks(updatedTasks);
    setSelectedTask(updatedTask);
    
    // Add log
    const newLog: Log = {
      id: Date.now(),
      studentId: student.id,
      studentName: student.name,
      amount: starsToAdd,
      reason: `完成任务：${selectedTask.title}`,
      timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      dateKey: selectedDateKey,
      taskId: selectedTask.id
    };
    setLogs([newLog, ...logs]);

    setAwardStudentId('');
    showNotification(`已为 ${student.name} 加 ${starsToAdd} 颗星！`, 'success');
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm('确定要删除这个任务吗？此操作将永久删除该任务及其所有相关奖励记录。')) {
      setMathLifeTasks(mathLifeTasks.filter(t => t.id !== id));
      // Also delete logs associated with this task
      setLogs(prevLogs => prevLogs.filter(log => log.taskId !== id));
      showNotification('任务及其相关数据已删除', 'info');
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask(null);
      }
    }
  };

  const handleToggleTaskStatus = (id: string) => {
    const task = mathLifeTasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'active' ? 'completed' : 'active';
    const updatedTasks = mathLifeTasks.map(t => 
      t.id === id ? { ...t, status: newStatus } : t
    );
    
    setMathLifeTasks(updatedTasks);
    
    // Update selected task if it's currently open
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }

    showNotification(newStatus === 'completed' ? '任务已结束' : '任务已重新开启', 'success');
  };

  // 每日鼓励语获取
  useEffect(() => {
    const fetchEncouragement = async () => {
      const today = new Date().toDateString();
      const cached = localStorage.getItem('dailyEncouragement');
      if (cached) {
        const { date, message } = JSON.parse(cached);
        if (date === today) {
          setDailyEncouragement(message);
          return;
        }
      }
      try {
        const msg = await generateDailyEncouragement();
        if (msg) {
          setDailyEncouragement(msg);
          localStorage.setItem('dailyEncouragement', JSON.stringify({ date: today, message: msg }));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchEncouragement();
  }, []);

  const handleAnalyzeToday = async () => {
    setIsAnalyzing(true);
    showNotification('正在进行智能分析，请稍候...', 'info');
    
    // 1. 获取今日日志
    const todayLogs = logs.filter(l => l.dateKey === selectedDateKey);
    if (todayLogs.length === 0) {
      showNotification('今日暂无数据可分析', 'warning');
      setIsAnalyzing(false);
      return;
    }

    // 2. 筛选出“完美作业”和“今日事今日毕”的记录，并按时间排序
    const speedLogs = todayLogs
      .filter(l => l.reason === '完美作业' || l.reason === '今日事今日毕' || l.reason === '周周练全对')
      .sort((a, b) => {
        // timestamp format: "2023/10/27 10:30:00" or similar locale string
        // We need to parse it carefully or rely on string comparison if format is consistent
        // Assuming locale string format is consistent for sorting within same day
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

    if (speedLogs.length === 0) {
      showNotification('今日暂无作业相关记录', 'warning');
      setIsAnalyzing(false);
      return;
    }

    // 3. 提取前5名学生及其战队
    const topSpeedStudents = speedLogs.slice(0, 5).map((log, index) => {
      const student = students.find(s => s.id === log.studentId);
      const groupName = student ? `第${student.groupId}战队` : '未知战队';
      return `第${index + 1}名: ${log.studentName} (${groupName}) - ${log.reason} @ ${log.timestamp.split(' ')[1]}`;
    });

    // 4. 统计各战队完成人数
    const groupCounts: Record<string, number> = {};
    speedLogs.forEach(log => {
      const student = students.find(s => s.id === log.studentId);
      if (student) {
        const key = `第${student.groupId}战队`;
        groupCounts[key] = (groupCounts[key] || 0) + 1;
      }
    });
    
    // 找出完成人数最多的战队
    const topGroups = Object.entries(groupCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g, c]) => `${g}(${c}人)`)
      .join(', ');

    const summary = `日期: ${selectedDateKey}
    最快完成作业学生:
    ${topSpeedStudents.join('\n')}
    
    作业完成最积极战队: ${topGroups}`;

    // 5. 调用API
    try {
      const analysis = await generateSpeedEncouragement(summary);
      setAnalysisResult(analysis);
    } catch (e) {
      showNotification('分析失败，请稍后重试', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddVisualization = () => {
    if (!newViz.title || !newViz.htmlContent) {
      showNotification('标题和内容不能为空', 'error');
      return;
    }
    const viz: Visualization = {
      id: `viz-${Date.now()}`,
      title: newViz.title,
      description: newViz.description || '',
      htmlContent: newViz.htmlContent,
      createdAt: new Date().toISOString(),
      category: newViz.category as any || '教材'
    };
    setVisualizations([viz, ...visualizations]);
    setShowAddVizModal(false);
    setNewViz({ title: '', description: '', htmlContent: '', category: '教材' });
    showNotification('可视化题目添加成功！', 'success');
  };

  const handleOpenVisualization = (viz: Visualization) => {
    const links: Record<string, string> = {
      '作业本p1.4': 'https://my-visual-tools.pages.dev/%E4%BD%9C%E4%B8%9A%E6%9C%ACp1.4',
      '作业本p28.4': 'https://my-visual-tools.pages.dev/%E4%BD%9C%E4%B8%9A%E6%9C%ACp28.4',
      '数学书p21': 'https://my-visual-tools.pages.dev/math%20bookp21',
      '探索“排水法”求体积': 'https://my-visual-tools.pages.dev/%E6%8E%A2%E7%B4%A2%E6%8E%92%E6%B0%B4%E6%B3%95%E4%BA%A4%E4%BA%92%E5%BC%8F%E5%AD%A6%E4%B9%A0%E5%8D%95',
      '探索图形': 'https://my-visual-tools.pages.dev/%E6%8E%A2%E7%B4%A2%E5%9B%BE%E5%BD%A2',
      '数学书p43（宫灯）': 'https://my-visual-tools.pages.dev/%E5%AE%AB%E7%81%AF',
      '月任务：立体蛋糕': 'https://my-visual-tools.pages.dev/%E6%9C%88%E4%BB%BB%E5%8A%A1%EF%BC%9A%E7%AB%8B%E4%BD%93%E8%9B%8B%E7%B3%95',
      '第三单元讲解': 'https://my-visual-tools.pages.dev/%E7%AC%AC%E4%B8%89%E5%8D%95%E5%85%83%E8%AF%95%E5%8D%B7',
      '分数解决问题': 'https://my-visual-tools.pages.dev/%E5%88%86%E6%95%B0%E8%A7%A3%E5%86%B3%E9%97%AE%E9%A2%98'
    };

    if (links[viz.id]) {
      window.open(links[viz.id], '_blank');
    } else {
      setSelectedViz(viz);
    }
  };

  const handleDeleteVisualization = (id: string) => {
    if (window.confirm('确定要删除这个可视化题目吗？')) {
      setVisualizations(visualizations.filter(v => v.id !== id));
      showNotification('已删除', 'success');
    }
  };

  // 自动判定小组全员清零规则
  useEffect(() => {
    if (logs.length === 0) return;
    
    // 使用当前选中的日期，而不是物理时间今天，以便支持补录历史奖励
    const dateKey = selectedDateKey;

    // 限制：仅当选中的日期是今天或昨天时，才触发全员清零奖励
    const now = new Date();
    const todayKey = now.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });

    if (dateKey !== todayKey && dateKey !== yesterdayKey) {
      return;
    }

    let newBonuses = { ...teamBonuses };
    let bonusTriggeredFor = [];
    let newLogs = [];
    let studentsToUpdate = [];

    // 获取所有存在的战队ID
    const groupIds = [...new Set(students.map(s => s.groupId))];

    groupIds.forEach(gId => {
      const bonusKey = `${gId}-${dateKey}`;
      if (newBonuses[bonusKey]) return; // 该战队该日已奖励过

      const members = students.filter(s => s.groupId === gId);
      if (members.length === 0) return;

      // 检查是否全员达标
      // 达标条件：获得【完美作业】(1星) 或 【今日事今日毕】(0.5星) 或 【周周练全对】(2星)
      const allQualified = members.every(member => {
        return logs.some(log => 
          log.studentId === member.id && 
          log.dateKey === dateKey && 
          (log.reason === "完美作业" || log.reason === "周周练全对" || log.reason === "今日事今日毕") &&
          log.amount > 0
        );
      });

      if (allQualified) {
        newBonuses[bonusKey] = true;
        bonusTriggeredFor.push(gId);
        members.forEach(m => {
          studentsToUpdate.push(m.id);
          newLogs.push({
            id: Date.now() + Math.random(), 
            studentId: m.id,
            studentName: m.name,
            amount: 0.5,
            reason: `[系统自动] 全员清零奖励`,
            timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
            dateKey: dateKey
          });
        });
      }
    });

    if (bonusTriggeredFor.length > 0) {
      setTeamBonuses(newBonuses);
      setStudents(prev => prev.map(s => {
        if (studentsToUpdate.includes(s.id)) {
          return { ...s, totalStars: s.totalStars + 0.5, availableStars: s.availableStars + 0.5 };
        }
        return s;
      }));
      setLogs(prev => [...newLogs, ...prev].slice(0, 200));
      showNotification(`🏆 恭喜！第 ${bonusTriggeredFor.join(', ')} 战队达成今日全员清零！自动奖励0.5星！`);
    }
  }, [logs, students, teamBonuses, selectedDateKey]);

  // 北京时间同步系统
  useEffect(() => {
    // 仅在未选择日期或选择的是今天时，保持时间更新（虽然目前只显示日期，但保留逻辑以备后用）
    const updateDate = () => {
      // 如果用户没有在查看过去，我们可以保持 currentDate 逻辑，但现在我们有了 selectedDate
      // 这里我们可以更新一个 "today" 引用
    };
    
    updateDate();
    const timer = setInterval(updateDate, 60000); 
    return () => clearInterval(timer);
  }, []);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- 核心业务逻辑：加扣星 ---
  const commitAddStar = (studentId, amount, reason, customDateKey = null) => {
    // 检查重复加分
    const targetDateKey = customDateKey || selectedDateKey;
    const isDuplicate = logs.some(l => 
      l.studentId === studentId && 
      l.dateKey === targetDateKey && 
      l.reason === reason && 
      l.amount === amount
    );

    if (isDuplicate && amount > 0) {
      if (!window.confirm(`该学生今天已经因为【${reason}】加过分了，确定要继续添加吗？`)) {
        return;
      }
    }

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const newTotal = amount > 0 ? s.totalStars + amount : Math.max(0, s.totalStars + amount);
      const newAvailable = s.availableStars + amount;
      return { ...s, totalStars: newTotal, availableStars: newAvailable };
    }));

    setLogs(prev => [{
      id: Date.now(),
      studentId,
      studentName: students.find(s => s.id === studentId)?.name || '未知',
      amount,
      reason,
      timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      dateKey: targetDateKey
    }, ...prev].slice(0, 500)); // 保留最近500条
    
    showNotification(`${amount > 0 ? '加星' : '扣星'}成功！`);
    setPendingAction(null);
    setSelectedStudentForAction(null);
  };

  const handleMentalMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentalMathInput.trim()) return;
    
    const studentId = parseInt(mentalMathInput);
    if (isNaN(studentId)) {
      showNotification('请输入有效的学号', 'error');
      return;
    }
    
    const student = students.find(s => s.id === studentId);
    if (!student) {
      showNotification('未找到该学号的同学', 'error');
      return;
    }
    
    // 检查是否已经订正过
    const alreadyDone = logs.some(l => l.studentId === studentId && l.dateKey === selectedDateKey && l.reason === '口算达标并订正');
    if (alreadyDone) {
      showNotification(`${student.name} 今天已经完成口算订正了`, 'warning');
      setMentalMathInput('');
      return;
    }

    commitAddStar(studentId, 0.5, '口算达标并订正');
    setMentalMathInput('');
  };

  const handleUndoMentalMath = (studentId: number) => {
    const logToUndo = logs.find(l => 
      l.studentId === studentId && 
      l.dateKey === selectedDateKey && 
      l.reason === '口算达标并订正'
    );

    if (!logToUndo) return;

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      return { 
        ...s, 
        totalStars: Math.max(0, s.totalStars - logToUndo.amount), 
        availableStars: s.availableStars - logToUndo.amount 
      };
    }));

    setLogs(prev => prev.filter(l => l.id !== logToUndo.id));
    showNotification('已撤回口算订正记录');
  };

  const commitTeamAddStar = (teamId, amount, reason) => {
    setStudents(prev => prev.map(s => {
      if (s.groupId !== teamId) return s;
      const newTotal = amount > 0 ? s.totalStars + amount : Math.max(0, s.totalStars + amount);
      const newAvailable = s.availableStars + amount;
      return { ...s, totalStars: newTotal, availableStars: newAvailable };
    }));

    const teamStudents = students.filter(s => s.groupId === teamId);
    const dateKey = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const timeStamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const newLogs = teamStudents.map((s, index) => ({
      id: Date.now() + index,
      studentId: s.id,
      studentName: s.name,
      amount,
      reason: `[团队] ${reason}`,
      timestamp: timeStamp,
      dateKey: dateKey
    }));

    setLogs(prev => [...newLogs, ...prev].slice(0, 200));

    showNotification(`已为第 ${teamId} 战队全员 ${amount>0?'+':''}${amount}星: ${reason}`);
    setPendingAction(null);
    setSelectedTeamForAction(null); 
  };

  // --- 核心业务逻辑：抽奖熔断算法 ---
  const verifyStudentForGacha = () => {
    const id = parseInt(gachapon.studentId);
    const student = students.find(s => s.id === id);
    if (!student) { showNotification('查无此学号', 'error'); return; }
    
    if (student.availableStars < gachapon.cost) {
      setGachapon(prev => ({ ...prev, stage: 'denied', studentName: student.name }));
    } else {
      setGachapon(prev => ({ ...prev, stage: 'ready', studentName: student.name }));
    }
  };

  const spinGachapon = () => {
    setGachapon(prev => ({ ...prev, stage: 'spinning' }));
    
    const currentStudentId = parseInt(gachapon.studentId);
    const currentMode = GACHA_MODES.find(m => m.id === gachapon.selectedMode) || GACHA_MODES[0];
    
    setStudents(prev => prev.map(s => 
      s.id === currentStudentId ? { ...s, availableStars: s.availableStars - gachapon.cost } : s
    ));

    setTimeout(() => {
      // 根据当前模式权重和库存重新计算概率
      const modeWeights = currentMode.weights;
      const availablePool = prizes.filter(p => (p.stock === null || p.stock > 0) && (modeWeights[p.id as keyof typeof modeWeights] > 0));
      
      const totalWeight = availablePool.reduce((sum, p) => sum + modeWeights[p.id as keyof typeof modeWeights], 0);
      
      let random = Math.random() * totalWeight;
      let wonTier = null;
      for (const prize of availablePool) {
        const weight = modeWeights[prize.id as keyof typeof modeWeights];
        if (random < weight) {
          wonTier = prize;
          break;
        }
        random -= weight;
      }

      // Safeguard
      if (!wonTier) wonTier = availablePool[availablePool.length - 1];

      const itemsList = wonTier.items && wonTier.items.length > 0 ? wonTier.items : ["神秘小礼品"];
      const specificItem = itemsList[Math.floor(Math.random() * itemsList.length)];

      if (wonTier.stock !== null) {
        setPrizes(prev => prev.map(p => 
          p.id === wonTier.id ? { ...p, stock: p.stock - 1 } : p
        ));
      }

      const newPending = {
        id: Date.now(),
        studentId: currentStudentId,
        studentName: gachapon.studentName,
        tierName: wonTier.level,
        prizeName: specificItem,
        color: wonTier.color,
        timestamp: new Date().toLocaleString()
      };
      setPendingPrizes(prev => [newPending, ...prev]);

      setLogs(prev => [{
        id: Date.now(),
        studentId: currentStudentId,
        studentName: gachapon.studentName,
        amount: -gachapon.cost,
        reason: `开启[${currentMode.name}]抽中: ${specificItem}`,
        timestamp: new Date().toLocaleString()
      }, ...prev].slice(0, 200));

      setGachapon(prev => ({ ...prev, stage: 'result', result: wonTier, resultItem: specificItem }));
    }, 2000);
  };

  const handleRedeemPrize = (id) => {
    const prize = pendingPrizes.find(p => p.id === id);
    if (prize) {
        setPendingPrizes(prev => prev.filter(p => p.id !== id));
        setRedeemedHistory(prev => [{...prize, redeemedAt: new Date().toLocaleString()}, ...prev].slice(0, 50));
        showNotification('奖品核销成功！');
    }
  };

  const handleUpdateTeamName = (teamId, newName) => {
    setTeamNames(prev => ({ ...prev, [teamId]: newName }));
  };

  const handleChangeStudentGroup = (studentId, newGroupId) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, groupId: parseInt(newGroupId) } : s
    ));
    showNotification('人员编排调整成功！');
  };

  const handleUpdateStudentName = (studentId, newName) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, name: newName } : s
    ));
  };

  const handleUpdateStudentId = (oldId, newIdStr) => {
    const newId = parseInt(newIdStr);
    if (isNaN(newId)) return;
    
    // 检查新学号是否已存在
    if (students.some(s => s.id === newId)) {
      showNotification('该学号已存在！', 'error');
      return;
    }

    setStudents(prev => prev.map(s => 
      s.id === oldId ? { ...s, id: newId } : s
    ));

    // 同步更新流水记录中的学号
    setLogs(prev => prev.map(log => 
      log.studentId === oldId ? { ...log, studentId: newId } : log
    ));

    // 同步更新待核销奖品中的学号
    setPendingPrizes(prev => prev.map(p => 
      p.studentId === oldId ? { ...p, studentId: newId } : p
    ));

    // 同步更新已兑换历史中的学号
    setRedeemedHistory(prev => prev.map(h => 
      h.studentId === oldId ? { ...h, studentId: newId } : h
    ));
  };

  const handleAddStudent = () => {
    const maxId = students.length > 0 ? Math.max(...students.map(s => s.id)) : 0;
    const newStudent = {
      id: maxId + 1,
      name: '新同学',
      groupId: 1,
      totalStars: 0,
      availableStars: 0,
      avatar: null
    };
    // 确保新同学默认排在最后
    setStudents(prev => [...prev, newStudent]);
    showNotification('新同学已加入！🚀');
  };

  const handleDeleteStudent = (studentId) => {
    if (window.confirm('确定要删除这位同学吗？其所有数据将永久丢失！')) {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      showNotification('同学已离开机组。');
    }
  };

  const [showResetTeamNamesConfirm, setShowResetTeamNamesConfirm] = useState(false);

  const handleResetAllTeamNames = () => {
    setTeamNames({});
    setShowResetTeamNamesConfirm(false);
    showNotification('全部舰队名称已重置！', 'success');
  };

  const handleBulkAction = (amount: number) => {
    if (!window.confirm(`确定要给全班所有同学 ${amount > 0 ? '增加' : '扣除'} ${Math.abs(amount)} 颗星吗？`)) return;
    
    const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const dateKey = selectedDate.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
    
    const newLogs = students.map(s => ({
      id: Date.now() + Math.random(),
      studentId: s.id,
      studentName: s.name,
      amount: amount,
      reason: amount > 0 ? "全员奖励" : "全员扣分",
      timestamp: timestamp,
      dateKey: dateKey
    }));

    setStudents(prev => prev.map(s => ({
      ...s,
      totalStars: amount > 0 ? s.totalStars + amount : s.totalStars,
      availableStars: s.availableStars + amount
    })));

    setLogs(prev => [...newLogs, ...prev].slice(0, 500));
    showNotification(`全员 ${amount > 0 ? '加星' : '减星'} 操作成功！✨`);
  };

  const handleQuickActionById = () => {
    const idStrings = quickActionStudentId.split(/[,，\s]+/).filter(s => s.trim() !== '');
    if (idStrings.length === 0) {
      showNotification('请输入学号', 'error');
      return;
    }

    const action = ACTION_REASONS.find(a => a.label === quickActionReason);
    if (!action) return;

    const targetStudents = [];
    const failedIds = [];

    idStrings.forEach(idStr => {
      const studentId = parseInt(idStr);
      const student = students.find(s => s.id === studentId);
      if (student) {
        targetStudents.push(student);
      } else {
        failedIds.push(idStr);
      }
    });

    if (targetStudents.length === 0) {
      showNotification('未找到输入的学号', 'error');
      return;
    }

    const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const dateKey = selectedDateKey;
    
    const newLogs = targetStudents.map(s => ({
      id: Date.now() + Math.random(),
      studentId: s.id,
      studentName: s.name,
      amount: action.score,
      reason: action.label,
      timestamp: timestamp,
      dateKey: dateKey
    }));

    setStudents(prev => prev.map(s => {
      const isTarget = targetStudents.some(ts => ts.id === s.id);
      if (isTarget) {
        const amount = action.score;
        const newTotal = amount > 0 ? s.totalStars + amount : Math.max(0, s.totalStars + amount);
        const newAvailable = s.availableStars + amount;
        return { ...s, totalStars: newTotal, availableStars: newAvailable };
      }
      return s;
    }));

    setLogs(prev => [...newLogs, ...prev].slice(0, 500));
    setQuickActionStudentId('');
    showNotification(`已为 ${targetStudents.length} 位同学录入: ${action.label}`);
    
    if (failedIds.length > 0) {
      setTimeout(() => showNotification(`未找到学号: ${failedIds.join(', ')}`, 'error'), 1500);
    }
  };

  // --- 作业订正逻辑 ---
  const handleAddIncomplete = () => {
    const idStrings = incompleteInput.split(/[,，\s]+/).filter(s => s.trim() !== '');
    if (idStrings.length === 0) {
      showNotification('请输入学号', 'error');
      return;
    }

    const dateKey = selectedDateKey;
    const currentList = incompleteHomeworks[dateKey] || [];
    const newIds: number[] = [];
    const failedIds: string[] = [];

    idStrings.forEach(idStr => {
      const studentId = parseInt(idStr);
      const student = students.find(s => s.id === studentId);
      if (student) {
        if (!currentList.includes(studentId)) {
          newIds.push(studentId);
        }
      } else {
        failedIds.push(idStr);
      }
    });

    if (newIds.length > 0) {
      setIncompleteHomeworks(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), ...newIds]
      }));
      setIncompleteInput('');
      showNotification(`已添加 ${newIds.length} 位待订正同学`);
    } else if (failedIds.length === 0) {
      showNotification('这些同学已经在列表中了', 'warning');
    }

    if (failedIds.length > 0) {
      showNotification(`未找到学号: ${failedIds.join(', ')}`, 'error');
    }
  };

  const handleResolveIncomplete = (studentId: number) => {
    const dateKey = selectedDateKey;
    setIncompleteHomeworks(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(id => id !== studentId)
    }));
    showNotification('订正完成！加油！✨');
  };

  const handleExportData = () => {
    const data = { 
      timestamp: new Date().toISOString(), 
      students, prizes, logs, pendingPrizes, redeemedHistory, 
      teamBonuses, teamNames, incompleteHomeworks, incompleteRemarks 
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `504班一学期评价数据备份_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('数据已成功导出备份！💾');
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') return;
        const data = JSON.parse(result);
        if (data.students && Array.isArray(data.students)) {
          if (window.confirm('确定要恢复此备份吗？当前数据将被覆盖！')) {
            setStudents(data.students);
            if (data.prizes) setPrizes(data.prizes);
            if (data.logs) setLogs(data.logs);
            if (data.pendingPrizes) setPendingPrizes(data.pendingPrizes);
            if (data.redeemedHistory) setRedeemedHistory(data.redeemedHistory);
            if (data.teamBonuses) setTeamBonuses(data.teamBonuses);
            if (data.teamNames) setTeamNames(data.teamNames); 
            if (data.incompleteHomeworks) setIncompleteHomeworks(data.incompleteHomeworks);
            if (data.incompleteRemarks) setIncompleteRemarks(data.incompleteRemarks);
            showNotification('数据恢复成功！🎉');
          }
        }
      } catch (error) { showNotification('读取失败', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalClassStars = useMemo(() => students.reduce((acc, s) => acc + (s.totalStars || 0), 0), [students]);
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (sortMode === 'stars') return (b.totalStars || 0) - (a.totalStars || 0) || a.id - b.id;
      return a.id - b.id;
    });
  }, [students, sortMode]);

  const teamStats = useMemo(() => {
    const groups: Record<number, TeamStat> = {};
    students.forEach(s => {
      const gId = s.groupId || 999; 
      if (!groups[gId]) {
        groups[gId] = { id: gId, name: teamNames[gId] || `第 ${gId} 战队`, members: [], totalStars: 0 };
      }
      groups[gId].members.push(s);
      groups[gId].totalStars += (s.totalStars || 0);
    });
    return Object.values(groups).sort((a, b) => a.id - b.id);
  }, [students, teamNames]);

  const filteredPendingPrizes = useMemo(() => {
    if (!redemptionFilterId) return pendingPrizes;
    return pendingPrizes.filter(p => p.studentId === parseInt(redemptionFilterId));
  }, [pendingPrizes, redemptionFilterId]);

  const studentSelectedDateLogs = useMemo(() => {
    if (!selectedStudentForAction) return [];
    return logs.filter(log => log.studentId === selectedStudentForAction.id && log.dateKey === selectedDateKey);
  }, [logs, selectedStudentForAction, selectedDateKey]);

  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handleRemoveLog = (logId: number, studentId: number, amount: number) => {
    // 1. Find the log to get details (taskId, reason, etc.)
    const log = logs.find(l => l.id === logId);

    // 2. Update students
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      // Use Math.max to prevent negative stars if that's the desired behavior, 
      // but consistent with previous handleUndoLog, we might want to allow it or stick to 0.
      // Keeping Math.max(0, ...) as per original handleRemoveLog for safety.
      const newTotal = Math.max(0, s.totalStars - amount);
      const newAvailable = s.availableStars - amount; // Available stars might go negative temporarily if spent? Assuming similar logic.
      return { ...s, totalStars: newTotal, availableStars: newAvailable };
    }));
    
    // 3. Remove from logs
    setLogs(prev => prev.filter(l => l.id !== logId));

    if (log) {
      // 4. Reset Team Bonus if applicable
      if (log.reason === '[系统自动] 全员清零奖励') {
        const student = students.find(s => s.id === studentId);
        if (student) {
          const bonusKey = `${student.groupId}-${log.dateKey}`;
          setTeamBonuses(prev => {
            const next = { ...prev };
            delete next[bonusKey];
            return next;
          });
        }
      }

      // 5. Remove from Math Life Task Honor Roll
      let targetTaskId = log.taskId;
      
      // Legacy support: try to find task by title if taskId is missing
      if (!targetTaskId && log.reason.startsWith('完成任务：')) {
        const title = log.reason.replace('完成任务：', '');
        const task = mathLifeTasks.find(t => t.title === title);
        if (task) targetTaskId = task.id;
      }

      if (targetTaskId) {
        const task = mathLifeTasks.find(t => t.id === targetTaskId);
        if (task) {
          // Find the student in awarded list. 
          // Note: log.amount is the stars awarded.
          const indexToRemove = (task.awardedStudents || []).findIndex(s => 
            s.studentId === studentId && s.stars === amount
          );
          
          if (indexToRemove !== -1) {
             const newAwardedStudents = [...(task.awardedStudents || [])];
             newAwardedStudents.splice(indexToRemove, 1);
             
             const finalTask = { ...task, awardedStudents: newAwardedStudents };
             
             setMathLifeTasks(prev => prev.map(t => t.id === targetTaskId ? finalTask : t));
             
             if (selectedTask && selectedTask.id === targetTaskId) {
               setSelectedTask(finalTask);
             }
          }
        }
      }
    }

    showNotification('已撤销该条操作记录');
  };

  const handleUndoLog = (log: Log) => {
    if (!window.confirm(`确定要撤回这条记录吗？\n${log.studentName}: ${log.reason}`)) return;
    handleRemoveLog(log.id, log.studentId, log.amount);
  };

  const handleResetDailyStars = () => {
    if (!window.confirm(`⚠️ 严重警告 ⚠️\n\n确定要清空【${selectedDateKey}】的所有星星记录吗？\n\n此操作将：\n1. 删除当天所有加/扣分记录\n2. 回滚所有学生的对应分数\n3. 重置当天的团队奖励状态\n\n此操作不可恢复！请再次确认！`)) return;

    // 1. 找出当天的所有日志
    const logsToRemove = logs.filter(l => l.dateKey === selectedDateKey);
    
    if (logsToRemove.length === 0) {
      showNotification('当天没有可清空的记录', 'info');
      return;
    }

    // 2. 计算每个学生需要回滚的分数
    const studentDeltas: Record<number, number> = {};
    logsToRemove.forEach(log => {
      studentDeltas[log.studentId] = (studentDeltas[log.studentId] || 0) + log.amount;
    });

    // 3. 更新学生分数
    setStudents(prev => prev.map(s => {
      if (studentDeltas[s.id]) {
        return {
          ...s,
          totalStars: s.totalStars - (studentDeltas[s.id] || 0),
          availableStars: s.availableStars - (studentDeltas[s.id] || 0)
        };
      }
      return s;
    }));

    // 4. 从日志中移除
    setLogs(prev => prev.filter(l => l.dateKey !== selectedDateKey));

    // 5. 重置当天的团队奖励状态
    setTeamBonuses(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (key.endsWith(`-${selectedDateKey}`)) {
          delete next[key];
        }
      });
      return next;
    });

    showNotification(`已成功清空 ${selectedDateKey} 的所有记录`, 'success');
  };

  const handleResetAllData = () => {
    if (window.confirm('⚠️ 危险操作：清空所有数据 ⚠️\n\n确定要删除所有缓存数据吗？\n\n这将清空：\n1. 所有学生名单和分数\n2. 所有加扣分历史记录\n3. 所有奖品和兑换记录\n4. 所有自定义设置\n\n系统将恢复到初始状态，此操作【无法撤销】！')) {
      if (window.confirm('再次确认：真的要清空所有数据吗？')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  return (
    <div className="min-h-screen bg-cream text-ink font-sans pb-10 relative">
      <GeoBackground />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes gradient-pan {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-delayed { animation: float 3s ease-in-out 1.5s infinite; }
        .animate-float-slow { animation: float 6s ease-in-out infinite; }
        .animate-gradient-pan { background-size: 200% 200%; animation: gradient-pan 5s ease infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .glass-panel { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.5); }
        .dark-glass-panel { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0px rgba(99, 102, 241, 0.4); }
          50% { opacity: .8; box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer { animation: shimmer 2s infinite; }
        
        @keyframes slide-up-fade {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up-fade 0.5s ease-out forwards; }
      `}} />

      {/* Background FX */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-60"></div>
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-3xl"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-blue-200/30 blur-3xl"></div>
      </div>

      {/* Navigation */}
      {!['game_24', 'visualizations'].includes(viewMode) && (
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 fixed top-0 left-0 right-0 z-40 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setViewMode('dashboard')}>
              <ClassLogo size="sm" showText={true} />
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowDatePicker(true); setViewingMonth(selectedDate); }}
                  className="text-[10px] font-bold text-slate-500 flex items-center mt-0.5 hover:text-circle transition-colors bg-slate-100 px-2 py-0.5 rounded-full"
                >
                  <CalendarDays size={10} className="mr-1"/> {currentDate}
                </button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar items-center">
              {/* 班级动态组 */}
  
              <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200 gap-1 items-center">
                <button onClick={() => setViewMode('dashboard')} className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center whitespace-nowrap ${viewMode === 'dashboard' ? 'bg-white text-circle shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <TrendingUp size={14} className="mr-1.5"/> 几何殿堂
                </button>
                <button onClick={() => setViewMode('teams')} className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center whitespace-nowrap ${viewMode === 'teams' ? 'bg-white text-circle shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Award size={14} className="mr-1.5"/> 战队竞技
                </button>
              </div>
  
              {/* 学生档案 */}
              <button onClick={() => setViewMode('all_students')} className={`text-xs font-bold px-4 py-2 rounded-2xl transition shadow-sm border whitespace-nowrap flex items-center ${viewMode === 'all_students' ? 'bg-circle/10 text-circle border-circle/20' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}>
                <Users size={14} className="mr-1.5"/> 我的成长
              </button>
  
              {/* 数学乐园 */}
              <button 
                onClick={() => setShowRewardSelector(true)} 
                className={`text-xs font-bold px-4 py-2 rounded-2xl transition shadow-sm border whitespace-nowrap flex items-center ${['prizes', 'redemption', 'math_life', 'ai_hub'].includes(viewMode) ? 'bg-triangle/10 text-triangle border-triangle/20' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                <Gift size={14} className="mr-1.5"/> 数学乐园
                {pendingPrizes.length > 0 && <span className="ml-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>}
              </button>
  
              <button onClick={() => {
                  const pwd = prompt("请输入金老师专属密码:");
                  if(pwd === '504') setViewMode('admin');
                  else if (pwd) showNotification("密码错误", "error");
                }} className={`text-xs font-bold px-4 py-2 rounded-2xl transition shadow-sm border whitespace-nowrap flex items-center ${viewMode === 'admin' ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'}`}>
                <Shield size={14} className="mr-1.5"/> 控制台
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Task Popup */}
      <AnimatePresence>
        {showTaskPopup && !['game_24', 'visualizations'].includes(viewMode) && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              height: (viewMode === 'dashboard' || isTaskPopupExpanded) ? 'auto' : '44px'
            }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 left-0 right-0 z-30 px-4 py-2 pointer-events-none"
          >
            <div 
              onClick={() => {
                if (viewMode !== 'dashboard' && !isTaskPopupExpanded) {
                  setIsTaskPopupExpanded(true);
                } else {
                  setViewMode('math_life');
                  setIsTaskPopupExpanded(false);
                }
              }}
              className={`max-w-4xl mx-auto bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-sm cursor-pointer pointer-events-auto transition-all duration-500 overflow-hidden ${
                (viewMode === 'dashboard' || isTaskPopupExpanded) ? 'p-4' : 'p-2 h-10'
              }`}
            >
              <div className={`bg-white/20 rounded-xl animate-pulse flex items-center justify-center transition-all ${
                (viewMode === 'dashboard' || isTaskPopupExpanded) ? 'p-2 w-10 h-10' : 'p-1 w-6 h-6'
              }`}>
                <Rocket className={(viewMode === 'dashboard' || isTaskPopupExpanded) ? "w-6 h-6" : "w-4 h-4"} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">New Task</span>
                  <h4 className={`font-black truncate transition-all ${
                    (viewMode === 'dashboard' || isTaskPopupExpanded) ? 'text-sm sm:text-base' : 'text-xs'
                  }`}>
                    新任务已发布：快来开启你的探索之旅！✨
                  </h4>
                </div>
                {(viewMode === 'dashboard' || isTaskPopupExpanded) && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 0.9, height: 'auto' }}
                    className="text-xs font-medium mt-0.5 line-clamp-1"
                  >
                    点击查看详情，各位同学，请准备好你的装备！
                  </motion.p>
                )}
              </div>

              {viewMode !== 'dashboard' && isTaskPopupExpanded && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTaskPopupExpanded(false);
                  }}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Notification */}
      {notification && <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-2xl shadow-xl z-[110] text-white text-sm font-bold flex items-center ${notification.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}>{notification.msg}</div>}

      <main className="max-w-6xl mx-auto p-4 pt-24 sm:pt-20 relative z-10">
        
        {/* ================= DASHBOARD (几何殿堂 & 抽奖) ================= */}
        {viewMode === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            {/* Hero Banner (动态流光横幅) */}
            <div className="animate-gradient-pan bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-[2.5rem] p-10 text-white text-center shadow-2xl relative overflow-hidden group border border-white/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle,white_10%,transparent_20%)] [background-size:24px_24px] opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>
              
              <div className="absolute top-8 left-10 text-yellow-300/60 animate-float"><Star size={32} className="fill-yellow-300/30"/></div>
              <div className="absolute bottom-10 right-12 text-purple-300/60 animate-float-delayed"><Rocket size={40}/></div>
              <div className="absolute top-1/2 right-1/4 text-white/20 animate-pulse"><Star size={16}/></div>
              <div className="absolute bottom-1/4 left-1/4 text-white/20 animate-pulse"><Star size={20}/></div>

              <h2 className="text-xl sm:text-2xl font-bold mb-3 relative z-10 tracking-widest opacity-90 uppercase flex items-center justify-center">
                <Sparkles size={20} className="mr-2"/> 504班 · 几何积分 <Sparkles size={20} className="ml-2"/>
              </h2>
              
              <div className="text-7xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-600 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] my-6 flex justify-center items-center relative z-10 hover:scale-105 transition-transform duration-500 cursor-default">
                <Star size={72} className="fill-yellow-400 text-yellow-500 mr-4 animate-[spin_10s_linear_infinite] drop-shadow-xl" />
                {totalClassStars}
              </div>
              
              <p className="text-sm font-bold relative z-10 bg-white/20 backdrop-blur-md inline-block px-8 py-3 rounded-full border border-white/30 shadow-lg mt-2">
                🏆 几何积分记录你的成长，每次进步都值得骄傲！
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* 个人龙虎榜 */}
              <GeoTower
                students={students}
                title="个人龙虎榜"
                maxItems={5}
              />

              {/* 战队风云榜 */}
              <div className="glass-panel rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl"></div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center">
                    <div className="p-2 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl shadow-lg mr-3">
                      <Trophy className="text-white" size={24}/>
                    </div>
                    战队风云榜
                  </h3>
                  <span className="text-xs font-black text-circle bg-indigo-100 px-4 py-1.5 rounded-full border border-indigo-200 shadow-sm">TOP 5</span>
                </div>
                
                <div className="space-y-3 relative z-10">
                  {[...teamStats].sort((a,b) => b.totalStars - a.totalStars).slice(0, 5).map((team, idx, arr) => {
                    const rank = arr.findIndex(t => t.totalStars === team.totalStars) + 1;
                    const isTop3 = rank <= 3;
                    const rankStyles = [
                      'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300 shadow-yellow-200/50', 
                      'bg-gradient-to-r from-slate-100 to-slate-50 border-slate-300 shadow-slate-200/50', 
                      'bg-gradient-to-r from-orange-100 to-orange-50 border-orange-300 shadow-orange-200/50' 
                    ];
                    
                    return (
                      <div 
                        key={team.id} 
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-in slide-in-from-bottom-4 fade-in fill-mode-both ${isTop3 ? rankStyles[rank - 1] : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'}`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-inner ${rank===1?'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white':rank===2?'bg-gradient-to-br from-slate-300 to-slate-400 text-white':rank===3?'bg-gradient-to-br from-orange-300 to-orange-500 text-white':'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {rank}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-base">{team.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 bg-slate-100 inline-block px-2 py-0.5 rounded mt-0.5">
                              成员: {team.members.length}人
                            </div>
                          </div>
                        </div>
                        <div className={`text-xl font-black flex items-center ${rank===1?'text-yellow-600':rank===2?'text-slate-600':rank===3?'text-orange-600':'text-slate-700'}`}>
                          {team.totalStars} <Star size={16} className={`ml-1 ${isTop3 ? 'fill-current' : 'fill-amber-400 text-amber-500'}`}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 星空探索抽奖 (Gacha Machine) */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="dark-glass-panel rounded-[3.5rem] p-8 sm:p-16 shadow-[0_0_50px_rgba(79,70,229,0.15)] relative overflow-hidden border border-indigo-500/20"
            >
              {/* 背景装饰粒子 */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 5}s`,
                      opacity: Math.random() * 0.5 + 0.2
                    }}
                  />
                ))}
              </div>

              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none"></div>
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"></div>
              <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-flex items-center justify-center p-7 bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 rounded-[2rem] mb-8 shadow-[0_0_40px_rgba(99,102,241,0.6)] border-4 border-white/20 animate-float"
                >
                  <Rocket size={64} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </motion.div>
                
                <div className="flex flex-col items-center gap-5 mb-10">
                  <div className="relative">
                    <h3 className="text-4xl sm:text-5xl font-black text-white tracking-[0.2em] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] uppercase">
                      几何探索宝箱
                    </h3>
                    <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProbSection(!showProbSection)}
                    className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 border-2 ${
                      showProbSection 
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.6)]' 
                        : 'bg-slate-900/80 text-indigo-300 border-indigo-500/30 hover:border-indigo-400/50 hover:bg-slate-800'
                    }`}
                  >
                    <Shield size={16} className={showProbSection ? 'animate-pulse' : ''} />
                    {showProbSection ? '隐藏概率公示' : '查看概率公示'}
                  </motion.button>
                </div>

                <div className="flex items-center gap-3 mb-12">
                  <div className="h-px w-8 bg-indigo-500/30"></div>
                  <p className="text-indigo-200 font-bold text-sm sm:text-base tracking-wide opacity-80">
                    消耗星数开启几何宝箱 · 探索未知奖励
                  </p>
                  <div className="h-px w-8 bg-indigo-500/30"></div>
                </div>
                
                <motion.div 
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-5xl mx-auto"
                >
                  {GACHA_MODES.map((mode) => {
                    const tier1Prize = prizes.find(p => p.id === 'tier1');
                    const isTier1SoldOut = tier1Prize && tier1Prize.stock === 0;
                    const isDisabled = mode.id === 4 && isTier1SoldOut;

                    return (
                      <motion.button
                        key={mode.id}
                        variants={{
                          hidden: { opacity: 0, scale: 0.9, y: 20 },
                          show: { opacity: 1, scale: 1, y: 0 }
                        }}
                        disabled={isDisabled}
                        onClick={() => setGachapon({ 
                          isOpen: true, 
                          stage: 'auth', 
                          studentId: '', 
                          studentName: '', 
                          result: null, 
                          resultItem: null,
                          selectedMode: mode.id,
                          cost: mode.cost
                        })}
                        className={`group relative p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left overflow-hidden ${
                          isDisabled 
                            ? 'bg-slate-800/50 border-slate-700 opacity-60 cursor-not-allowed' 
                            : 'bg-slate-900/60 border-indigo-500/20 hover:border-indigo-400/50 hover:bg-indigo-950/40 hover:scale-[1.03] active:scale-95 shadow-xl hover:shadow-indigo-500/30'
                        }`}
                      >
                        {/* 扫描线效果 */}
                        {!isDisabled && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-500/10 to-transparent animate-scan"></div>
                          </div>
                        )}

                        {!isDisabled && (
                          <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-shimmer"></div>
                        )}
                        
                        <div className="flex justify-between items-start mb-5 relative z-10">
                          <div className={`p-4 rounded-2xl shadow-inner ${
                            mode.id === 1 ? 'bg-slate-800 border border-slate-700' :
                            mode.id === 2 ? 'bg-blue-600/20 border border-blue-500/30' :
                            mode.id === 3 ? 'bg-purple-600/20 border border-purple-500/30' :
                            'bg-amber-500/20 border border-amber-500/30'
                          }`}>
                            {mode.id === 1 && <Package size={28} className="text-slate-400" />}
                            {mode.id === 2 && <Zap size={28} className="text-blue-400" />}
                            {mode.id === 3 && <Sparkles size={28} className="text-purple-400" />}
                            {mode.id === 4 && <Star size={28} className="text-amber-400" />}
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                                {mode.cost}
                              </span>
                              <span className="text-[10px] text-indigo-300 font-black tracking-tighter uppercase">Stars</span>
                            </div>
                            <div className="w-12 h-1 bg-indigo-500/20 rounded-full mt-1 overflow-hidden">
                              <motion.div 
                                className="h-full bg-indigo-500"
                                initial={{ width: 0 }}
                                whileInView={{ width: '100%' }}
                                transition={{ duration: 1, delay: 0.5 }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="relative z-10">
                          <h4 className="text-2xl font-black text-white mb-2 group-hover:text-indigo-300 transition-colors tracking-tight">
                            {mode.name}
                          </h4>
                          <p className="text-xs text-indigo-200/50 font-medium leading-relaxed group-hover:text-indigo-200/80 transition-colors">
                            {isDisabled ? "最高奖励已绝版，该通道关闭" : mode.description}
                          </p>
                        </div>

                        {mode.id === 4 && !isDisabled && (
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl shadow-lg uppercase tracking-widest animate-pulse">
                            Legendary
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>

                {/* 奖池概率公示区域 */}
                <AnimatePresence>
                  {showProbSection && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20 }}
                      className="mt-16 w-full max-w-5xl mx-auto overflow-hidden"
                    >
                      <div className="bg-slate-900/60 border border-indigo-500/20 rounded-[3rem] p-10 backdrop-blur-md shadow-inner">
                        <div className="flex flex-wrap justify-center gap-4 mb-10">
                          {GACHA_MODES.map(m => (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              key={m.id}
                              onClick={() => setProbModeId(m.id)}
                              className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all border-2 ${
                                probModeId === m.id 
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                                  : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-300'
                              }`}
                            >
                              {m.name}
                            </motion.button>
                          ))}
                        </div>

                        <div className="text-xs text-indigo-300 font-black uppercase tracking-[0.3em] mb-8 flex items-center justify-center gap-6">
                          <div className="h-px bg-gradient-to-r from-transparent to-indigo-500/50 flex-1"></div>
                          <span className="flex items-center gap-2">
                            <Sparkles size={16} className="text-indigo-400 animate-pulse"/> 
                            {GACHA_MODES.find(m => m.id === probModeId)?.name} 实时概率 
                            <Sparkles size={16} className="text-indigo-400 animate-pulse"/>
                          </span>
                          <div className="h-px bg-gradient-to-l from-transparent to-indigo-500/50 flex-1"></div>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                          {prizes.map((p, idx) => {
                            const currentMode = GACHA_MODES.find(m => m.id === probModeId) || GACHA_MODES[0];
                            const modeWeights = currentMode.weights;
                            const isMelted = p.stock === 0;
                            
                            // Calculate actual probability based on the selected mode's weights and current stock
                            const availablePool = prizes.filter(x => (x.stock === null || x.stock > 0) && (modeWeights[x.id as keyof typeof modeWeights] > 0));
                            const totalWeight = availablePool.reduce((acc, curr) => acc + modeWeights[curr.id as keyof typeof modeWeights], 0);
                            
                            const weight = modeWeights[p.id as keyof typeof modeWeights] || 0;
                            const actualProb = (isMelted || weight === 0 || totalWeight === 0) ? 0 : Math.round((weight / totalWeight) * 100);

                            return (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                key={p.id} 
                                className={`relative p-5 rounded-3xl flex flex-col justify-between h-40 transition-all duration-300 ${
                                  isMelted 
                                    ? 'bg-slate-900/80 border border-slate-800 opacity-40 grayscale' 
                                    : 'bg-slate-800/60 border border-white/5 hover:border-indigo-500/50 hover:bg-slate-800 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-3.5 h-3.5 rounded-full ${p.color} shadow-[0_0_12px_currentColor] animate-pulse`}></div>
                                    <span className="font-black text-slate-300 text-xs tracking-tighter uppercase">{p.level}</span>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className={`text-2xl font-black leading-none ${isMelted ? 'text-slate-700' : 'text-indigo-400'}`}>
                                      {actualProb}<span className="text-[10px] ml-0.5">%</span>
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mt-auto">
                                  <div className={`font-black text-lg mb-1.5 truncate ${isMelted ? 'text-slate-600' : 'text-white'}`}>{p.name}</div>
                                  <div className="flex justify-between items-center gap-2">
                                    <span className="text-[10px] text-slate-500 font-medium truncate flex-1" title={p.items.join('、')}>{p.items.join('、')}</span>
                                    {p.stock !== null && (
                                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg whitespace-nowrap ${
                                        isMelted 
                                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                      }`}>
                                        {isMelted ? 'SOLD OUT' : `STOCK: ${p.stock}`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                        <div className="text-center mt-10">
                           <span className="inline-flex items-center gap-2 text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full text-indigo-300 font-bold">
                             <Shield size={14} className="text-emerald-500 animate-pulse"/> 智能库存熔断机制已启用 · 实时概率动态重分配
                           </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}

        {/* ================= PRIZES (奖品图鉴 & 奖池配置管理) ================= */}
        {viewMode === 'prizes' && (
          <div className="animate-in fade-in duration-500 pb-20">
            <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 animate-gradient-pan rounded-[2.5rem] p-10 text-white text-center shadow-2xl relative overflow-hidden mb-8 border border-white/20">
               <div className="absolute inset-0 bg-[radial-gradient(circle,white_10%,transparent_20%)] [background-size:24px_24px] opacity-10"></div>
               
               <h2 className="text-3xl sm:text-4xl font-black mb-3 relative z-10 flex items-center justify-center drop-shadow-lg">
                 <Package className="mr-4 text-white" size={40}/> 星空奖品图鉴
               </h2>
               <p className="text-sm font-bold relative z-10 bg-white/20 backdrop-blur-md inline-block px-6 py-2 rounded-full mt-2 shadow-sm border border-white/20">
                 ✨ 探索宇宙的馈赠！看看盲盒里藏着什么惊喜？
               </p>
               
               {!isEditingPrizes && (
                 <button onClick={() => {
                   const pwd = prompt("请输入金老师专属配置密码:");
                   if(pwd === '504') {
                     setEditingPrizesData(JSON.parse(JSON.stringify(prizes))); 
                     setIsEditingPrizes(true);
                   } else if (pwd) {
                     showNotification("密码错误", "error");
                   }
                 }} className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-md transition-all flex items-center border border-white/30 shadow-lg">
                   <Edit2 size={16} className="mr-2"/> 管理奖池
                 </button>
               )}
            </div>

            {!isEditingPrizes ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {prizes.map(p => {
                   const isMelted = p.stock === 0;
                   return (
                     <div key={p.id} className={`bg-white rounded-[2rem] shadow-xl border-t-8 ${p.color.replace('bg-', 'border-')} overflow-hidden hover:-translate-y-2 transition-transform duration-300 relative ${isMelted ? 'opacity-70 grayscale' : ''}`}>
                       {isMelted && (
                         <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                           <div className="bg-rose-500 text-white font-black px-6 py-2 rounded-full rotate-[-15deg] shadow-lg text-lg border-2 border-white">已被抽空</div>
                         </div>
                       )}
                       <div className={`p-6 bg-gradient-to-b ${p.color.replace('bg-', 'from-').replace('500', '50')} to-white h-full flex flex-col`}>
                         <div className="flex justify-between items-start mb-4">
                           <span className={`px-4 py-1.5 rounded-full text-white font-black text-xs shadow-sm ${p.color}`}>{p.level}</span>
                           {p.stock !== null ? (
                             <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md border border-amber-200 flex items-center">
                               <Package size={12} className="mr-1"/> 限量: {p.stock}份
                             </span>
                           ) : (
                             <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 flex items-center">
                               <Package size={12} className="mr-1"/> 无限量
                             </span>
                           )}
                         </div>
                         <h3 className="text-2xl font-black text-slate-800 mb-1">{p.name}</h3>

                         
                         <div className="space-y-2 flex-1">
                           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">包含奖项清单:</div>
                           {p.items.map((item, idx) => (
                             <div key={idx} className="bg-white border border-slate-100 p-3 rounded-xl text-xs font-bold text-slate-700 flex items-center shadow-sm">
                               <Sparkles size={14} className={`mr-2 shrink-0 ${p.color.replace('bg-', 'text-')}`} />
                               <span className="leading-relaxed">{item}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
            ) : (
               <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-8 animate-in zoom-in-95 duration-300">
                 <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-100 pb-6 gap-4">
                   <h3 className="text-2xl font-black text-slate-800 flex items-center"><Settings className="mr-3 text-indigo-500" size={28}/> 奖池参数配置中...</h3>
                   <div className="flex gap-3">
                     <button onClick={() => {
                       if(window.confirm('确定要同步到最新的官方奖池配置吗？这会覆盖当前的奖项名称、概率和奖品清单。')) {
                         setEditingPrizesData(JSON.parse(JSON.stringify(INITIAL_PRIZES)));
                         showNotification('已同步最新配置，请点击“保存并发布”生效。', 'info');
                       }
                     }} className="px-5 py-3 bg-amber-50 text-amber-600 font-bold rounded-xl hover:bg-amber-100 transition-colors flex items-center border border-amber-200">
                       <RotateCcw size={18} className="mr-2"/> 同步最新配置
                     </button>
                     <button onClick={() => setIsEditingPrizes(false)} className="px-5 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">取消修改</button>
                     <button onClick={() => {
                       setPrizes(editingPrizesData);
                       setIsEditingPrizes(false);
                       showNotification('奖池规则已更新并生效！');
                     }} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black rounded-xl hover:shadow-lg transition-all flex items-center"><Save size={18} className="mr-2"/> 保存并发布</button>
                   </div>
                 </div>
                 
                 <div className="space-y-6">
                   {editingPrizesData.map((p, idx) => (
                     <div key={p.id} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl relative group hover:border-indigo-300 transition-colors shadow-sm">
                       <button onClick={() => setEditingPrizesData(prev => prev.filter(item => item.id !== p.id))} className="absolute top-6 right-6 text-rose-400 hover:text-rose-600 p-2 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-transparent hover:border-rose-200"><Trash2 size={20}/></button>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-5 pr-14">
                         <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">奖项等级</label>
                           <input type="text" value={p.level} placeholder="如: 特等奖" onChange={(e) => {
                             const newData = [...editingPrizesData];
                             newData[idx].level = e.target.value;
                             setEditingPrizesData(newData);
                           }} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"/>
                         </div>
                         <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">盲盒名称</label>
                           <input type="text" value={p.name} placeholder="如: 几何宝藏" onChange={(e) => {
                             const newData = [...editingPrizesData];
                             newData[idx].name = e.target.value;
                             setEditingPrizesData(newData);
                           }} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"/>
                         </div>
                         <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">概率权重</label>
                           <input type="number" value={p.probability} onChange={(e) => {
                             const newData = [...editingPrizesData];
                             newData[idx].probability = Number(e.target.value);
                             setEditingPrizesData(newData);
                           }} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"/>
                         </div>
                         <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">限量库存 (空为无限)</label>
                           <input type="number" value={p.stock === null ? '' : p.stock} placeholder="无限" onChange={(e) => {
                             const newData = [...editingPrizesData];
                             newData[idx].stock = e.target.value === '' ? null : Number(e.target.value);
                             setEditingPrizesData(newData);
                           }} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"/>
                         </div>
                         <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">主题配色</label>
                           <select value={p.color} onChange={(e) => {
                             const newData = [...editingPrizesData];
                             newData[idx].color = e.target.value;
                             setEditingPrizesData(newData);
                           }} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer">
                             <option value="bg-amber-500">金色 (Amber)</option>
                             <option value="bg-purple-500">紫色 (Purple)</option>
                             <option value="bg-blue-500">蓝色 (Blue)</option>
                             <option value="bg-emerald-500">绿色 (Emerald)</option>
                             <option value="bg-rose-500">红色 (Rose)</option>
                             <option value="bg-indigo-500">靛青 (Indigo)</option>
                             <option value="bg-slate-500">灰色 (Slate)</option>
                             <option value="bg-triangle">粉色 (Pink)</option>
                           </select>
                         </div>
                       </div>
                       
                       <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 flex items-center"><Package size={12} className="mr-1"/> 包含的具体奖品 (使用逗号分隔)</label>
                         <textarea rows="2" value={p.items.join(', ')} placeholder="例如: 棒棒糖, 免死金牌, 奶茶兑换券" onChange={(e) => {
                           const newData = [...editingPrizesData];
                           newData[idx].items = e.target.value.split(/[,，]/).map(i => i.trim()).filter(i => i);
                           setEditingPrizesData(newData);
                         }} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none leading-relaxed transition-all"></textarea>
                       </div>
                     </div>
                   ))}
                   
                   <button onClick={() => {
                     setEditingPrizesData([...editingPrizesData, {
                       id: 'tier_' + Date.now(),
                       level: '新奖项等级',
                       name: '新增神秘盲盒',
                       probability: 10,
                       stock: null,
                       color: 'bg-emerald-500',
                       items: ['惊喜小礼品']
                     }]);
                   }} className="w-full py-5 border-2 border-dashed border-indigo-200 text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 hover:border-indigo-400 transition-all flex items-center justify-center text-lg shadow-sm">
                     <Plus size={24} className="mr-2"/> 添加新的奖励层级
                   </button>
                 </div>
               </div>
            )}
          </div>
        )}

        {/* ================= TEAMS (战队排行与小组集星) ================= */}
        {viewMode === 'teams' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 pb-20">
            {/* 战队头部 Banner (动态流光与悬浮特效) */}
            <div className="animate-gradient-pan bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-[2.5rem] p-10 text-white text-center shadow-2xl relative overflow-hidden mb-16 border border-white/20 group">
              <div className="absolute inset-0 bg-[radial-gradient(circle,white_10%,transparent_20%)] [background-size:24px_24px] opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>
              
              {/* 漂浮装饰物 */}
              <div className="absolute top-8 left-10 text-blue-300/60 animate-float"><Rocket size={40} /></div>
              <div className="absolute bottom-10 right-12 text-yellow-300/60 animate-float-delayed"><Star size={48} className="fill-yellow-300/30"/></div>
              
              <h2 className="text-3xl sm:text-5xl font-black mb-4 relative z-10 tracking-widest flex items-center justify-center drop-shadow-lg">
                <Award className="mr-4 text-yellow-400 drop-shadow-md" size={48}/> 战队竞技
              </h2>
              <p className="text-sm sm:text-base font-bold relative z-10 bg-white/20 backdrop-blur-md inline-block px-8 py-3 rounded-full border border-white/30 shadow-lg mt-2">
                🚀 团队的力量无可限量！点击下方战队名称可自定义修改！
              </p>
            </div>

            {/* 每周冠军小组板块 */}
            {weeklyChampions.length > 0 && (
              <div className="mb-16 animate-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-8 px-4">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center">
                    <Trophy className="mr-3 text-yellow-500 p-1.5 bg-yellow-100 rounded-lg" size={32}/> 每周冠军小组
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-6"></div>
                </div>
                
                <div className="flex gap-6 overflow-x-auto pb-6 px-4 scrollbar-hide">
                  {weeklyChampions.map((champion, idx) => (
                    <div 
                      key={champion.weekKey}
                      className="min-w-[300px] bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                    >
                      {/* 背景装饰 */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl group-hover:bg-yellow-400/20 transition-colors"></div>
                      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-400/5 rounded-full blur-xl"></div>
                      
                      <div className="flex items-center justify-between mb-5">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                          {champion.startDate} - {champion.endDate}
                        </div>
                        {idx === 0 && (
                          <div className="flex items-center gap-1 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                            <Sparkles size={10} />
                            最新冠军
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-5 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-yellow-200 group-hover:rotate-12 transition-transform duration-500 relative">
                          <Crown size={36} />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <Star size={10} className="text-yellow-500 fill-yellow-500" />
                          </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-xs font-bold text-slate-400 mb-0.5">冠军战队</div>
                          <div className="text-xl font-black text-slate-800 truncate group-hover:text-circle transition-colors">
                            {teamNames[champion.teamId] || `第 ${champion.teamId} 战队`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-white p-4 rounded-2xl border border-slate-100 shadow-inner">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">上周总得分</span>
                          <div className="flex items-center text-indigo-600 font-black text-xl">
                            <Star size={16} className="mr-1 text-yellow-500 fill-yellow-500" />
                            +{champion.totalStars}
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                          <TrendingUp size={20} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 战队全览列表 (毛玻璃卡片与悬浮特效) */}
            <div className="glass-panel rounded-[2.5rem] shadow-xl border border-white/50 p-8 relative overflow-hidden">
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]"></div>
              
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-5 mb-8 relative z-10">
                <h3 className="text-2xl font-black text-slate-800 flex items-center">
                  <Users className="mr-3 text-indigo-500 p-1.5 bg-indigo-100 rounded-lg" size={32}/> 舰队全览
                </h3>
                <button 
                  onClick={() => setShowResetTeamNamesConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-all font-bold text-sm border border-slate-200 hover:border-rose-200"
                >
                  <RotateCcw size={16} />
                  全部舰队名重置
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
                {teamStats.map((team, index) => {
                  // 计算名单分为两行显示
                  const members = team?.members || [];
                  const half = Math.ceil(members.length / 2);
                  const line1 = members.slice(0, half).map(m => m.name).join(' · ');
                  const line2 = members.slice(half).map(m => m.name).join(' · ');

                  return (
                    <div 
                      key={team.id || `team-${index}`} 
                      className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all duration-300 flex flex-col justify-between group animate-in zoom-in-95 fade-in fill-mode-both hover:shadow-[0_10px_25px_rgba(99,102,241,0.15)] hover:-translate-y-1.5"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex-1 mr-2">
                          <div className="flex items-center gap-3 mb-1.5">
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors">{index + 1}</span>
                              {editingTeamId !== team.id && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTeamId(team.id);
                                  }}
                                  className="text-slate-300 hover:text-indigo-500 transition-colors p-1 rounded-full hover:bg-indigo-50 opacity-0 group-hover:opacity-100"
                                  title="修改战队名称"
                                >
                                  <Edit2 size={12} />
                                </button>
                              )}
                            </div>
                            
                            {editingTeamId === team.id ? (
                              <input 
                                type="text"
                                value={teamNames[team.id] || ''}
                                placeholder={`第 ${team.id} 战队`}
                                onChange={(e) => handleUpdateTeamName(team.id, e.target.value)}
                                onBlur={() => setEditingTeamId(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') setEditingTeamId(null);
                                }}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                className="font-bold text-slate-800 text-xl group-hover:text-circle transition-colors bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-300 rounded w-full"
                              />
                            ) : (
                              <div className="flex items-center gap-2 w-full overflow-hidden">
                                <button 
                                  onClick={() => {
                                    setSelectedTeamDetailId(team.id);
                                    setViewMode('team_detail');
                                  }}
                                  className="font-bold text-slate-800 text-xl hover:text-circle transition-colors text-left truncate flex-1"
                                >
                                  {teamNames[team.id] || `第 ${team.id} 战队`}
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* 优雅的两行名字排版 */}
                          <div className="text-xs text-slate-500 font-medium pl-10 pr-2 flex flex-col gap-0.5" title={members.map(m => m.name).join(' · ')}>
                            <span className="truncate w-full">{line1}</span>
                            {line2 && <span className="truncate w-full">{line2}</span>}
                          </div>
                        </div>
                        <div className="text-right bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors shrink-0">
                          <div className="text-2xl font-black text-amber-500 flex items-center justify-end">{team.totalStars} <Star size={12} className="ml-1 fill-amber-400"/></div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Total Stars</div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setSelectedTeamForAction(team)}
                        className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center shadow-sm active:scale-95"
                      >
                        <Sparkles size={16} className="mr-1.5"/> 快捷录入 (全员)
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TEAM DETAIL (战队详情) ================= */}
        {viewMode === 'team_detail' && selectedTeamDetailId && (
          <div className="animate-in fade-in zoom-in-95 duration-500 pb-20">
            {(() => {
              const team = teamStats.find(t => t.id === selectedTeamDetailId);
              if (!team) return <div className="text-center text-slate-400 mt-20">未找到战队信息</div>;

              return (
                <div className="max-w-4xl mx-auto">
                  {/* 头部导航与信息 */}
                  <div className="flex items-center justify-between mb-8">
                    <button 
                      onClick={() => setViewMode('teams')}
                      className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200"
                    >
                      <ChevronLeft size={20} className="mr-1"/> 返回榜单
                    </button>
                    <div className="text-right flex flex-col items-end">
                      {editingTeamId === team.id ? (
                        <input 
                          type="text"
                          value={teamNames[team.id] || ''}
                          placeholder={`第 ${team.id} 战队`}
                          onChange={(e) => handleUpdateTeamName(team.id, e.target.value)}
                          onBlur={() => setEditingTeamId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingTeamId(null);
                          }}
                          autoFocus
                          className="font-black text-slate-800 text-2xl bg-white border-b-2 border-indigo-500 outline-none px-2 py-1 rounded text-right"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-black text-slate-800">{teamNames[team.id] || `第 ${team.id} 战队`}</h2>
                          <button 
                            onClick={() => setEditingTeamId(team.id)}
                            className="text-slate-400 hover:text-indigo-500 transition-colors p-1.5 rounded-full hover:bg-indigo-50"
                            title="修改战队名称"
                          >
                            <Edit2 size={18} />
                          </button>
                        </div>
                      )}
                      <div className="text-sm font-bold text-slate-400 flex items-center justify-end mt-1">
                        <Users size={14} className="mr-1"/> {team.members.length} 名成员
                        <span className="mx-2">·</span>
                        <Star size={14} className="mr-1 text-amber-400 fill-amber-400"/> 总经验: {team.totalStars}
                      </div>
                    </div>
                  </div>

                  {/* 成员列表卡片 */}
                  <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-700 flex items-center">
                        <Medal className="mr-2 text-indigo-500" size={20}/> 成员今日表现 ({selectedDateKey})
                      </h3>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                      {team.members.map(student => {
                        // 计算今日获得星数
                        const todayStars = logs
                          .filter(l => l.studentId === student.id && l.dateKey === selectedDateKey)
                          .reduce((acc, log) => acc + log.amount, 0);
                        
                        // 计算累计成就
                        const totalTaskCompleted = logs.filter(l => l.studentId === student.id && l.reason === '今日事今日毕').length;
                        const totalCalculationPassed = logs.filter(l => l.studentId === student.id && l.reason === '口算达标并订正').length;
                        
                        // 检查是否为队内第一
                        const maxStars = Math.max(...team.members.map(m => m.totalStars || 0));
                        const isTopScorer = (student.totalStars || 0) === maxStars && maxStars > 0;

                        // 检查作业状态
                        const isPerfect = logs.some(l => l.studentId === student.id && l.dateKey === selectedDateKey && l.reason === '完美作业');
                        const isWeekendPerfect = logs.some(l => l.studentId === student.id && l.dateKey === selectedDateKey && l.reason === '周末完美作业');
                        const isTodayDone = logs.some(l => l.studentId === student.id && l.dateKey === selectedDateKey && l.reason === '今日事今日毕');
                        const isWeekendDone = logs.some(l => l.studentId === student.id && l.dateKey === selectedDateKey && l.reason === '周末作业清零');
                        const isCorrected = logs.some(l => l.studentId === student.id && l.dateKey === selectedDateKey && l.reason === '补订正');

                        return (
                          <div key={student.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border-2 border-white shadow-sm group-hover:scale-110 transition-transform ${isTopScorer ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white ring-2 ring-yellow-200' : 'bg-slate-100 text-slate-500'}`}>
                                  {student.id}
                                </div>
                                {isTopScorer && (
                                  <div className="absolute -top-3 -right-1 bg-white rounded-full p-0.5 shadow-sm animate-bounce">
                                    <Crown size={14} className="fill-yellow-400 text-yellow-500" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 text-lg flex items-center">
                                  {student.name}
                                  {isTopScorer && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-200">队内MVP</span>}
                                </div>
                                <div className="text-xs font-medium text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">总经验: {student.totalStars}</span>
                                  {todayStars > 0 && (
                                    <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded flex items-center">
                                      今日: +{todayStars} <Star size={10} className="ml-0.5 fill-amber-500"/>
                                    </span>
                                  )}
                                  <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded flex items-center" title="累计今日事今日毕次数">
                                    <CheckCircle2 size={10} className="mr-1"/> {totalTaskCompleted}
                                  </span>
                                  <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded flex items-center" title="累计口算订正过关次数">
                                    <Calculator size={10} className="mr-1"/> {totalCalculationPassed}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {(isPerfect || isWeekendPerfect) && (
                                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-1 shadow-sm border border-amber-200 relative">
                                    <Crown size={20} className="fill-amber-500" />
                                    {isPerfect && isWeekendPerfect && (
                                      <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                                        2
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                    {isPerfect && isWeekendPerfect ? '双重完美' : isWeekendPerfect ? '周末完美' : '完美作业'}
                                  </span>
                                </div>
                              )}
                              
                              {(isTodayDone || isWeekendDone) && !isPerfect && !isWeekendPerfect && (
                                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1 shadow-sm border border-emerald-200 relative">
                                    <CheckCircle2 size={20} />
                                    {isTodayDone && isWeekendDone && (
                                      <div className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                                        2
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    {isTodayDone && isWeekendDone ? '全部清零' : isWeekendDone ? '周末清零' : '今日事今日毕'}
                                  </span>
                                </div>
                              )}

                              {isCorrected && !isPerfect && !isWeekendPerfect && !isTodayDone && !isWeekendDone && (
                                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-1 shadow-sm border border-slate-200">
                                    <CheckCircle2 size={20} />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">已补订正</span>
                                </div>
                              )}

                              {!isPerfect && !isTodayDone && !isCorrected && (
                                <div className="flex flex-col items-center opacity-30 grayscale">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-1 border border-slate-200">
                                    <AlertCircle size={20} />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400">待完成</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ================= ALL STUDENTS (档案库) ================= */}
        {viewMode === 'all_students' && (
          <div className="animate-in fade-in duration-500 pb-20">
            <div className="bg-white rounded-3xl shadow-xl border border-indigo-50 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 p-6 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black flex items-center"><Users className="mr-3" size={28} /> 我的成长库</h2>
                  <p className="text-xs text-indigo-100 opacity-80 mt-1">点击学生卡片可进行快捷加/扣星操作</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleAIScan}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-md transition-all flex items-center"
                  >
                    <BrainCircuit size={16} className="mr-2"/>
                    AI 智能扫描
                  </button>
                  <button onClick={() => setSortMode(prev => prev === 'id' ? 'stars' : 'id')} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-md transition-all flex items-center">
                    <ArrowRightLeft size={16} className="mr-2"/>
                    {sortMode === 'id' ? '按学号排序' : '按经验值排名'}
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowBulkActionModal(true)}
                    className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                      </div>
                      <div className="text-left">
                        <div className="font-black text-slate-700">全员快速加/减星</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">一键为所有同学同步录入流水</div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </button>

                  <button 
                    onClick={() => setShowQuickActionModal(true)}
                    className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                        <Hash size={24} />
                      </div>
                      <div className="text-left">
                        <div className="font-black text-slate-700">按学号快捷录入</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">支持多选学号，批量快速录入</div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 min-h-[500px]">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {sortedStudents.map((student, index) => (
                    <button 
                      key={student.id}
                      onClick={() => setSelectedStudentForAction(student)}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center hover:shadow-md hover:border-indigo-400 hover:-translate-y-1 transition-all group relative overflow-hidden"
                    >
                      {sortMode === 'stars' && (
                        <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${index === 0 ? 'bg-yellow-400 text-white' : index === 1 ? 'bg-slate-300 text-slate-700' : index === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {index + 1}
                        </div>
                      )}
                      <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-50 rounded-bl-full -mr-2 -mt-2"></div>
                      
                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-lg mb-2 relative z-10">
                        {student.id}
                      </div>
                      <div className="font-bold text-slate-700 mb-2 group-hover:text-circle">{student.name}</div>
                      
                      <div className="w-full flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center justify-between bg-yellow-50 px-2 py-1 rounded-lg">
                          <span className="text-[10px] text-yellow-700 font-bold">总经验</span>
                          <span className="text-xs font-black text-yellow-600 flex items-center">{student.totalStars} <Star size={10} className="ml-0.5 fill-yellow-500"/></span>
                        </div>
                        <div className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded-lg">
                          <span className="text-[10px] text-blue-700 font-bold">流通币</span>
                          <span className={`text-xs font-black flex items-center ${student.availableStars < 0 ? 'text-rose-500' : 'text-blue-600'}`}>{student.availableStars} <Coins size={10} className="ml-0.5"/></span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 作业订正监控 (自动生成) */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 mt-6 animate-in fade-in duration-500 overflow-hidden relative">
              {/* 顶部装饰背景 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-purple-400 to-indigo-400"></div>

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center">
                  <AlertCircle className="mr-2 text-rose-500" /> 今日作业订正监控 ({selectedDateKey})
                </h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleAnalyzeToday}
                    disabled={isAnalyzing}
                    className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors flex items-center disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader size={12} className="animate-spin mr-1"/> : <BrainCircuit size={12} className="mr-1"/>}
                    智能分析
                  </button>
                  <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    待订正: {(() => {
                      const isMonday = selectedDate.getDay() === 1;
                      if (isMonday) {
                        return students.filter(s => !logs.some(l => l.studentId === s.id && l.dateKey === selectedDateKey && (l.reason === '周末作业清零' || l.reason === '周末完美作业'))).length;
                      }
                      return students.filter(s => !logs.some(l => l.studentId === s.id && l.dateKey === selectedDateKey && (l.reason === '完美作业' || l.reason === '今日事今日毕'))).length;
                    })()} 人
                  </div>
                </div>
              </div>

              {/* AI Encouragement & Analysis Result */}
              {(dailyEncouragement || analysisResult) && (
                <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-full blur-xl"></div>
                  
                  {dailyEncouragement && (
                    <div className="flex items-start gap-3 mb-2">
                      <div className="bg-white p-1.5 rounded-lg shadow-sm text-indigo-500 shrink-0">
                        <Smile size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-indigo-400 mb-0.5 uppercase tracking-wider">每日寄语</div>
                        <div className="text-sm font-medium text-slate-700 leading-relaxed">
                          {dailyEncouragement}
                        </div>
                      </div>
                    </div>
                  )}

                  {analysisResult && (
                    <div className="mt-3 pt-3 border-t border-indigo-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                      <div className="bg-white p-1.5 rounded-lg shadow-sm text-purple-500 shrink-0">
                        <BrainCircuit size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-400 mb-0.5 uppercase tracking-wider">智能分析报告</div>
                        <div className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                          {analysisResult}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* 进度条 */}
              {(() => {
                const isMonday = selectedDate.getDay() === 1;
                const incompleteMondayCount = students.filter(s => !logs.some(l => l.studentId === s.id && l.dateKey === selectedDateKey && (l.reason === '完美作业' || l.reason === '今日事今日毕'))).length;
                const incompleteWeekendCount = isMonday ? students.filter(s => !logs.some(l => l.studentId === s.id && l.dateKey === selectedDateKey && (l.reason === '周末作业清零' || l.reason === '周末完美作业'))).length : 0;
                
                const totalTasks = students.length;
                const completedTasks = isMonday ? (students.length - incompleteWeekendCount) : (students.length - incompleteMondayCount);
                const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                
                return (
                  <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                      <span>完成进度 {isMonday ? '(周末作业)' : ''}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-rose-400 to-orange-400'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 左侧：常规作业监控 */}
                  <div className="w-full lg:col-span-2">
                    {(() => {
                      const isMonday = selectedDate.getDay() === 1;
                      const incompleteMonday = students.filter(s => !logs.some(l => l.studentId === s.id && l.dateKey === selectedDateKey && (l.reason === '完美作业' || l.reason === '今日事今日毕')));
                      const incompleteWeekend = isMonday ? students.filter(s => !logs.some(l => l.studentId === s.id && l.dateKey === selectedDateKey && (l.reason === '周末作业清零' || l.reason === '周末完美作业'))) : [];
                      
                      const allClear = isMonday ? (incompleteWeekend.length === 0) : (incompleteMonday.length === 0);

                      return (
                        <div className={`rounded-2xl p-6 border min-h-[160px] relative overflow-hidden transition-all duration-500 ${
                          allClear ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                        }`}>
                          {/* 背景装饰 */}
                          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                            <ScrollText size={120} className="text-slate-400 -mr-4 -mt-4 transform rotate-12"/>
                          </div>

                          {allClear ? (
                            <div className="h-full flex flex-col items-center justify-center py-8 relative z-10 animate-in zoom-in duration-500">
                              <div className="relative mb-4">
                                <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 transform hover:scale-110 transition-transform duration-300">
                                  <Trophy size={40} className="text-white" />
                                </div>
                                <div className="absolute -top-2 -right-2">
                                   <Star size={24} className="text-yellow-400 fill-yellow-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                                </div>
                                <div className="absolute -bottom-1 -left-2">
                                   <Star size={16} className="text-yellow-400 fill-yellow-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                                </div>
                              </div>
                              <h4 className="text-2xl font-black text-emerald-600 mb-2 tracking-tight">全员清零！太棒了！🎉</h4>
                              <p className="text-sm font-medium text-emerald-600/70 bg-emerald-100/50 px-4 py-1 rounded-full">
                                {isMonday ? '上周末所有同学均已完成作业任务' : '今日所有同学均已完成作业任务'}
                              </p>
                            </div>
                          ) : (
                            <div className="relative z-10 space-y-6">
                              {isMonday && (
                                <div className="animate-in slide-in-from-top-2 duration-500">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-sm font-bold text-amber-600 flex items-center">
                                      <Calendar size={14} className="mr-1"/> 上周末作业订正监控
                                    </h5>
                                    <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                      待订正: {incompleteWeekend.length} 人
                                    </span>
                                  </div>
                                  {incompleteWeekend.length === 0 ? (
                                    <div className="text-xs text-emerald-500 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center">
                                      <CheckCircle size={14} className="mr-2"/> 周末作业已全员清零！
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap gap-3">
                                      {incompleteWeekend.map(student => (
                                        <div key={`weekend-${student.id}`} className="group bg-white border border-amber-200 pl-1 pr-1 py-1 rounded-full flex items-center shadow-sm hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all animate-in zoom-in duration-300">
                                          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs mr-2 border border-amber-100 group-hover:bg-amber-100 transition-colors">
                                            {student.id}
                                          </div>
                                          <span className="text-sm font-bold text-slate-700 mr-3 min-w-[3em]">
                                            {student.name}
                                          </span>
                                          <div className="flex gap-1">
                                            <button 
                                              onDoubleClick={() => commitAddStar(student.id, 1, '周末完美作业')}
                                              className="bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-600 w-8 h-8 rounded-full flex items-center justify-center transition-all border border-amber-100 hover:border-amber-500"
                                              title="周末完美作业 (双击+1星)"
                                            >
                                              <Crown size={14} />
                                            </button>
                                            <button 
                                              onDoubleClick={() => commitAddStar(student.id, 0.5, '周末作业清零')}
                                              className="bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center transition-all border border-emerald-100 hover:border-emerald-500"
                                              title="完成周末订正 (双击+0.5星)"
                                            >
                                              <CheckCircle2 size={16} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {!isMonday && (
                                <div className="animate-in slide-in-from-top-2 duration-500">
                                  {incompleteMonday.length === 0 ? (
                                    null
                                  ) : (
                                    <div className="flex flex-wrap gap-3">
                                      {incompleteMonday.map(student => (
                                        <div key={`monday-${student.id}`} className="group bg-white border border-rose-200 pl-1 pr-1 py-1 rounded-full flex items-center shadow-sm hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5 transition-all animate-in zoom-in duration-300">
                                          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-black text-xs mr-2 border border-rose-100 group-hover:bg-rose-100 transition-colors">
                                            {student.id}
                                          </div>
                                          <span className="text-sm font-bold text-slate-700 mr-3 min-w-[3em]">
                                            {student.name}
                                          </span>
                                          <div className="flex gap-1">
                                            <button 
                                              onDoubleClick={() => commitAddStar(student.id, 1, '完美作业')}
                                              className="bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-600 w-8 h-8 rounded-full flex items-center justify-center transition-all border border-amber-100 hover:border-amber-500"
                                              title="完美作业 (双击+1星)"
                                            >
                                              <Crown size={14} />
                                            </button>
                                            <button 
                                              onDoubleClick={() => commitAddStar(student.id, 0.5, '今日事今日毕')}
                                              className="bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center transition-all border border-emerald-100 hover:border-emerald-500"
                                              title="完成订正 (双击+0.5星)"
                                            >
                                              <CheckCircle2 size={16} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* 右侧：口算订正监控 */}
                  <div className="w-full lg:col-span-1">
                    <div className="rounded-2xl p-6 border border-indigo-100 bg-indigo-50/50 min-h-[160px] relative overflow-hidden h-full">
                      {/* 背景装饰 */}
                      <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                        <Calculator size={100} className="text-indigo-600 -mr-4 -mt-4 transform rotate-12"/>
                      </div>

                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <h4 className="font-black text-indigo-800 flex items-center text-lg">
                          <div className="bg-indigo-100 p-1.5 rounded-lg mr-2 text-indigo-600">
                            <Calculator size={18}/>
                          </div>
                          今日已订正名单（口算）
                        </h4>
                        <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full border border-indigo-200">
                          {students.filter(s => logs.some(l => l.studentId === s.id && l.dateKey === selectedDateKey && l.reason === '口算达标并订正')).length} 人
                        </span>
                      </div>
                      
                      {/* 口算订正快速录入 */}
                      <form onSubmit={handleMentalMathSubmit} className="relative z-10 mb-5 px-1">
                        <div className="relative group">
                          <input
                            type="text"
                            value={mentalMathInput}
                            onChange={(e) => setMentalMathInput(e.target.value)}
                            placeholder="输入学号快速登记口算订正..."
                            className="w-full bg-white/90 border-2 border-indigo-100 rounded-2xl py-2.5 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all placeholder:text-slate-400 shadow-sm group-hover:border-indigo-200"
                          />
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors">
                            <Plus size={18} />
                          </div>
                          <button 
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-500 text-white p-1.5 rounded-xl hover:bg-indigo-600 transition-all active:scale-95 shadow-md shadow-indigo-100"
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      </form>

                      <div className="relative z-10">
                        {students.filter(s => logs.some(l => l.studentId === s.id && l.dateKey === selectedDateKey && l.reason === '口算达标并订正')).length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {students.filter(s => logs.some(l => l.studentId === s.id && l.dateKey === selectedDateKey && l.reason === '口算达标并订正')).map(student => (
                              <div 
                                key={student.id} 
                                onDoubleClick={() => handleUndoMentalMath(student.id)}
                                className="bg-white border border-indigo-200 pl-1 pr-3 py-1 rounded-full flex items-center shadow-sm animate-in zoom-in duration-300 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group/item"
                                title="双击撤回"
                              >
                                <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px] mr-2 border border-indigo-100 group-hover/item:bg-rose-50 group-hover/item:text-rose-600 group-hover/item:border-rose-100 transition-colors">
                                  {student.id}
                                </div>
                                <span className="text-xs font-bold text-slate-700 group-hover/item:text-rose-600 transition-colors">
                                  {student.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                            <div className="bg-slate-100 p-3 rounded-full mb-2">
                              <Calculator size={24} className="text-slate-300"/>
                            </div>
                            <span className="text-xs font-medium">暂无同学完成口算订正</span>
                          </div>
                        )}
                      </div>

                      {/* 口算订正分析 */}
                      <div className="mt-4 pt-4 border-t border-indigo-100/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={14} className="text-amber-500" />
                          <span className="text-xs font-bold text-indigo-800">口算订正光荣榜</span>
                        </div>
                        <div className="space-y-2">
                          {(() => {
                            // 获取今日口算订正的学生ID
                            const completedStudentIds = new Set(logs.filter(l => l.dateKey === selectedDateKey && l.reason === '口算达标并订正').map(l => l.studentId));
                            
                            // 按小组统计
                            const teamStats: Record<number, { total: number, completed: number, name: string }> = {};
                            
                            // 初始化所有小组
                            const uniqueGroupIds: number[] = Array.from(new Set(students.map(s => s.groupId)));
                            uniqueGroupIds.forEach(gid => {
                                teamStats[gid] = {
                                    total: 0,
                                    completed: 0,
                                    name: teamNames[gid] || `第${gid}组`
                                };
                            });

                            students.forEach(s => {
                              if (teamStats[s.groupId]) {
                                teamStats[s.groupId].total++;
                                if (completedStudentIds.has(s.id)) {
                                  teamStats[s.groupId].completed++;
                                }
                              }
                            });

                            // 转换为数组并排序：完成率降序 -> 完成人数降序
                            const sortedTeams = Object.values(teamStats)
                              .map(stat => ({
                                ...stat,
                                rate: stat.total > 0 ? stat.completed / stat.total : 0
                              }))
                              .sort((a, b) => {
                                if (b.rate !== a.rate) return b.rate - a.rate;
                                return b.completed - a.completed;
                              })
                              .filter(t => t.completed > 0); // 只显示有完成的小组

                            if (sortedTeams.length === 0) {
                              return <div className="text-[10px] text-indigo-400 italic">加油！期待第一个完成的小组！</div>;
                            }

                            // 检查是否全员完成
                            const totalStudentsCount = students.length;
                            const totalCompletedCount = completedStudentIds.size;
                            const isAllCompleted = totalStudentsCount > 0 && totalStudentsCount === totalCompletedCount;

                            if (isAllCompleted) {
                                return (
                                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 rounded-xl p-3 text-center animate-in zoom-in duration-500">
                                        <div className="flex justify-center mb-1">
                                            <Trophy size={20} className="text-amber-500 animate-bounce" />
                                        </div>
                                        <div className="text-sm font-black text-amber-700">全员完成口算订正！</div>
                                        <div className="text-[10px] text-amber-600 mt-1">太棒了！所有小组都值得表扬！🎉</div>
                                    </div>
                                );
                            }

                            // 找出并列第一的小组
                            const bestRate = sortedTeams[0].rate;
                            const bestTeams = sortedTeams.filter(t => t.rate === bestRate);

                            return (
                              <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap gap-2">
                                    {sortedTeams.slice(0, Math.max(3, bestTeams.length)).map((team, index) => {
                                        const isBest = team.rate === bestRate;
                                        return (
                                            <div key={team.name} className={`text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 ${isBest ? 'bg-amber-100 text-amber-700 font-bold border border-amber-200' : 'bg-indigo-100 text-indigo-600 border border-indigo-200'}`}>
                                                {isBest && <Crown size={10} className="text-amber-500" />}
                                                <span>{team.name}</span>
                                                <span className="bg-white/50 px-1 rounded-md ml-1 text-[9px]">
                                                {Math.round(team.rate * 100)}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {sortedTeams.length > 0 && (
                                    <div className="text-[10px] text-indigo-500 font-medium mt-1">
                                        👏 表扬 {bestTeams.map(t => t.name).join('、')} 口算订正最积极！
                                        {sortedTeams.length > bestTeams.length && (
                                            ` ${sortedTeams[bestTeams.length].name} 紧随其后！`
                                        )}
                                    </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 已订正/已完成名单 (可撤回) */}
                <div className="w-full">
                  <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                    <div className="text-xs font-bold text-emerald-600 mb-3 flex items-center">
                      <History size={12} className="mr-1"/> 今日已订正名单 (点击撤回)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {logs.filter(l => l.dateKey === selectedDateKey && (l.reason === '今日事今日毕' || l.reason === '周末作业清零' || l.reason === '完美作业' || l.reason === '周末完美作业')).map(log => (
                        <div key={log.id} className="bg-white border border-emerald-100 pl-2 pr-1 py-1 rounded-full flex items-center shadow-sm animate-in fade-in zoom-in duration-300">
                          <span className="text-xs font-bold text-slate-600 mr-2">
                            {log.studentName} {(log.reason === '周末作业清零' || log.reason === '周末完美作业') && <span className="text-[10px] text-amber-500">(周末)</span>}
                          </span>
                          <button 
                            onClick={() => handleRemoveLog(log.id, log.studentId, log.amount)}
                            className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors"
                            title="撤回 (重新加入待订正)"
                          >
                            <Undo2 size={12} />
                          </button>
                        </div>
                      ))}
                      {logs.filter(l => l.dateKey === selectedDateKey && (l.reason === '今日事今日毕' || l.reason === '周末作业清零' || l.reason === '完美作业' || l.reason === '周末完美作业')).length === 0 && (
                        <div className="text-[10px] text-slate-400 italic">暂无已订正记录</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 昨日作业补订正监控 */}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-500 flex items-center">
                    <History className="mr-2 text-slate-400" size={16} /> 昨日待补订正 ({yesterdayDateKey})
                  </h4>
                  <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                    待补: {students.filter(s => !logs.some(l => l.studentId === s.id && l.dateKey === yesterdayDateKey && (l.reason === '完美作业' || l.reason === '今日事今日毕' || l.reason === '补订正'))).length} 人
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  {students.filter(s => !logs.some(l => l.studentId === s.id && l.dateKey === yesterdayDateKey && (l.reason === '完美作业' || l.reason === '今日事今日毕' || l.reason === '补订正'))).length === 0 ? (
                    <div className="text-center text-slate-400 py-4 text-xs">
                      昨日作业已全部清零！👍
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {students.filter(s => !logs.some(l => l.studentId === s.id && l.dateKey === yesterdayDateKey && (l.reason === '完美作业' || l.reason === '今日事今日毕' || l.reason === '补订正'))).map(student => (
                        <div key={`prev-${student.id}`} className="group bg-white border border-slate-200 pl-2 pr-1 py-1 rounded-full flex items-center shadow-sm hover:border-slate-300 transition-all">
                          <span className="text-xs font-bold text-slate-600 mr-2">
                            {student.name}
                          </span>
                          <button 
                            onClick={() => commitAddStar(student.id, 0, '补订正', yesterdayDateKey)}
                            className="bg-slate-100 hover:bg-slate-500 hover:text-white text-slate-400 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                            title="补订正 (不加分)"
                          >
                            <CheckCircle2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2 flex items-center">
                    <AlertTriangle size={10} className="mr-1"/> 提示：补订正操作仅记录状态，不增加星星。
                  </p>
                </div>
              </div>

              {/* 往期未完成作业监控 (过去一周工作日) */}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-500 flex items-center">
                    <AlertTriangle className="mr-2 text-slate-400" size={16} /> 往期作业未完成监控 (逾期扣分)
                  </h4>
                  <div className="flex gap-2">
                    {hiddenOverdueDates.length > 0 && (
                      <button 
                        onClick={() => setHiddenOverdueDates([])}
                        className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-1 rounded-full hover:bg-indigo-100 transition-colors"
                      >
                        恢复已隐藏的日期 ({hiddenOverdueDates.length})
                      </button>
                    )}
                    <button 
                      className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors flex items-center ${isEditingOverdue ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-400'}`}
                      onClick={() => setIsEditingOverdue(!isEditingOverdue)}
                    >
                      <Edit2 size={10} className="mr-1"/> {isEditingOverdue ? '完成编辑' : '编辑列表'}
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {(() => {
                    // 获取过去5个工作日
                    const dates = [];
                    let current = new Date(selectedDate);
                    current.setHours(0, 0, 0, 0); // Normalize to start of day
                    
                    // 从昨天开始往前推，跳过昨天(因为昨天有专门的板块)
                    current.setDate(current.getDate() - 1); 
                    
                    current.setDate(current.getDate() - 1); // Start from T-2
                    
                    const cutoffDate = new Date('2026-03-05T00:00:00');

                    while (dates.length < 5) {
                      if (current < cutoffDate) break; // Stop if before cutoff date

                      const day = current.getDay();
                      if (day !== 0 && day !== 6) { // Skip Sunday (0) and Saturday (6)
                        dates.push(new Date(current));
                      }
                      current.setDate(current.getDate() - 1);
                      // 防止死循环，限制查找范围
                      if (dates.length < 5 && (new Date(selectedDate).getTime() - current.getTime()) > 15 * 24 * 60 * 60 * 1000) break;
                    }

                    return dates.map((d) => {
                      const dateKey = d.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
                      const todayKey = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
                      const daysAgo = Math.floor((new Date(selectedDate).getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                      
                      if (hiddenOverdueDates.includes(dateKey)) return null;

                      const incompleteStudents = students.filter(s => !logs.some(l => l.studentId === s.id && l.dateKey === dateKey && (l.reason === '完美作业' || l.reason === '今日事今日毕' || l.reason === '补订正')));
                      
                      if (incompleteStudents.length === 0) return null;

                      return (
                        <div key={dateKey} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 relative group/card">
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-500 flex items-center">
                                  {dateKey} (逾期{daysAgo}天)
                                </span>
                                <div className="mt-2 flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                  <Edit3 size={12} className="text-indigo-400 shrink-0" />
                                  <input 
                                    type="text"
                                    value={incompleteRemarks[dateKey] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setIncompleteRemarks(prev => ({
                                        ...prev,
                                        [dateKey]: val
                                      }));
                                    }}
                                    placeholder="备注该日逾期作业内容 (如：练习册P45)..."
                                    className="bg-transparent text-xs text-slate-600 outline-none w-full sm:w-64"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 self-end sm:self-center">
                                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-full">{incompleteStudents.length} 人未完成</span>
                                {isEditingOverdue && (
                                  <button 
                                    onClick={() => setHiddenOverdueDates(prev => [...prev, dateKey])}
                                    className="text-slate-300 hover:text-rose-400 transition-colors p-1 bg-white rounded-full shadow-sm border border-slate-100"
                                    title="隐藏此日期"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {incompleteStudents.map(student => {
                                 const reason = `未完成作业 ${dateKey}`;
                                 const penaltyLog = logs.find(l => l.studentId === student.id && l.dateKey === todayKey && l.reason === reason);
                                 
                                 return (
                                    <div key={student.id} className="bg-white border border-rose-100 pl-3 pr-1 py-1 rounded-full flex items-center shadow-sm">
                                       <span className="text-xs font-bold text-slate-600 mr-2">{student.name}</span>
                                       
                                       {/* 补订正按钮 (0分) - 允许清除状态 */}
                                       {!penaltyLog && (
                                           <button 
                                             onClick={() => commitAddStar(student.id, 0, '补订正', dateKey)}
                                             className="bg-slate-100 hover:bg-slate-500 hover:text-white text-slate-400 w-6 h-6 rounded-full flex items-center justify-center transition-all mr-1"
                                             title="补订正 (清除状态，不加分)"
                                           >
                                             <CheckCircle2 size={10} />
                                           </button>
                                       )}

                                       {penaltyLog ? (
                                           <button 
                                             onClick={() => handleRemoveLog(penaltyLog.id, student.id, -1)}
                                             className="bg-slate-100 hover:bg-slate-200 text-slate-400 px-2 py-1 rounded-full flex items-center justify-center transition-all text-[10px] font-bold"
                                             title="撤回扣分"
                                           >
                                             <Undo2 size={10} className="mr-1"/> 撤回
                                           </button>
                                       ) : (
                                           <button 
                                             onClick={() => commitAddStar(student.id, -1, reason)}
                                             className="bg-rose-100 hover:bg-rose-500 hover:text-white text-rose-500 px-2 py-1 rounded-full flex items-center justify-center transition-all text-[10px] font-bold"
                                           >
                                             扣1分
                                           </button>
                                       )}
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= REDEMPTION (兑奖处) ================= */}
        {viewMode === 'redemption' && (
          <div className="animate-in fade-in duration-500 pb-20">
            <div className="bg-white rounded-3xl shadow-xl border border-amber-100 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center space-x-3">
                  <Ticket size={32} className="animate-bounce" />
                  <h2 className="text-2xl font-black tracking-tight">几何商店 (兑奖)</h2>
                </div>
                <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-md p-2 rounded-xl">
                  <Search size={16} className="ml-2"/>
                  <select value={redemptionFilterId} onChange={(e) => setRedemptionFilterId(e.target.value)} className="bg-transparent text-white font-bold py-1.5 pr-8 focus:outline-none border-none cursor-pointer">
                    <option value="" className="text-slate-800">显示全部同学</option>
                    {students.map(s => <option key={s.id} value={s.id} className="text-slate-800">#{s.id} {s.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 min-h-[400px]">
                <h3 className="font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center"><Gift size={16} className="mr-2"/> 待核销奖品 ({filteredPendingPrizes.length})</h3>
                {filteredPendingPrizes.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                    <Package size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="font-bold">暂无待兑换的奖品</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    {filteredPendingPrizes.map((prize) => (
                      <div key={prize.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded">#{prize.studentId}</span>
                            <span className="font-bold text-slate-800">{prize.studentName}</span>
                            <span className={`text-[10px] text-white px-2 py-0.5 rounded-full ${prize.color}`}>{prize.tierName}</span>
                          </div>
                          <div className="text-lg font-black text-slate-700 mt-2">{prize.prizeName}</div>
                          <div className="text-[10px] text-slate-400 mt-1">{prize.timestamp}</div>
                        </div>
                        <button onClick={() => handleRedeemPrize(prize.id)} className="px-4 py-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white font-bold rounded-xl shadow-sm transition-all flex items-center active:scale-95">
                          <CheckCircle2 size={18} className="mr-1" /> 核销
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h3 className="font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center"><History size={16} className="mr-2"/> 最近兑换记录 (仅展示前50条)</h3>
                  <div className="space-y-2">
                    {redeemedHistory.slice(0,50).map(prize => (
                      <div key={prize.id} className="flex justify-between items-center bg-slate-100/50 p-3 rounded-xl text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-600">{prize.studentName}</span>
                          <span className="text-slate-400">兑换了</span>
                          <span className={`font-bold ${prize.color.replace('bg-', 'text-')}`}>{prize.prizeName}</span>
                        </div>
                        <span className="text-xs text-slate-400">{prize.redeemedAt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ADMIN (金老师控制台) ================= */}
        {viewMode === 'admin' && (
          <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="bg-slate-800 rounded-3xl p-6 shadow-xl text-white flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-black flex items-center text-yellow-400"><Shield className="mr-2"/> 金老师核心控制台</h2>
                <p className="text-sm text-slate-400 mt-1">规则修改、数据备份、库存管理与人员编排</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleExportData} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-sm flex items-center transition-colors"><Download size={16} className="mr-2"/> 导出备份</button>
                <button onClick={handleImportClick} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-sm flex items-center transition-colors"><Upload size={16} className="mr-2"/> 恢复数据</button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 战队人员编排 */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 md:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-slate-800 flex items-center"><Users className="mr-2 text-indigo-500"/> 同学管理与编排</h3>
                  <button 
                    onClick={handleAddStudent}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center shadow-md"
                  >
                    <UserPlus size={16} className="mr-2"/> 添加同学
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {students.map(student => (
                    <div key={student.id} className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 group relative hover:border-indigo-300 transition-colors">
                      <button 
                        onClick={() => handleDeleteStudent(student.id)}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                        title="删除同学"
                      >
                        <X size={12} />
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-200 rounded px-1.5 py-0.5">
                          <span className="text-[10px] text-slate-400 mr-1">ID</span>
                          <input 
                            type="number"
                            value={student.id}
                            onChange={(e) => handleUpdateStudentId(student.id, e.target.value)}
                            className="text-[10px] font-mono text-slate-600 bg-transparent border-none outline-none focus:ring-0 w-8 text-center"
                          />
                        </div>
                        <input 
                          type="text"
                          value={student.name}
                          onChange={(e) => handleUpdateStudentName(student.id, e.target.value)}
                          className="font-bold text-slate-700 text-sm bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1 w-full"
                        />
                      </div>
                      <select
                        value={student.groupId || 1}
                        onChange={(e) => handleChangeStudentGroup(student.id, e.target.value)}
                        className="text-xs bg-white border border-slate-300 rounded-lg p-1 font-bold text-indigo-600 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm w-full"
                      >
                        {Array.from({length: 12}, (_, i) => i + 1).map(gId => (
                          <option key={gId} value={gId}>第 {gId} 组</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* 自动备份管理 */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 md:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-slate-800 flex items-center"><Save className="mr-2 text-indigo-500"/> 自动备份管理 (最近5天)</h3>
                  <div className="text-xs text-slate-400 font-bold">每日首次登录自动触发</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {[0, 1, 2, 3, 4].map(idx => {
                    const backup = localStorage.getItem(`504_v2_backup_${idx}`);
                    const data = backup ? JSON.parse(backup) : null;
                    return (
                      <div key={idx} className={`p-4 rounded-2xl border-2 transition-all ${data ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                        <div className="text-[10px] font-black text-slate-400 mb-2 uppercase">备份 #{idx + 1}</div>
                        {data ? (
                          <>
                            <div className="font-bold text-circle text-sm mb-1">{data.backupDate}</div>
                            <div className="text-[10px] text-indigo-400 mb-3">{new Date(data.timestamp).toLocaleTimeString()}</div>
                            <button 
                              onClick={() => {
                                if(window.confirm(`确定要恢复 ${data.backupDate} 的备份吗？当前未保存的数据将被覆盖。`)) {
                                  handleRestoreBackup(backup!);
                                }
                              }}
                              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors"
                            >
                              恢复此备份
                            </button>
                          </>
                        ) : (
                          <div className="text-xs text-slate-300 italic py-4 text-center">暂无数据</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 奖池库存快捷监控 */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-slate-800 flex items-center"><Package className="mr-2 text-indigo-500"/> 盲盒库存快捷监控</h3>
                  <button onClick={() => { setViewMode('prizes'); setIsEditingPrizes(true); }} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors flex items-center"><Edit2 size={12} className="mr-1"/> 前往奖池配置</button>
                </div>
                <div className="space-y-4">
                  {prizes.map(p => (
                    <div key={p.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-3 h-3 rounded-full ${p.color}`}></span>
                          <span className="font-bold text-slate-700">{p.level}: {p.name}</span>
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{p.items.join(', ')}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">当前库存</div>
                          {p.stock === null ? (
                            <div className="font-bold text-emerald-500">∞ 无限</div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`font-black text-lg ${p.stock===0?'text-rose-500':'text-amber-500'}`}>{p.stock}</span>
                              <button 
                                onClick={() => setPrizes(prev => prev.map(item => item.id === p.id ? {...item, stock: 3} : item))}
                                className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-1 rounded"
                              >补货</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 最新流水日志 */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col max-h-[500px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-slate-800 flex items-center"><History className="mr-2 text-indigo-500"/> 班级摘星流水帐</h3>
                  <button 
                    onClick={handleResetDailyStars}
                    className="text-[10px] bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-full font-bold transition-all flex items-center border border-rose-100"
                    title={`清空 ${selectedDateKey} 的所有记录`}
                  >
                    <Trash2 size={12} className="mr-1" /> 格式化当日星星
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {logs.length === 0 && <p className="text-center text-slate-400 py-10">暂无任何操作记录</p>}
                  {logs.map((log, i) => (
                    <div key={log.id || i} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm group hover:bg-slate-100 transition-colors">
                      <div>
                        <span className="font-bold text-slate-700 mr-2">{log.studentName}</span>
                        <span className="text-slate-500 text-xs">{log.reason}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-black ${log.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {log.amount > 0 ? '+' : ''}{log.amount}
                        </span>
                        <span className="text-[10px] text-slate-400 w-10 text-right">{log.timestamp.split(' ')[1]}</span>
                        <button 
                          onClick={() => handleUndoLog(log)}
                          className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title="撤回此记录"
                        >
                          <Undo2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>


          </div>
        )}

      </main>

      {/* ================= MODALS ================= */}

      {/* 0. Rules Modal (规则说明) */}
      {showRules && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 flex justify-between items-center shrink-0">
              <div className="flex items-center text-white">
                <BookOpen size={28} className="mr-3" />
                <div>
                  <h3 className="text-2xl font-black tracking-tight">星空探险手册</h3>
                  <p className="text-indigo-100 text-xs font-medium mt-1">504班数学专属过程性评价规则</p>
                </div>
              </div>
              <button onClick={() => setShowRules(false)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center">
                  <Coins className="text-yellow-500 mr-2" size={20}/> 核心机制：双轨系统
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                    <div className="font-bold text-yellow-800 mb-1 flex items-center"><Star size={16} className="mr-1 fill-yellow-500"/> 经验值 (总星数)</div>
                    <div className="text-xs text-yellow-700 leading-relaxed">
                      代表你的历史总成就。只增不减（除严重违规），用于决定<span className="font-bold">期末最终荣誉排名</span>。
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                    <div className="font-bold text-blue-800 mb-1 flex items-center"><Package size={16} className="mr-1"/> 流通币 (可用星)</div>
                    <div className="text-xs text-blue-700 leading-relaxed">
                      代表你口袋里的余额。用于开启盲盒，<span className="font-bold">每次抽奖消耗15星</span>。花掉它不会影响你的总排名！
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-lg font-black text-emerald-600 mb-4 flex items-center">
                  <TrendingUp className="mr-2" size={20}/> 🌟 如何获取星星？
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-600 font-bold">完美作业 / 周周练全对</span>
                    <span className="text-emerald-500 font-black bg-emerald-50 px-2 py-0.5 rounded">+1 ~ +2 星</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-600 font-bold">今日事今日毕 (放学前改完错题)</span>
                    <span className="text-emerald-500 font-black bg-emerald-50 px-2 py-0.5 rounded">+0.5 星</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-600 font-bold">课堂锋芒毕露 (讲解清晰)</span>
                    <span className="text-emerald-500 font-black bg-emerald-50 px-2 py-0.5 rounded">+1 星</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-600 font-bold">进阶挑战 (思维拓展/单元闯关)</span>
                    <span className="text-emerald-500 font-black bg-emerald-50 px-2 py-0.5 rounded">+5 ~ +10 星</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-lg font-black text-rose-600 mb-4 flex items-center">
                  <MinusCircle className="mr-2" size={20}/> ⚠️ 违纪惩罚规则
                </h4>
                <div className="space-y-3 text-sm">
                  <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2 rounded-lg mb-3">
                    惩罚会同时扣除【经验值】和【流通币】，甚至会让你的可用星变成负债！
                  </p>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-600 font-bold">拖欠作业 (无故不交)</span>
                    <span className="text-rose-500 font-black bg-rose-50 px-2 py-0.5 rounded">-2 星</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-600 font-bold">经常性忘带学具</span>
                    <span className="text-rose-500 font-black bg-rose-50 px-2 py-0.5 rounded">-0.5 星</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-600 font-bold">扰乱课堂纪律</span>
                    <span className="text-rose-500 font-black bg-rose-50 px-2 py-0.5 rounded">-1 星</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-slate-600 font-bold text-rose-600">红线：抄袭作假</span>
                    <span className="text-rose-500 font-black bg-rose-50 px-2 py-0.5 rounded">-5 星</span>
                  </div>
                </div>
              </div>

              <div className="bg-rose-50 p-5 rounded-2xl shadow-sm border border-rose-100 mt-8">
                <h4 className="text-lg font-black text-rose-700 mb-2 flex items-center">
                  <AlertTriangle className="mr-2" size={20}/> 系统管理
                </h4>
                <p className="text-xs text-rose-600 mb-4">如果遇到数据异常或需要重新开始新学期，可以使用此功能清空所有数据。</p>
                <button 
                  onClick={handleResetAllData}
                  className="w-full py-3 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-100 hover:border-rose-300 transition-all shadow-sm flex items-center justify-center"
                >
                  <Trash2 size={18} className="mr-2"/> 清空所有缓存数据 (重置系统)
                </button>
              </div>
            </div>
            
            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
              <button onClick={() => setShowRules(false)} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black text-lg rounded-2xl shadow-lg transition-colors">
                我已了解，去探索星空！
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Student Action Panel Modal (加扣星面板) */}
      {selectedStudentForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-slate-50 p-6 flex justify-between items-center border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-xl border-2 border-white shadow-sm">
                  {selectedStudentForAction.id}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{selectedStudentForAction.name}</h3>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">经验值: {selectedStudentForAction.totalStars}</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">可用币: {selectedStudentForAction.availableStars}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedStudentForAction(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm"><X size={20}/></button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {!pendingAction ? (
                <>
                  {/* 新增：最近一笔撤回区 */}
                  {studentSelectedDateLogs.length > 0 && (
                    <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <RotateCcw size={18} />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">刚刚录入</div>
                            <div className="text-sm font-bold text-slate-700">
                              {studentSelectedDateLogs[0].reason} 
                              <span className={`ml-2 ${studentSelectedDateLogs[0].amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ({studentSelectedDateLogs[0].amount > 0 ? '+' : ''}{studentSelectedDateLogs[0].amount}星)
                              </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveLog(studentSelectedDateLogs[0].id, studentSelectedDateLogs[0].studentId, studentSelectedDateLogs[0].amount)}
                          className="px-4 py-2 bg-white border border-amber-200 text-amber-700 font-bold rounded-xl text-xs hover:bg-amber-100 transition-all shadow-sm flex items-center active:scale-95"
                        >
                          <Undo2 size={14} className="mr-1"/> 撤回
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center">
                    <TrendingUp size={14} className="mr-1"/> 快捷加分项
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {ACTION_REASONS.filter(a => a.target === 'personal' && a.score > 0).map((action, idx) => (
                      <button
                        key={`add-${idx}`}
                        onClick={() => setPendingAction(action)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 relative overflow-hidden
                          ${action.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                            action.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100' :
                            action.type === 'special' ? 'bg-indigo-50 border-indigo-100 text-circle hover:bg-indigo-100' :
                            'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100'
                          }`}
                      >
                        {action.type === 'special' && (
                          <div className="absolute -top-1 -right-1 bg-indigo-500 text-white p-1 rounded-bl-lg">
                            <Dices size={10} />
                          </div>
                        )}
                        <span className="text-xs font-bold text-center leading-tight">{action.label}</span>
                        <span className="text-lg font-black">+{action.score}</span>
                      </button>
                    ))}
                  </div>

                  <div className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-3 flex items-center pt-4 border-t border-slate-100">
                    <MinusCircle size={14} className="mr-1"/> 违纪扣分项
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ACTION_REASONS.filter(a => a.target === 'personal' && a.score < 0).map((action, idx) => (
                      <button
                        key={`minus-${idx}`}
                        onClick={() => setPendingAction(action)}
                        className="p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100"
                      >
                        <span className="text-xs font-bold text-center leading-tight">{action.label}</span>
                        <span className="text-lg font-black">{action.score}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                      <span className="flex items-center"><History size={14} className="mr-1"/> {selectedDateKey} 记录明细</span>
                      <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full text-[10px]">共 {studentSelectedDateLogs.length} 条</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {studentSelectedDateLogs.length === 0 ? (
                        <div className="text-center text-slate-400 py-6 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          该日期暂无任何加减分记录
                        </div>
                      ) : (
                        studentSelectedDateLogs.map(log => (
                          <div key={log.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-sm group hover:border-indigo-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-1.5 h-8 rounded-full ${log.amount > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                              <div>
                                <div className="font-bold text-slate-700">{log.reason}</div>
                                <div className="text-[10px] text-slate-400">{log.timestamp.split(' ')[1]}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`font-black text-lg ${log.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {log.amount > 0 ? '+' : ''}{log.amount}
                              </span>
                              <button 
                                onClick={() => handleRemoveLog(log.id, log.studentId, log.amount)}
                                className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                title="撤销此条操作"
                              >
                                <Undo2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center animate-in zoom-in duration-200">
                  <div className="text-sm text-slate-500 mb-2">即将录入:</div>
                  <div className="text-xl font-black text-slate-800">{pendingAction.label}</div>
                  <div className={`text-4xl font-black my-4 ${pendingAction.score > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {pendingAction.score > 0 ? '+' : ''}{pendingAction.score} 星
                  </div>
                  <p className="text-xs text-slate-400 mb-6">提示：惩罚将同时扣除经验值与可用流通币</p>
                  
                  <div className="flex gap-3">
                    <button onClick={() => setPendingAction(null)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100">取消</button>
                    <button onClick={() => commitAddStar(selectedStudentForAction.id, pendingAction.score, pendingAction.label)} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700">确定录入</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1.5 Team Action Panel Modal (战队全员加扣星面板) */}
      {selectedTeamForAction && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border-4 border-indigo-100">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 flex justify-between items-center shrink-0">
              <div className="flex items-center text-white">
                <Users size={28} className="mr-3" />
                <div>
                  <h3 className="text-xl font-black tracking-tight">{selectedTeamForAction.name} 批处理</h3>
                  <p className="text-indigo-100 text-xs font-medium mt-1">成员: {selectedTeamForAction?.members?.map(m=>m.name).join(', ')}</p>
                </div>
              </div>
              <button onClick={() => {setSelectedTeamForAction(null); setPendingAction(null);}} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {!pendingAction ? (
                <>
                  <div className="text-xs font-bold text-indigo-600 bg-indigo-50 p-2 rounded-lg mb-4 flex items-center">
                    <AlertCircle size={14} className="mr-2 shrink-0"/> 以下操作将同时作用于该组的 4 名成员
                  </div>
                  
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center">
                    <TrendingUp size={14} className="mr-1"/> 全员快捷加分
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {ACTION_REASONS.filter(a => a.target === 'team' && a.score > 0).map((action, idx) => (
                      <button
                        key={`team-add-${idx}`}
                        onClick={() => setPendingAction(action)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${action.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100' : action.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'}`}
                      >
                        <span className="text-[10px] font-bold text-center leading-tight">{action.label}</span>
                        <span className="text-lg font-black">+{action.score}</span>
                      </button>
                    ))}
                  </div>

                  <div className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-3 flex items-center pt-4 border-t border-slate-100">
                    <MinusCircle size={14} className="mr-1"/> 全员连带扣分
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ACTION_REASONS.filter(a => a.target === 'team' && a.score < 0).map((action, idx) => (
                      <button
                        key={`team-minus-${idx}`}
                        onClick={() => setPendingAction(action)}
                        className="p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100"
                      >
                        <span className="text-[10px] font-bold text-center leading-tight">{action.label}</span>
                        <span className="text-lg font-black">{action.score}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center animate-in zoom-in duration-200">
                  <div className="text-sm text-slate-500 mb-2">即将为全组录入:</div>
                  <div className="text-xl font-black text-slate-800">{pendingAction.label}</div>
                  <div className={`text-4xl font-black my-4 ${pendingAction.score > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {pendingAction.score > 0 ? '+' : ''}{pendingAction.score} 星
                  </div>
                  <p className="text-xs font-bold text-indigo-500 bg-indigo-50 p-2 rounded-lg mb-6">
                    ⚠️ {selectedTeamForAction?.members?.map(m=>m.name).join('、')} 每人都将获得 {pendingAction.score > 0 ? '+' : ''}{pendingAction.score} 星
                  </p>
                  
                  <div className="flex gap-3">
                    <button onClick={() => setPendingAction(null)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100">取消</button>
                    <button onClick={() => commitTeamAddStar(selectedTeamForAction.id, pendingAction.score, pendingAction.label)} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700">确认全组录入</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MATH LIFE (数学生活家) ================= */}
      {viewMode === 'math_life' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in-95 duration-500 space-y-8">
          {/* Hero Header */}
          <div className="relative rounded-[2.5rem] p-6 sm:p-10 overflow-hidden shadow-2xl group border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 animate-gradient-pan"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            {/* Floating Elements */}
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl animate-float-delayed"></div>
            <div className="absolute top-10 right-20 text-white/10 animate-float">
              <Dices size={64} />
            </div>
            <div className="absolute bottom-10 left-20 text-white/10 animate-float-delayed">
              <Calculator size={48} />
            </div>
            
            <div className="relative z-10 text-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg animate-float">
                    <BrainCircuit size={32} className="text-cyan-100" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight animate-slide-up">数学生活家</h2>
                    <p className="text-cyan-100 font-medium opacity-90 animate-slide-up" style={{animationDelay: '0.1s'}}>Math in Daily Life</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddTaskModal(true)}
                  className="bg-white text-blue-600 px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2 active:scale-95 hover:shadow-blue-500/30"
                >
                  <Plus size={18} /> 发布任务
                </button>
              </div>
              
              <p className="text-lg text-cyan-50 max-w-2xl leading-relaxed bg-black/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 animate-slide-up" style={{animationDelay: '0.2s'}}>
                数学不仅仅是课本上的公式，更是生活中的智慧。在这里，我们将一起探索生活中的数学奥秘，完成每周挑战与每月探索，成为真正的“生活数学家”！✨
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Weekly Challenges */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 animate-slide-up" style={{animationDelay: '0.3s'}}>
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shadow-sm">
                  <Zap size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-800">本周挑战 (Weekly)</h3>
              </div>
              
              {mathLifeTasks.filter(t => t.type === 'weekly').length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 animate-in zoom-in duration-300">
                  <div className="mb-2 text-4xl animate-bounce">📭</div>
                  暂无周任务，敬请期待！
                </div>
              ) : (
                <div className="space-y-4">
                  {mathLifeTasks.filter(t => t.type === 'weekly').map((task, idx) => (
                    <div 
                      key={task.id} 
                      onClick={() => setSelectedTask(task)}
                      className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden animate-slide-up cursor-pointer ${task.status === 'completed' ? 'opacity-70 grayscale-[0.5]' : ''}`}
                      style={{animationDelay: `${0.1 * idx}s`}}
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${task.status === 'completed' ? 'from-slate-300 to-slate-400' : 'from-amber-300 to-amber-500'} group-hover:w-2 transition-all duration-300`}></div>
                      <div className="flex justify-between items-center mb-3 pl-2">
                        <h4 className={`text-lg font-bold ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-800'} group-hover:text-amber-600 transition-colors`}>{task.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`${task.status === 'completed' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-600'} text-xs font-bold px-2 py-1 rounded-lg flex items-center shadow-sm border ${task.status === 'completed' ? 'border-slate-200' : 'border-amber-100'}`}>
                            <Star size={12} className={`mr-1 ${task.status === 'completed' ? 'fill-slate-400' : 'fill-amber-500 animate-pulse'}`} /> +{task.reward}
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-slate-300 hover:text-rose-500 transition-colors p-1 hover:bg-rose-50 rounded-full">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-slate-400 flex justify-between items-center ml-2">
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                          <Calendar size={12} /> {task.startDate} ~ {task.endDate}
                        </span>
                        <span className={`${task.status === 'completed' ? 'text-slate-400 bg-slate-100' : 'text-amber-500 bg-amber-50'} font-bold flex items-center gap-1 px-2 py-0.5 rounded-full`}>
                          {task.status === 'completed' ? (
                            <><CheckCircle size={12} /> 已结束</>
                          ) : (
                            <><Rocket size={12} className="animate-pulse" /> 进行中</>
                          )}
                        </span>
                      </div>

                      {/* Weekly Task Honor Roll */}
                      {task.awardedStudents && task.awardedStudents.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1 mb-1.5">
                            <Crown size={14} className="text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold text-slate-500">光荣榜</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {[...task.awardedStudents]
                              .sort((a, b) => b.stars !== a.stars ? b.stars - a.stars : a.studentId - b.studentId)
                              .map((student, i) => (
                              <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-100 flex items-center font-bold">
                                {student.name} <span className="text-amber-500 ml-1">+{student.stars}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Explorations */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 animate-slide-up" style={{animationDelay: '0.3s'}}>
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shadow-sm">
                  <Trophy size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-800">本月探索 (Monthly)</h3>
              </div>

              {mathLifeTasks.filter(t => t.type === 'monthly').length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 animate-in zoom-in duration-300">
                  <div className="mb-2 text-4xl animate-bounce">🔭</div>
                  暂无月度探索任务，敬请期待！
                </div>
              ) : (
                <div className="space-y-4">
                  {mathLifeTasks.filter(t => t.type === 'monthly').map((task, idx) => (
                    <div 
                      key={task.id} 
                      onClick={() => setSelectedTask(task)}
                      className={`bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-5 shadow-sm border border-indigo-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden animate-slide-up cursor-pointer ${task.status === 'completed' ? 'opacity-70 grayscale-[0.5]' : ''}`}
                      style={{animationDelay: `${0.1 * idx}s`}}
                    >
                      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-10 -mt-10 transition-colors duration-500 ${task.status === 'completed' ? 'bg-slate-300/10' : 'bg-indigo-500/10 group-hover:bg-indigo-500/20'}`}></div>
                      <div className="flex justify-between items-center mb-3 relative z-10">
                        <h4 className={`text-lg font-bold ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-indigo-900'} group-hover:text-circle transition-colors`}>{task.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`${task.status === 'completed' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-600'} text-xs font-bold px-2 py-1 rounded-lg flex items-center shadow-sm border ${task.status === 'completed' ? 'border-slate-200' : 'border-indigo-200'}`}>
                            <Star size={12} className={`mr-1 ${task.status === 'completed' ? 'fill-slate-400' : 'fill-indigo-500 animate-pulse'}`} /> +{task.reward}
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-slate-300 hover:text-rose-500 transition-colors p-1 hover:bg-rose-50 rounded-full">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-indigo-400 flex justify-between items-center relative z-10">
                        <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-md">
                          <Calendar size={12} /> {task.startDate} ~ {task.endDate}
                        </span>
                        <span className={`${task.status === 'completed' ? 'text-slate-400 bg-slate-100' : 'text-indigo-500 bg-indigo-50'} font-bold flex items-center gap-1 px-2 py-0.5 rounded-full`}>
                          {task.status === 'completed' ? (
                            <><CheckCircle size={12} /> 已结束</>
                          ) : (
                            <><Trophy size={12} className="animate-pulse" /> 进行中</>
                          )}
                        </span>
                      </div>

                      {/* Monthly Task Honor Roll */}
                      {task.awardedStudents && task.awardedStudents.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-indigo-100/50 relative z-10">
                          <div className="flex items-center gap-1 mb-1.5">
                            <Crown size={14} className="text-indigo-400 fill-indigo-400" />
                            <span className="text-xs font-bold text-indigo-400">光荣榜</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {[...task.awardedStudents]
                              .sort((a, b) => b.stars !== a.stars ? b.stars - a.stars : a.studentId - b.studentId)
                              .map((student, i) => (
                              <span key={i} className="text-xs bg-white/60 text-circle px-2 py-1 rounded-md border border-indigo-100 flex items-center font-bold backdrop-blur-sm">
                                {student.name} <span className="text-indigo-500 ml-1">+{student.stars}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add Task Modal */}
          {showAddTaskModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-black text-lg text-slate-800">{newTask.id ? '编辑任务' : '发布新任务'}</h3>
                  <button onClick={() => {
                    setShowAddTaskModal(false);
                    setNewTask({ 
                      title: '', 
                      description: '', 
                      type: 'weekly', 
                      reward: '5', 
                      startDate: new Date().toISOString().split('T')[0],
                      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      status: 'active' 
                    });
                  }} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">任务标题</label>
                    <input 
                      type="text" 
                      value={newTask.title}
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-slate-800"
                      placeholder="例如：寻找身边的圆柱体"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">开始日期</label>
                      <input 
                        type="date" 
                        value={newTask.startDate}
                        onChange={e => setNewTask({...newTask, startDate: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">结束日期</label>
                      <input 
                        type="date" 
                        value={newTask.endDate}
                        onChange={e => setNewTask({...newTask, endDate: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">任务类型</label>
                      <select 
                        value={newTask.type}
                        onChange={e => setNewTask({...newTask, type: e.target.value as any})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
                      >
                        <option value="weekly">周任务 (Weekly)</option>
                        <option value="monthly">月任务 (Monthly)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">奖励星数</label>
                      <input 
                        type="text" 
                        value={newTask.reward}
                        onChange={e => setNewTask({...newTask, reward: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-amber-500"
                        placeholder="例如：5 或 3-5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">任务详情</label>
                    <textarea 
                      value={newTask.description}
                      onChange={e => setNewTask({...newTask, description: e.target.value})}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all h-32 resize-none text-sm"
                      placeholder="请详细描述任务内容、要求及提交方式..."
                    />
                  </div>

                  <button 
                    onClick={handleAddTask}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 mt-2"
                  >
                    {newTask.id ? '保存修改' : '立即发布'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Task Details Modal */}
          {selectedTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-300 relative scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {/* Sticky Header Actions */}
                <div className="sticky top-0 z-30 h-0 flex justify-end p-4 pointer-events-none">
                  <div className="flex gap-2 pointer-events-auto">
                    <button 
                      onClick={() => {
                        setNewTask({ ...selectedTask });
                        setShowAddTaskModal(true);
                        setSelectedTask(null);
                      }}
                      className="bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-md shadow-lg"
                      title="编辑任务"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(selectedTask.id)}
                      className="bg-black/20 hover:bg-rose-500/60 text-white p-2 rounded-full transition-colors backdrop-blur-md shadow-lg"
                      title="删除任务"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button 
                      onClick={() => setSelectedTask(null)}
                      className="bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-md shadow-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Header Background */}
                <div className={`h-32 ${selectedTask.type === 'weekly' ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'} relative overflow-hidden shrink-0`}>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
                </div>

                {/* Content */}
                <div className="px-8 pb-8 -mt-12 relative z-10">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 mb-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-2 ${selectedTask.type === 'weekly' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-circle'}`}>
                          {selectedTask.type === 'weekly' ? <Zap size={12} className="mr-1"/> : <Trophy size={12} className="mr-1"/>}
                          {selectedTask.type === 'weekly' ? '本周挑战' : '本月探索'}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 leading-tight">{selectedTask.title}</h2>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-3xl font-black text-amber-500 flex items-center">
                          <Star size={24} className="fill-amber-500 mr-1" /> +{selectedTask.reward}
                        </div>
                        <span className="text-xs text-slate-400 font-bold mt-1">完成奖励</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={16} className="text-slate-400"/>
                        <span className="font-bold">活动时间:</span>
                        <span>{selectedTask.startDate} ~ {selectedTask.endDate}</span>
                      </div>
                      <div className="w-px h-4 bg-slate-300"></div>
                      <div className="flex items-center gap-1.5">
                        {selectedTask.status === 'completed' ? (
                          <>
                            <CheckCircle size={16} className="text-slate-400"/>
                            <span className="font-bold">状态:</span>
                            <span className="text-slate-500 font-bold">已结束</span>
                          </>
                        ) : (
                          <>
                            <Rocket size={16} className="text-slate-400"/>
                            <span className="font-bold">状态:</span>
                            <span className="text-emerald-500 font-bold">进行中</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="prose prose-slate max-w-none mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
                      <BookOpen size={20} className="mr-2 text-indigo-500"/> 任务详情
                    </h3>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap text-base">
                      {selectedTask.description}
                    </div>
                  </div>

                  {/* Award Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
                      <Award size={20} className="mr-2 text-amber-500"/> 优秀表现奖励
                    </h3>
                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                      <div className="flex gap-4 items-end mb-4">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-amber-600 uppercase mb-1">学生学号</label>
                          <input 
                            type="number" 
                            value={awardStudentId}
                            onChange={e => setAwardStudentId(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-white"
                            placeholder="输入学号..."
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs font-bold text-amber-600 uppercase mb-1">奖励星数</label>
                          <input 
                            type="number" 
                            value={awardStars}
                            onChange={e => setAwardStars(parseInt(e.target.value))}
                            className="w-full px-4 py-2 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-white font-bold text-amber-600"
                          />
                        </div>
                        <button 
                          onClick={handleAwardStudent}
                          className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-95 h-[42px]"
                        >
                          确认奖励
                        </button>
                      </div>
                      
                      {/* Awarded Students List */}
                      {selectedTask.awardedStudents && selectedTask.awardedStudents.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-amber-200/50">
                          <h4 className="text-sm font-bold text-amber-700 mb-3 flex items-center">
                            <Crown size={14} className="mr-1"/> 光荣榜
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {[...selectedTask.awardedStudents]
                              .sort((a, b) => b.stars !== a.stars ? b.stars - a.stars : a.studentId - b.studentId)
                              .map((student, idx) => (
                              <div key={idx} className="bg-white px-3 py-1.5 rounded-lg border border-amber-100 shadow-sm flex items-center gap-2 animate-in zoom-in duration-300">
                                <span className="font-bold text-slate-700 text-sm">{student.name}</span>
                                <span className="bg-amber-100 text-amber-600 text-xs font-bold px-1.5 py-0.5 rounded flex items-center">
                                  <Star size={10} className="fill-amber-500 mr-0.5"/> +{student.stars}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-center gap-4">
                    <button 
                      onClick={() => handleToggleTaskStatus(selectedTask.id)}
                      className={`px-8 py-3 font-bold rounded-xl transition-colors flex items-center gap-2 ${selectedTask.status === 'completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
                    >
                      {selectedTask.status === 'completed' ? (
                        <><Rocket size={18} /> 重新开启任务</>
                      ) : (
                        <><CheckCircle size={18} /> 结束任务</>
                      )}
                    </button>
                    <button 
                      onClick={() => setSelectedTask(null)}
                      className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                    >
                      关闭预览
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MATH GAMES (趣味数学游戏) ================= */}
      {viewMode === 'math_games' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in-95 duration-500 space-y-10">
          {/* Hero Header */}
          <div className="relative rounded-[2.5rem] p-6 sm:p-10 overflow-hidden shadow-2xl group border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-orange-600 to-amber-700 animate-gradient-pan"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            <div className="relative z-10 text-white">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setViewMode('ai_hub')}
                  className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl border border-white/30 transition-colors mr-2"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg animate-float">
                  <Gamepad2 size={32} className="text-rose-100" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight animate-slide-up">趣味数学游戏</h2>
                  <p className="text-rose-100 font-medium opacity-90 animate-slide-up" style={{animationDelay: '0.1s'}}>Fun Math Games & Challenges</p>
                </div>
              </div>
              
              <p className="text-lg text-rose-50 max-w-2xl leading-relaxed bg-black/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 mt-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
                欢迎来到数学游戏室！在这里，你可以通过各种有趣的游戏来锻炼你的数学思维。选择一个你喜欢的游戏开始挑战吧！✨
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {mathGames.map((game) => {
              const IconComponent = (LucideIcons as any)[game.icon] || Gamepad2;
              return (
                <motion.div 
                  key={game.id}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden group flex flex-col"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.color} opacity-5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:opacity-10 transition-opacity`}></div>
                  
                  <div className="relative z-10 flex-1">
                    <div className={`w-16 h-16 bg-gradient-to-br ${game.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      <IconComponent size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-3">{game.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8">
                      {game.description}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (game.id === 'game-2') {
                        setViewMode('game_24');
                      } else if (game.url === '#') {
                        showNotification('该游戏即将上线，敬请期待！', 'info');
                      } else {
                        window.open(game.url, '_blank');
                      }
                    }}
                    className={`w-full bg-gradient-to-r ${game.color} text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center group/btn relative z-10`}
                  >
                    立即开始
                    <Zap size={20} className="ml-2 group-hover:animate-pulse" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}


      {viewMode === 'game_24' && (
        <Game24 
          onExit={() => setViewMode('math_games')} 
          students={students} 
          logs={logs}
          dateKey={todayDateKey}
          showNotification={showNotification}
        />
      )}

      {viewMode === 'visualizations' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in-95 duration-500 space-y-10">
          {/* Hero Header */}
          <div className="relative rounded-[2.5rem] p-6 sm:p-10 overflow-hidden shadow-2xl group border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 animate-gradient-pan"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            <div className="relative z-10 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setViewMode('ai_hub')}
                    className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl border border-white/30 transition-colors mr-2"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg animate-float">
                    <BookOpen size={32} className="text-emerald-100" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight animate-slide-up">题目可视化</h2>
                    <p className="text-emerald-100 font-medium opacity-90 animate-slide-up" style={{animationDelay: '0.1s'}}>Interactive Problem Visualizations</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowAddVizModal(true)}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-black px-6 py-3 rounded-2xl border border-white/30 shadow-lg transition-all flex items-center gap-2 group/btn"
                >
                  <Plus size={20} />
                  导入新题目
                </button>
              </div>
              
              <p className="text-lg text-emerald-50 max-w-2xl leading-relaxed bg-black/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 mt-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
                通过交互式动画和可视化演示，深入理解数学原理。在这里，每一个公式都能动起来！✨
              </p>
            </div>
          </div>

          {visualizations.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-20 text-center border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6">
                <BookOpen size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-400 mb-2">暂无可用的可视化题目</h3>
              <p className="text-slate-400 max-w-sm">点击上方“导入新题目”按钮，粘贴 HTML 代码即可开始探索。</p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-16">
                <DroppableCategory 
                  id="试卷分析" 
                  title="试卷分析" 
                  items={visualizations.filter(v => v.category === '试卷分析')} 
                  onDelete={handleDeleteVisualization}
                  onOpen={handleOpenVisualization}
                />

                <DroppableCategory 
                  id="教材" 
                  title="教材" 
                  items={visualizations.filter(v => v.category === '教材')} 
                  onDelete={handleDeleteVisualization}
                  onOpen={handleOpenVisualization}
                />
                
                <DroppableCategory 
                  id="作业本" 
                  title="作业本" 
                  items={visualizations.filter(v => v.category === '作业本')} 
                  onDelete={handleDeleteVisualization}
                  onOpen={handleOpenVisualization}
                />

                <DroppableCategory 
                  id="周、月任务" 
                  title="周、月任务" 
                  items={visualizations.filter(v => v.category === '周、月任务')} 
                  onDelete={handleDeleteVisualization}
                  onOpen={handleOpenVisualization}
                />
              </div>
            </DndContext>
          )}
        </div>
      )}

      {/* ================= AI HUB (AI 使用仓库) ================= */}
      {viewMode === 'ai_hub' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in-95 duration-500 space-y-10">
          {/* Hero Header */}
          <div className="relative rounded-[2.5rem] p-6 sm:p-10 overflow-hidden shadow-2xl group border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-indigo-700 animate-gradient-pan"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            
            {/* Floating Elements */}
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl animate-float-delayed"></div>
            <div className="absolute top-10 right-20 text-white/10 animate-float">
              <Sparkles size={64} />
            </div>
            <div className="absolute bottom-10 left-20 text-white/10 animate-float-delayed">
              <BrainCircuit size={48} />
            </div>
            
            <div className="relative z-10 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg animate-float">
                  <Sparkles size={32} className="text-purple-100" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight animate-slide-up">AI 使用仓库</h2>
                  <p className="text-purple-100 font-medium opacity-90 animate-slide-up" style={{animationDelay: '0.1s'}}>AI-Powered Teaching Tools</p>
                </div>
              </div>
              
              <p className="text-lg text-purple-50 max-w-2xl leading-relaxed bg-black/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 animate-slide-up" style={{animationDelay: '0.2s'}}>
                欢迎来到 AI 实验室！这里集成了多种人工智能工具，旨在帮助老师更高效地管理班级、激励学生，并创造更有趣的教学内容。✨
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 0. 趣味数学游戏 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-rose-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-50 rounded-full blur-3xl group-hover:bg-rose-100 transition-colors"></div>
              
              <div className="relative z-10 flex-1">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-rose-100 group-hover:scale-110 transition-transform duration-500">
                  <Gamepad2 size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3">趣味数学游戏</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  在游戏中学习数学，挑战你的思维极限！这里有许多有趣的数学小游戏等你来玩。🎮
                </p>
              </div>
              
              <button 
                onClick={() => setViewMode('math_games')}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-200 transition-all flex items-center justify-center relative z-10"
              >
                <Zap size={20} className="mr-2"/>
                进入游戏室
              </button>
            </div>

            {/* 4. AI 同学成长报告 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-amber-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col min-h-[420px]">
              <div className="relative z-10 flex-1 flex flex-col items-center text-center">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-50 rounded-full blur-3xl group-hover:bg-amber-100 transition-colors"></div>
                
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-amber-200"
                >
                  <Sparkles size={40} />
                </motion.div>
                
                <h3 className="text-2xl font-black text-slate-800 mb-4">AI 同学成长报告</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 px-4">
                  想知道你在太空基地的表现如何吗？AI 老师已经为你准备好了专属的成长评价。每周第一次免费，第二次起需 5 颗星星。✨
                </p>
                
                <div className="flex items-center gap-2 mb-8 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span className="text-amber-700 font-bold text-sm">每周首查免费 / 续查 5 星</span>
                </div>

                <button 
                  onClick={() => setShowEvalInput(true)}
                  className="mt-auto w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-amber-200 transition-all flex items-center justify-center group/btn"
                >
                  立即开启评价之旅
                  <ArrowRightLeft size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* 7. 题目可视化 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-emerald-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-colors"></div>
              
              <div className="relative z-10 flex-1">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100 group-hover:scale-110 transition-transform duration-500">
                  <BookOpen size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3">题目可视化</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  通过交互式动画和可视化演示，深入理解数学原理。在这里，每一个公式都能动起来！
                </p>
              </div>
              
              <button 
                onClick={() => setViewMode('visualizations')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center relative z-10"
              >
                <Zap size={20} className="mr-2"/>
                立即探索
              </button>
            </div>

            {/* 1. 每日寄语生成器 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-purple-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-50 rounded-full blur-3xl group-hover:bg-purple-100 transition-colors"></div>
              
              <div className="relative z-10 flex-1">
                <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-purple-100 group-hover:scale-110 transition-transform duration-500">
                  <Smile size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3">每日寄语生成器</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  自动生成充满爱心和鼓励的话语，用于激励学生完成今日的作业订正。
                </p>
                
                {dailyEncouragement && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-2xl border border-purple-100 text-purple-700 text-sm italic animate-in fade-in slide-in-from-top-2">
                    "{dailyEncouragement}"
                  </div>
                )}
              </div>

              <button 
                onClick={async () => {
                  setIsAnalyzing(true);
                  const msg = await generateDailyEncouragement();
                  setDailyEncouragement(msg);
                  setIsAnalyzing(false);
                  showNotification('寄语生成成功！', 'success');
                }}
                disabled={isAnalyzing}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center disabled:opacity-50 relative z-10"
              >
                {isAnalyzing ? <Loader size={20} className="animate-spin mr-2"/> : <Zap size={20} className="mr-2"/>}
                立即生成
              </button>
            </div>

            {/* 2. 班级表现智能分析 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-blue-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition-colors"></div>
              
              <div className="relative z-10 flex-1">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100 group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3">班级表现智能分析</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  分析今日班级加减分情况，识别表现突出的学生或需要关注的问题。
                </p>
              </div>
              
              <button 
                onClick={handleAnalyzeToday}
                disabled={isAnalyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center disabled:opacity-50 relative z-10"
              >
                {isAnalyzing ? <Loader size={20} className="animate-spin mr-2"/> : <BrainCircuit size={20} className="mr-2"/>}
                开始分析
              </button>
            </div>

            {/* 3. 数学题目生成器 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-emerald-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-colors"></div>
              
              <div className="relative z-10 flex-1">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100 group-hover:scale-110 transition-transform duration-500">
                  <Calculator size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3">数学题目生成器</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  根据当前教学进度，自动生成口算练习或思维挑战题。
                </p>
                
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-[10px] font-bold text-emerald-600 flex items-center gap-2 mb-4">
                  <Lock size={12} /> 正在接入 Qwen-Math 大模型...
                </div>
              </div>
              
              <div className="w-full bg-slate-100 text-slate-400 font-bold py-4 rounded-2xl flex items-center justify-center cursor-not-allowed relative z-10">
                即将上线
              </div>
            </div>

            {/* 5. 期末评语助手 (原评语助手) */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full blur-3xl group-hover:bg-slate-100 transition-colors"></div>
              
              <div className="relative z-10 flex-1">
                <div className="w-16 h-16 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                  <ScrollText size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3">期末评语助手</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  输入学生近期表现关键词，AI 自动生成专业且温情的期末评语。
                </p>
              </div>
              
              <div className="w-full bg-slate-100 text-slate-400 font-bold py-4 rounded-2xl flex items-center justify-center cursor-not-allowed relative z-10">
                即将上线
              </div>
            </div>

            {/* 6. 创意头像生成器 */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-rose-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-50 rounded-full blur-3xl group-hover:bg-rose-100 transition-colors"></div>
              
              <div className="relative z-10 flex-1">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-rose-100 group-hover:scale-110 transition-transform duration-500">
                  <Camera size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3">创意头像生成器</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  为表现优异的学生生成专属的“星际探险家”风格头像。
                </p>
              </div>
              
              <div className="w-full bg-slate-100 text-slate-400 font-bold py-4 rounded-2xl flex items-center justify-center cursor-not-allowed relative z-10">
                即将上线
              </div>
            </div>

            {/* 7. 更多工具 */}
            <div className="bg-slate-50 rounded-[2rem] p-8 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group hover:border-indigo-300 transition-all duration-500">
              <div className="w-16 h-16 bg-white text-slate-300 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100 group-hover:text-indigo-400 transition-colors">
                <Plus size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">更多工具正在开发中</h3>
              <p className="text-slate-400 text-xs mt-2">如果您有好的想法，欢迎反馈给金老师！</p>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'homework_list' && (
        <HomeworkSubmissionList 
          students={students} 
          onBack={() => setViewMode('dashboard')} 
          dateKey={selectedDateKey}
          onOpenDatePicker={() => setShowDatePicker(true)}
        />
      )}


      {/* 2. Gachapon Draw Modal (抽奖机器互动) */}
      {gachapon.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-slate-800 rounded-[2.5rem] w-full max-w-sm shadow-2xl relative overflow-hidden border-4 border-slate-600">
            <button onClick={() => setGachapon({isOpen:false, stage:'auth', studentId:'', studentName:'', result:null, resultItem:null})} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 bg-slate-700/50 p-2 rounded-full"><X size={20}/></button>

            {/* Auth Stage */}
            {gachapon.stage === 'auth' && (
              <div className="p-8 text-center animate-in zoom-in">
                <div className="mx-auto w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 border border-indigo-500/50">
                  <Fingerprint size={32} className="text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">身份验证</h3>
                <p className="text-slate-400 text-sm mb-6">请输入学号连接星空数据库<br/>本次探索需消耗 <span className="text-yellow-400 font-bold">{gachapon.cost}</span> 颗星</p>
                <input 
                  type="number" 
                  value={gachapon.studentId}
                  onChange={e => setGachapon({...gachapon, studentId: e.target.value})}
                  placeholder="学号"
                  className="w-full text-center text-4xl font-black bg-slate-900 border border-slate-700 rounded-2xl py-4 text-white focus:outline-none focus:border-indigo-500 mb-6 placeholder-slate-700"
                  autoFocus
                />
                <button onClick={verifyStudentForGacha} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl shadow-lg transition-colors">验证并查验星数</button>
              </div>
            )}

            {/* Denied Stage */}
            {gachapon.stage === 'denied' && (
              <div className="p-8 text-center animate-in shake">
                <div className="text-6xl mb-4">😢</div>
                <h3 className="text-xl font-bold text-white mb-2">{gachapon.studentName} 同学</h3>
                <p className="text-rose-400 font-bold mb-6">可用流通星不足 {gachapon.cost} 颗</p>
                <button onClick={() => setGachapon({...gachapon, isOpen:false, stage:'auth', studentId:'', studentName:'', result:null, resultItem:null})} className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl">继续努力攒星吧！</button>
              </div>
            )}

            {/* Ready Stage */}
            {gachapon.stage === 'ready' && (
              <div className="p-8 text-center animate-in zoom-in">
                <div className="inline-flex items-center text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full mb-6 font-bold text-sm">
                  <CheckCircle2 size={16} className="mr-1"/> 验证通过
                </div>
                <h3 className="text-2xl font-black text-white mb-2">欢迎, {gachapon.studentName}</h3>
                <p className="text-slate-400 mb-8">即将扣除 <span className="text-yellow-400 font-bold">{gachapon.cost} 颗星</span> 开启盲盒</p>
                
                <button onClick={spinGachapon} className="w-full py-5 bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950 font-black text-xl rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center">
                  <Package size={24} className="mr-2"/> 确认投入星星
                </button>
              </div>
            )}

            {/* Spinning Stage */}
            {gachapon.stage === 'spinning' && (
              <div className="p-12 text-center py-20">
                <div className="mx-auto w-32 h-32 relative">
                   <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-indigo-400 rounded-full border-t-transparent animate-spin"></div>
                   <Package size={48} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" />
                </div>
                <div className="mt-8 text-lg font-bold text-indigo-300 animate-pulse">正在连接宇宙信号...</div>
              </div>
            )}

            {/* Result Stage */}
            {gachapon.stage === 'result' && gachapon.result && (
              <div className={`p-8 text-center animate-in zoom-in duration-500 bg-gradient-to-b ${gachapon.result.color.replace('bg-', 'from-').replace('500', '900')} to-slate-900 h-full`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:20px_20px]"></div>
                <div className="relative z-10">
                  <div className="text-sm font-bold text-white/70 uppercase tracking-widest mb-2 mt-4">恭喜抽中</div>
                  <div className={`inline-block px-4 py-1 rounded-full text-white font-black text-sm mb-6 shadow-lg ${gachapon.result.color}`}>
                    {gachapon.result.level} · {gachapon.result.name}
                  </div>
                  
                  <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-3xl p-6 mb-8 transform hover:scale-105 transition-transform shadow-2xl">
                    <Gift size={64} className={`mx-auto mb-4 drop-shadow-lg animate-bounce ${gachapon.result.color.replace('bg-', 'text-')}`} />
                    <div className="text-2xl font-black text-white leading-snug">
                      {gachapon.resultItem}
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs mb-6">已自动存入兑奖处，请找金老师核销</p>
                  
                  <button onClick={() => setGachapon({isOpen:false, stage:'auth', studentId:'', studentName:'', result:null, resultItem:null})} className="w-full py-4 bg-white text-slate-900 font-black text-lg rounded-2xl hover:bg-slate-200 transition-colors">
                    开心收下
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Date Picker Modal (日期选择器) */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Calendar size={24} />
                <h3 className="text-xl font-bold">选择日期</h3>
              </div>
              <button onClick={() => setShowDatePicker(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={() => setViewingMonth(new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() - 1, 1))}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="font-black text-slate-700">
                  {viewingMonth.getFullYear()}年 {viewingMonth.getMonth() + 1}月
                </div>
                <button 
                  onClick={() => setViewingMonth(new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() + 1, 1))}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase">{d}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays(viewingMonth).map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} className="aspect-square"></div>;
                  
                  const dKey = day.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
                  const hasData = datesWithLogs.has(dKey);
                  const isSelected = dKey === selectedDateKey;
                  const isToday = dKey === new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
                  
                  return (
                    <button
                      key={dKey}
                      onClick={() => {
                        setSelectedDate(day);
                        setShowDatePicker(false);
                      }}
                      className={`
                        aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all relative
                        ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 z-10' : 
                          hasData ? 'bg-indigo-50 text-circle hover:bg-indigo-100' : 
                          'text-slate-300 hover:bg-slate-50'}
                        ${isToday && !isSelected ? 'border border-indigo-200' : ''}
                      `}
                    >
                      {day.getDate()}
                      {hasData && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full"></div>}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => { setSelectedDate(new Date()); setShowDatePicker(false); }}
                className="w-full mt-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
              >
                回到今天
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Reward Selector Modal (数学乐园选择器) */}
      {showRewardSelector && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowRewardSelector(false)}>
            <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-700">数学乐园</h3>
                <button onClick={() => setShowRewardSelector(false)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
            </div>
            <div className="p-2 space-y-1">
                <button onClick={() => { setShowRules(true); setShowRewardSelector(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 flex items-center transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mr-3 group-hover:bg-indigo-100 group-hover:text-circle transition-colors">
                        <ScrollText size={16}/>
                    </div>
                    <div>
                        <div className="font-bold text-slate-700 text-sm">规则说明</div>
                        <div className="text-[10px] text-slate-400">查看加减分规则</div>
                    </div>
                </button>
                <button onClick={() => { setViewMode('math_life'); setShowRewardSelector(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 flex items-center transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center mr-3 group-hover:bg-indigo-200 group-hover:text-circle transition-colors">
                        <BrainCircuit size={16}/>
                    </div>
                    <div>
                        <div className="font-bold text-slate-700 text-sm">数学生活家</div>
                        <div className="text-[10px] text-slate-400">探索生活中的数学奥秘</div>
                    </div>
                </button>
                <button onClick={() => { setViewMode('ai_hub'); setShowRewardSelector(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 flex items-center transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center mr-3 group-hover:bg-purple-200 group-hover:text-purple-600 transition-colors">
                        <Sparkles size={16}/>
                    </div>
                    <div>
                        <div className="font-bold text-slate-700 text-sm">AI 使用仓库</div>
                        <div className="text-[10px] text-slate-400">智能教学辅助工具</div>
                    </div>
                </button>
                <button onClick={() => { setViewMode('prizes'); setIsEditingPrizes(false); setShowRewardSelector(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 flex items-center transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center mr-3 group-hover:bg-pink-200 group-hover:text-pink-600 transition-colors">
                        <Package size={16}/>
                    </div>
                    <div>
                        <div className="font-bold text-slate-700 text-sm">奖品图鉴</div>
                        <div className="text-[10px] text-slate-400">查看所有奖品及库存</div>
                    </div>
                </button>
                <button onClick={() => { setViewMode('redemption'); setShowRewardSelector(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 flex items-center transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mr-3 group-hover:bg-amber-200 group-hover:text-amber-600 transition-colors">
                        <Gift size={16}/>
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-slate-700 text-sm flex justify-between items-center">
                            兑奖中心
                            {pendingPrizes.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full">{pendingPrizes.length}</span>}
                        </div>
                        <div className="text-[10px] text-slate-400">核销已获得的奖品</div>
                    </div>
                </button>
                <button onClick={() => { setViewMode('homework_list'); setShowRewardSelector(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 flex items-center transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mr-3 group-hover:bg-emerald-200 group-hover:text-emerald-600 transition-colors">
                        <ClipboardList size={16}/>
                    </div>
                    <div>
                        <div className="font-bold text-slate-700 text-sm">作业上交整理</div>
                        <div className="text-[10px] text-slate-400">快速统计作业上交情况</div>
                    </div>
                </button>
            </div>
            </div>
        </div>
      )}

      {/* AI Scan Modal */}
      {showAIScanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center">
                <BrainCircuit className="mr-3" size={24} />
                <h3 className="text-xl font-black">今日表现 AI 智能扫描</h3>
              </div>
              <button onClick={() => setShowAIScanModal(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {isScanning ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="text-indigo-500 animate-pulse" size={32} />
                    </div>
                  </div>
                  <p className="mt-6 text-slate-500 font-bold animate-pulse">AI 正在深度扫描今日表现数据...</p>
                </div>
              ) : aiScanError ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <AlertCircle size={48} className="text-amber-400 mb-4" />
                  <p className="font-bold">{aiScanError}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">加星项</th>
                          <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider text-center">人数</th>
                          <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">加星人学号</th>
                          <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">备注</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {aiScanResult.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4">
                              <span className="font-bold text-slate-700">{row.reason}</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-black text-sm">
                                {row.count}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {row.ids.split(', ').map((id: string) => (
                                  <span key={id} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-mono">
                                    #{id.padStart(2, '0')}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-sm text-slate-600 leading-relaxed italic">
                                {row.remark}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-center pt-4">
                    <button 
                      onClick={() => setShowAIScanModal(false)}
                      className="px-10 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center"
                    >
                      <CheckCircle size={18} className="mr-2" />
                      分析完毕
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 全员快速加/减星 Modal */}
      {showBulkActionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white flex justify-between items-center">
              <div className="flex items-center">
                <Zap className="mr-3" size={24} />
                <h3 className="text-xl font-black">全员快速加/减星</h3>
              </div>
              <button onClick={() => setShowBulkActionModal(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-3">设定加/减星数量</label>
                  <div className="flex items-center bg-slate-100 rounded-2xl px-4 py-4 border-2 border-transparent focus-within:border-amber-400 transition-all">
                    <Star size={24} className="text-amber-500 mr-3" />
                    <input 
                      type="number" 
                      value={bulkStarAmount}
                      onChange={(e) => setBulkStarAmount(parseFloat(e.target.value) || 0)}
                      className="bg-transparent border-none outline-none font-black text-2xl text-slate-700 w-full"
                      placeholder="输入数量"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-3 italic">* 全员操作将为所有在册同学同步录入流水记录</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={() => { handleBulkAction(bulkStarAmount); setShowBulkActionModal(false); }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-100 flex flex-col items-center justify-center gap-1"
                  >
                    <Plus size={20} />
                    <span>全员加星</span>
                  </button>
                  <button 
                    onClick={() => { handleBulkAction(-bulkStarAmount); setShowBulkActionModal(false); }}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-rose-100 flex flex-col items-center justify-center gap-1"
                  >
                    <Minus size={20} />
                    <span>全员减星</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 按学号快捷录入 Modal */}
      {showQuickActionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center">
                <Hash className="mr-3" size={24} />
                <h3 className="text-xl font-black">按学号快捷录入</h3>
              </div>
              <button onClick={() => setShowQuickActionModal(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-3">输入学号 (支持多选)</label>
                  <div className="bg-slate-100 rounded-2xl px-4 py-4 border-2 border-transparent focus-within:border-indigo-400 transition-all">
                    <input 
                      type="text" 
                      value={quickActionStudentId}
                      onChange={(e) => setQuickActionStudentId(e.target.value)}
                      className="bg-transparent border-none outline-none font-bold text-slate-700 w-full"
                      placeholder="学号 (如: 1, 2, 5)"
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">使用英文逗号或空格分隔多个学号</p>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 mb-3">选择录入项目</label>
                  <select 
                    value={quickActionReason}
                    onChange={(e) => setQuickActionReason(e.target.value)}
                    className="w-full bg-slate-100 rounded-2xl px-4 py-4 font-bold text-slate-700 border-2 border-transparent focus:border-indigo-400 outline-none transition-all appearance-none"
                  >
                    {ACTION_REASONS.map(a => (
                      <option key={a.label} value={a.label}>{a.label} ({a.score > 0 ? '+' : ''}{a.score})</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => { handleQuickActionById(); setShowQuickActionModal(false); }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  <span>确认录入</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 评价确认弹窗 */}
      {showEvalConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center"
          >
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Star size={40} className="fill-amber-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-4">
              {isFreeView ? '开启成长报告' : '确认消耗星星？'}
            </h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              {isFreeView 
                ? '这是你本周第一次查看成长报告，本次评价完全免费！✨' 
                : <>本周你已经查看过一次免费评价了。再次查看将消耗 <span className="text-amber-500 font-black">5 颗星星</span>。确定要继续吗？</>
              }
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowEvalConfirm(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition-all"
              >
                取消
              </button>
              <button 
                onClick={confirmEvaluateStudent}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-amber-100 transition-all"
              >
                确定
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 可视化题目详情 Modal */}
      {selectedViz && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800">{selectedViz.title}</h3>
                <p className="text-slate-500 text-xs mt-1">{selectedViz.description}</p>
              </div>
              <button onClick={() => setSelectedViz(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 relative">
              <iframe 
                srcDoc={selectedViz.htmlContent} 
                className="w-full h-full border-none"
                title={selectedViz.title}
                sandbox="allow-scripts allow-forms allow-popups"
              />
            </div>
          </div>
        </div>
      )}

      {/* 导入可视化题目 Modal */}
      {showAddVizModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center">
                <Plus className="mr-3" size={24} />
                <h3 className="text-xl font-black">导入可视化题目</h3>
              </div>
              <button onClick={() => setShowAddVizModal(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">题目名称</label>
                <input 
                  type="text" 
                  value={newViz.title}
                  onChange={e => setNewViz({...newViz, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all font-bold"
                  placeholder="例如：勾股定理可视化"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">题目描述</label>
                <textarea 
                  value={newViz.description}
                  onChange={e => setNewViz({...newViz, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all font-bold h-24 resize-none"
                  placeholder="简要介绍这个可视化的内容..."
                />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">题目分类</label>
                <div className="flex gap-4">
                  {['教材', '作业本', '周、月任务'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewViz({...newViz, category: cat as any})}
                      className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
                        newViz.category === cat 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">HTML 内容</label>
                <textarea 
                  value={newViz.htmlContent}
                  onChange={e => setNewViz({...newViz, htmlContent: e.target.value})}
                  className="w-full bg-slate-900 text-emerald-400 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all font-mono h-48 resize-none text-sm"
                  placeholder="在此粘贴 HTML 代码..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowAddVizModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all">取消</button>
                <button onClick={handleAddVisualization} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">确认导入</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 学生个性化评价 Modal */}
      {showEvalInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10 flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4 backdrop-blur-md">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black">AI 同学成长报告</h3>
                  <p className="text-amber-100 text-sm font-medium mt-1">深度分析你的太空基地表现</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowEvalInput(false);
                  setStudentEvaluationResult(null);
                  setEvaluatingStudentId('');
                }} 
                className="relative z-10 bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-8">
                {!studentEvaluationResult && (
                  <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <label className="block text-lg font-black text-slate-700 mb-4 flex items-center">
                      <Hash className="mr-2 text-amber-500" size={20} />
                      请输入你的学号
                    </label>
                    <div className="relative group">
                      <input 
                        type="number" 
                        value={evaluatingStudentId}
                        onChange={(e) => setEvaluatingStudentId(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-6 text-3xl font-black text-slate-700 focus:border-amber-400 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                        placeholder="例如: 01"
                        autoFocus
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-400 transition-colors">
                        <User size={32} />
                      </div>
                    </div>
                    <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                      <div className="text-sm text-amber-700 leading-relaxed font-medium">
                        <p>系统将综合分析你的表现并生成专属报告。✨</p>
                        <p className="mt-1 text-xs opacity-80">规则：每周第一次查看免费，第二次起消耗 5 颗星星。</p>
                      </div>
                    </div>
                  </div>
                )}

                {studentEvaluationResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-black">
                          #{evaluatingStudentId.padStart(2, '0')}
                        </div>
                        <h4 className="text-xl font-black text-slate-800">成长评价报告</h4>
                      </div>
                      <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100 flex items-center">
                        <CheckCircle size={12} className="mr-1" /> 分析完成
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 shadow-inner relative">
                      <div className="absolute top-4 right-4 opacity-10">
                        <PenTool size={80} />
                      </div>
                      <div className="relative z-10 text-slate-700 leading-loose text-lg whitespace-pre-wrap font-medium italic">
                        {studentEvaluationResult}
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => {
                          setStudentEvaluationResult(null);
                          setEvaluatingStudentId('');
                        }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={20} />
                        查询其他学号
                      </button>
                      <button 
                        onClick={() => {
                          setShowEvalInput(false);
                          setStudentEvaluationResult(null);
                          setEvaluatingStudentId('');
                        }}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-amber-100 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={20} />
                        阅读完毕
                      </button>
                    </div>
                  </motion.div>
                )}

                {!studentEvaluationResult && (
                  <button 
                    onClick={handleEvaluateStudent}
                    disabled={isEvaluatingStudent}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-6 rounded-3xl shadow-xl shadow-amber-100 transition-all flex items-center justify-center disabled:opacity-50 text-xl active:scale-[0.98]"
                  >
                    {isEvaluatingStudent ? (
                      <>
                        <Loader size={24} className="animate-spin mr-3"/>
                        正在深度分析数据...
                      </>
                    ) : (
                      <>
                        <Search size={24} className="mr-3"/>
                        生成我的评价
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 舰队名称重置确认弹窗 */}
      {showResetTeamNamesConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <RotateCcw className="text-rose-600" size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 text-center mb-3">重置舰队名称</h3>
            <p className="text-slate-500 text-center mb-8 leading-relaxed">
              确定要重置全部舰队名称吗？<br />
              这将恢复所有战队的默认编号名称（如：第 1 战队）。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetTeamNamesConfirm(false)}
                className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
              >
                取消
              </button>
              <button
                onClick={handleResetAllTeamNames}
                className="flex-1 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 transition-all"
              >
                确定重置
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}