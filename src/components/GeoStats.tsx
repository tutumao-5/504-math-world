import React from 'react';

interface StatCardProps {
  value: number | string;
  label: string;
  type?: 'circle' | 'triangle' | 'square';
  progress?: number; // 0-100
  subtitle?: string;
}

const GeoStatCard: React.FC<StatCardProps> = ({
  value,
  label,
  type = 'circle',
  progress,
  subtitle,
}) => {
  const colors = {
    circle: { main: '#FF6B4A', light: 'rgba(255,107,74,0.1)', shadow: 'rgba(255,107,74,0.2)' },
    triangle: { main: '#3B82F6', light: 'rgba(59,130,246,0.1)', shadow: 'rgba(59,130,246,0.2)' },
    square: { main: '#10B981', light: 'rgba(16,185,129,0.1)', shadow: 'rgba(16,185,129,0.2)' },
  };

  const c = colors[type];

  const renderShape = () => {
    switch (type) {
      case 'circle':
        return (
          <div
            className="absolute -top-4 -right-4 rounded-full"
            style={{
              width: 48,
              height: 48,
              background: c.light,
              border: `2px solid ${c.main}`,
            }}
          />
        );
      case 'triangle':
        return (
          <div
            className="absolute -top-4 -right-4"
            style={{
              width: 0,
              height: 0,
              borderLeft: '24px solid transparent',
              borderRight: '24px solid transparent',
              borderBottom: `42px solid ${c.light}`,
            }}
          />
        );
      case 'square':
        return (
          <div
            className="absolute -top-4 -right-4 rounded-md"
            style={{
              width: 40,
              height: 40,
              background: c.light,
              border: `2px solid ${c.main}`,
              transform: 'rotate(12deg)',
            }}
          />
        );
    }
  };

  return (
    <div className="math-card relative overflow-visible">
      {/* 几何装饰 */}
      {renderShape()}

      {/* 环形进度条（如果有progress） */}
      {progress !== undefined ? (
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg width="80" height="80" viewBox="0 0 80 80">
              {/* 背景圆环 */}
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={c.light}
                strokeWidth="6"
              />
              {/* 进度圆环 */}
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={c.main}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 213.6} 213.6`}
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-ink">{progress}%</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-ink">{value}</div>
            <div className="text-sm text-ink-muted">{label}</div>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-4xl font-display font-bold text-ink mb-1">{value}</div>
          <div className="text-sm text-ink-muted">{label}</div>
          {subtitle && <div className="text-xs text-ink-muted mt-1">{subtitle}</div>}
        </div>
      )}
    </div>
  );
};

// 数据面板组件
interface StatsPanelProps {
  totalStars: number;
  totalStudents: number;
  todayStars: number;
  activeTeams: number;
}

const GeoStatsPanel: React.FC<StatsPanelProps> = ({
  totalStars,
  totalStudents,
  todayStars,
  activeTeams,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <GeoStatCard
        value={totalStars}
        label="班级总积分"
        type="circle"
      />
      <GeoStatCard
        value={totalStudents}
        label="班级人数"
        type="triangle"
      />
      <GeoStatCard
        value={todayStars}
        label="今日获得"
        type="square"
        subtitle="积分"
      />
      <GeoStatCard
        value={activeTeams}
        label="活跃战队"
        type="circle"
      />
    </div>
  );
};

export { GeoStatCard, GeoStatsPanel };