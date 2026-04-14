import React from 'react';

interface Student {
  id: number;
  name: string;
  totalStars: number;
  avatar?: string | null;
}

interface GeoTowerProps {
  students: Student[];
  title?: string;
  maxItems?: number;
}

const GeoTower: React.FC<GeoTowerProps> = ({
  students,
  title = '个人龙虎榜',
  maxItems = 5,
}) => {
  const sorted = [...students]
    .sort((a, b) => b.totalStars - a.totalStars)
    .slice(0, maxItems);

  const maxStars = sorted[0]?.totalStars || 1;

  // 几何形状和颜色映射
  const getBlockStyle = (rank: number) => {
    const styles = [
      { bg: '#FF6B4A', shape: 'circle', label: '○' },    // 第1名 - 圆形橙
      { bg: '#3B82F6', shape: 'triangle', label: '△' },  // 第2名 - 三角蓝
      { bg: '#10B981', shape: 'square', label: '□' },    // 第3名 - 方形绿
      { bg: '#F59E0B', shape: 'circle', label: '○' },    // 第4名 - 金色
      { bg: '#8B5CF6', shape: 'square', label: '□' },    // 第5名 - 紫色
    ];
    return styles[rank] || styles[4];
  };

  return (
    <div className="math-card relative overflow-visible">
      {/* 几何装饰角 */}
      <div
        className="absolute -top-3 -right-3 w-8 h-8 rounded-full"
        style={{ background: '#FF6B4A', opacity: 0.15 }}
      />
      <div
        className="absolute -bottom-2 -left-2"
        style={{
          width: 0,
          height: 0,
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderBottom: '20px solid rgba(59,130,246,0.15)',
        }}
      />

      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 rounded-full" style={{ background: '#FF6B4A' }} />
        <h3 className="text-2xl font-bold text-ink">{title}</h3>
        <span className="bg-warm-100 text-ink-muted px-3 py-1 rounded-full text-sm font-bold">
          TOP {maxItems}
        </span>
      </div>

      {/* 几何塔 */}
      <div className="flex items-end justify-center gap-3 px-4 pb-4" style={{ minHeight: 280 }}>
        {sorted.map((student, index) => {
          const style = getBlockStyle(index);
          // 塔的高度基于积分比例
          const heightPercent = maxStars > 0
            ? 40 + (student.totalStars / maxStars) * 55
            : 40;
          const blockHeight = Math.max(60, (heightPercent / 100) * 220);
          const blockWidth = index === 0 ? 80 : 65 - index * 5;

          return (
            <div
              key={student.id}
              className="flex flex-col items-center transition-all duration-500"
              style={{ width: blockWidth }}
            >
              {/* 排名徽章 */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2 shadow-md"
                style={{ background: style.bg }}
              >
                {index + 1}
              </div>

              {/* 几何积木块 */}
              <div
                className="relative flex items-center justify-center rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
                style={{
                  width: '100%',
                  height: blockHeight,
                  background: `linear-gradient(135deg, ${style.bg}, ${style.bg}dd)`,
                }}
              >
                {/* 几何形状装饰 */}
                <div
                  className="absolute top-2 right-2 opacity-30 text-white text-xl"
                >
                  {style.label}
                </div>

                {/* 学生信息 */}
                <div className="text-center text-white p-2">
                  <div className="text-lg font-bold truncate">{student.name}</div>
                  <div className="text-2xl font-display font-bold mt-1">
                    {student.totalStars}
                  </div>
                  <div className="text-[10px] opacity-75 mt-0.5">积分</div>
                </div>

                {/* Hover 效果 */}
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* 底部标签 */}
              {index === 0 && (
                <div className="mt-2 text-xs font-bold text-circle flex items-center gap-1">
                  <span>👑</span> 冠军
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GeoTower;