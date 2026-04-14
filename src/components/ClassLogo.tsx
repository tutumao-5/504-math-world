import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const ClassLogo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizes = {
    sm: { img: 40, text: 'text-sm' },
    md: { img: 56, text: 'text-xl' },
    lg: { img: 80, text: 'text-3xl' },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      {/* Logo 图片 */}
      <img
        src="/logo.jpg"
        alt="504班数学世界"
        style={{
          width: s.img,
          height: s.img,
          borderRadius: 12,
          objectFit: 'cover',
        }}
      />

      {/* 文字 */}
      {showText && (
        <div className="hidden sm:flex flex-col">
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