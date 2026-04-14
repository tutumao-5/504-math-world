import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const ClassLogo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizes = {
    sm: { container: 32, text: 'text-sm' },
    md: { container: 48, text: 'text-xl' },
    lg: { container: 80, text: 'text-3xl' },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      {/* 几何Logo - 三个基础形状组合 */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: s.container, height: s.container }}
      >
        {/* 圆形 - 珊瑚橙 */}
        <div
          className="absolute rounded-full"
          style={{
            width: s.container * 0.5,
            height: s.container * 0.5,
            background: '#FF6B4A',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />

        {/* 三角形 - 天空蓝 */}
        <div
          className="absolute"
          style={{
            width: 0,
            height: 0,
            borderLeft: `${s.container * 0.28}px solid transparent`,
            borderRight: `${s.container * 0.28}px solid transparent`,
            borderBottom: `${s.container * 0.48}px solid #3B82F6`,
            bottom: s.container * 0.05,
            left: 0,
          }}
        />

        {/* 正方形 - 薄荷绿 */}
        <div
          className="absolute rounded-sm"
          style={{
            width: s.container * 0.35,
            height: s.container * 0.35,
            background: '#10B981',
            bottom: s.container * 0.05,
            right: 0,
            transform: 'rotate(12deg)',
          }}
        />

        {/* 中心504数字 */}
        <span
          className="absolute font-display font-bold text-white"
          style={{
            fontSize: s.container * 0.22,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textShadow: '0 1px 3px rgba(0,0,0,0.2)',
            zIndex: 10,
          }}
        >
          504
        </span>
      </div>

      {/* 文字 */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-display font-bold text-ink leading-tight ${s.text}`}>
            数学世界
          </span>
          <span className="text-[10px] font-medium text-ink-muted tracking-wider uppercase">
            Math World
          </span>
        </div>
      )}
    </div>
  );
};

export default ClassLogo;