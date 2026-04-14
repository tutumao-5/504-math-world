import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  type: 'circle' | 'triangle' | 'square';
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
}

interface PresentationModeProps {
  className?: string;
  totalStars: number;
  totalStudents: number;
  topStudent: { name: string; stars: number } | null;
  teamName: string;
  teamStars: number;
}

const PresentationMode: React.FC<PresentationModeProps> = ({
  className = '',
  totalStars,
  totalStudents,
  topStudent,
  teamName,
  teamStars,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [time, setTime] = useState(new Date());

  // 初始化粒子
  useEffect(() => {
    const types: Array<'circle' | 'triangle' | 'square'> = ['circle', 'triangle', 'square'];
    const initial: Particle[] = [];

    for (let i = 0; i < 50; i++) {
      initial.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        type: types[i % 3],
        size: 4 + Math.random() * 12,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 2,
        opacity: 0.1 + Math.random() * 0.2,
      });
    }
    setParticles(initial);
  }, []);

  // 动画循环
  useEffect(() => {
    const animate = () => {
      setParticles(prev =>
        prev.map(p => ({
          ...p,
          x: (p.x + p.speedX + 100) % 100,
          y: (p.y + p.speedY + 100) % 100,
          rotation: p.rotation + p.rotSpeed,
        }))
      );
    };

    const interval = setInterval(animate, 30);
    return () => clearInterval(interval);
  }, []);

  // 时钟
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderParticle = (p: Particle) => {
    const colors = {
      circle: '#FF6B4A',
      triangle: '#3B82F6',
      square: '#10B981',
    };

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${p.x}%`,
      top: `${p.y}%`,
      opacity: p.opacity,
      transform: `rotate(${p.rotation}deg)`,
    };

    switch (p.type) {
      case 'circle':
        return (
          <div
            key={p.id}
            style={{
              ...style,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: colors.circle,
            }}
          />
        );
      case 'triangle':
        return (
          <div
            key={p.id}
            style={{
              ...style,
              width: 0,
              height: 0,
              borderLeft: `${p.size / 2}px solid transparent`,
              borderRight: `${p.size / 2}px solid transparent`,
              borderBottom: `${p.size}px solid ${colors.triangle}`,
            }}
          />
        );
      case 'square':
        return (
          <div
            key={p.id}
            style={{
              ...style,
              width: p.size,
              height: p.size,
              background: colors.square,
              borderRadius: 2,
            }}
          />
        );
    }
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, #FFFBF5 0%, #FEF7ED 50%, #FFFBF5 100%)',
      }}
    >
      {/* 粒子背景 */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(renderParticle)}
      </div>

      {/* 几何装饰线 */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.1 }}>
        <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#FF6B4A" strokeWidth="1" />
        <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#3B82F6" strokeWidth="1" />
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#10B981" strokeWidth="1" />
        <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#FF6B4A" strokeWidth="1" />
      </svg>

      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Logo区域 */}
        <div className="mb-12">
          <div className="flex items-center gap-4">
            {/* 大号几何Logo */}
            <div className="relative" style={{ width: 100, height: 100 }}>
              <div
                className="absolute rounded-full"
                style={{ width: 50, height: 50, background: '#FF6B4A', top: 0, left: '50%', transform: 'translateX(-50%)' }}
              />
              <div
                className="absolute"
                style={{ width: 0, height: 0, borderLeft: '28px solid transparent', borderRight: '28px solid transparent', borderBottom: '48px solid #3B82F6', bottom: 5, left: 0 }}
              />
              <div
                className="absolute rounded-sm"
                style={{ width: 35, height: 35, background: '#10B981', bottom: 5, right: 0, transform: 'rotate(12deg)' }}
              />
              <span
                className="absolute font-display font-bold text-white"
                style={{ fontSize: 22, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 10 }}
              >
                504
              </span>
            </div>
            <div>
              <h1 className="text-5xl font-display font-bold text-ink">数学世界</h1>
              <p className="text-xl text-ink-muted mt-1">Math World · 几何美术馆</p>
            </div>
          </div>
        </div>

        {/* 数据展示 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-5xl mb-16">
          {/* 总积分 */}
          <div className="text-center">
            <div
              className="mx-auto w-32 h-32 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'conic-gradient(#FF6B4A 0%, #FF6B4A 75%, rgba(255,107,74,0.15) 75%)' }}
            >
              <div className="bg-cream w-24 h-24 rounded-full flex items-center justify-center">
                <span className="text-3xl font-display font-bold text-ink">{totalStars}</span>
              </div>
            </div>
            <div className="text-lg font-bold text-ink">班级总积分</div>
          </div>

          {/* 人数 */}
          <div className="text-center">
            <div
              className="mx-auto w-32 h-32 flex items-center justify-center mb-4"
              style={{
                width: 0,
                height: 0,
                borderLeft: '64px solid transparent',
                borderRight: '64px solid transparent',
                borderBottom: '110px solid rgba(59,130,246,0.15)',
                position: 'relative',
              }}
            >
              <span
                className="absolute text-3xl font-display font-bold text-ink"
                style={{ top: '40%' }}
              >
                {totalStudents}
              </span>
            </div>
            <div className="text-lg font-bold text-ink">班级人数</div>
          </div>

          {/* 冠军 */}
          <div className="text-center">
            <div
              className="mx-auto w-32 h-32 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(16,185,129,0.15)', transform: 'rotate(6deg)' }}
            >
              <div style={{ transform: 'rotate(-6deg)' }}>
                <div className="text-4xl mb-1">👑</div>
                <div className="text-lg font-bold text-ink">{topStudent?.name || '-'}</div>
                <div className="text-2xl font-display font-bold text-square">{topStudent?.stars || 0}</div>
              </div>
            </div>
            <div className="text-lg font-bold text-ink">本周冠军</div>
          </div>

          {/* 冠军战队 */}
          <div className="text-center">
            <div
              className="mx-auto w-32 h-32 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'conic-gradient(#F59E0B 0%, #F59E0B 60%, rgba(245,158,11,0.15) 60%)' }}
            >
              <div className="bg-cream w-24 h-24 rounded-full flex flex-col items-center justify-center">
                <div className="text-lg font-bold text-ink">{teamName}</div>
                <div className="text-2xl font-display font-bold text-ink">{teamStars}</div>
              </div>
            </div>
            <div className="text-lg font-bold text-ink">冠军战队</div>
          </div>
        </div>

        {/* 时间 */}
        <div className="text-6xl font-display font-bold text-ink/20">
          {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default PresentationMode;