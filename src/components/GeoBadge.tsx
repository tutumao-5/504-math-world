import React from 'react';

interface Badge {
  id: string;
  name: string;
  description: string;
  type: 'circle' | 'triangle' | 'square';
  earned?: boolean;
  count?: number;
}

interface GeoBadgeProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
}

const GeoBadge: React.FC<GeoBadgeProps> = ({ badge, size = 'md' }) => {
  const sizes = {
    sm: { container: 48, icon: 20, text: 'text-xs' },
    md: { container: 64, icon: 28, text: 'text-sm' },
    lg: { container: 88, icon: 40, text: 'text-base' },
  };

  const s = sizes[size];
  const colors = {
    circle: { main: '#FF6B4A', light: 'rgba(255,107,74,0.15)' },
    triangle: { main: '#3B82F6', light: 'rgba(59,130,246,0.15)' },
    square: { main: '#10B981', light: 'rgba(16,185,129,0.15)' },
  };

  const c = colors[badge.type];
  const isEarned = badge.earned !== false;

  const renderShape = () => {
    switch (badge.type) {
      case 'circle':
        return (
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: s.container,
              height: s.container,
              background: isEarned ? c.main : '#E5E7EB',
              boxShadow: isEarned ? `0 4px 14px ${c.light}` : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <span className="text-white" style={{ fontSize: s.icon }}>⭐</span>
          </div>
        );
      case 'triangle':
        return (
          <div className="relative flex items-center justify-center" style={{ width: s.container, height: s.container }}>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${s.container / 2}px solid transparent`,
                borderRight: `${s.container / 2}px solid transparent`,
                borderBottom: `${s.container * 0.866}px solid ${isEarned ? c.main : '#E5E7EB'}`,
                filter: isEarned ? `drop-shadow(0 4px 8px ${c.light})` : 'none',
                transition: 'all 0.3s ease',
              }}
            />
            <span
              className="absolute text-white"
              style={{ fontSize: s.icon, top: '35%' }}
            >
              🎯
            </span>
          </div>
        );
      case 'square':
        return (
          <div
            className="rounded-xl flex items-center justify-center"
            style={{
              width: s.container,
              height: s.container,
              background: isEarned ? c.main : '#E5E7EB',
              transform: 'rotate(6deg)',
              boxShadow: isEarned ? `0 4px 14px ${c.light}` : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <span className="text-white" style={{ fontSize: s.icon }}>🏅</span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 group cursor-pointer">
      {renderShape()}
      <div className="text-center">
        <div className={`font-bold text-ink ${s.text}`}>{badge.name}</div>
        {badge.count !== undefined && (
          <div className="text-xs text-ink-muted mt-0.5">×{badge.count}</div>
        )}
      </div>

      {/* Hover 详情 */}
      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-ink text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
          {badge.description}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-ink" />
        </div>
      </div>
    </div>
  );
};

// 徽章墙组件
interface BadgeWallProps {
  badges: Badge[];
}

const GeoBadgeWall: React.FC<BadgeWallProps> = ({ badges }) => {
  return (
    <div className="math-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 rounded-full" style={{ background: '#10B981' }} />
        <h3 className="text-2xl font-bold text-ink">几何成就</h3>
        <span className="bg-warm-100 text-ink-muted px-3 py-1 rounded-full text-sm font-bold">
          {badges.filter(b => b.earned !== false).length}/{badges.length}
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-6">
        {badges.map(badge => (
          <GeoBadge key={badge.id} badge={badge} size="md" />
        ))}
      </div>
    </div>
  );
};

export { GeoBadge, GeoBadgeWall };
export type { Badge };