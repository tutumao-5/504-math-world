import React, { useEffect, useState } from 'react';

interface GeoShape {
  id: number;
  type: 'circle' | 'triangle' | 'square';
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  speed: number;
}

const GeoBackground: React.FC = () => {
  const [shapes, setShapes] = useState<GeoShape[]>([]);

  useEffect(() => {
    // 生成初始几何形状
    const initialShapes: GeoShape[] = [];
    const types: Array<'circle' | 'triangle' | 'square'> = ['circle', 'triangle', 'square'];

    for (let i = 0; i < 15; i++) {
      initialShapes.push({
        id: i,
        type: types[i % 3],
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 20 + Math.random() * 40,
        rotation: Math.random() * 360,
        opacity: 0.04 + Math.random() * 0.06,
        speed: 0.2 + Math.random() * 0.3,
      });
    }
    setShapes(initialShapes);
  }, []);

  useEffect(() => {
    if (shapes.length === 0) return;

    const animate = () => {
      setShapes(prev =>
        prev.map(shape => ({
          ...shape,
          y: shape.y > 105 ? -10 : shape.y + shape.speed * 0.02,
          rotation: shape.rotation + shape.speed * 0.1,
        }))
      );
    };

    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, [shapes.length]);

  const renderShape = (shape: GeoShape) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${shape.x}%`,
      top: `${shape.y}%`,
      opacity: shape.opacity,
      transform: `rotate(${shape.rotation}deg)`,
      transition: 'none',
    };

    switch (shape.type) {
      case 'circle':
        return (
          <div
            key={shape.id}
            style={{
              ...baseStyle,
              width: shape.size,
              height: shape.size,
              borderRadius: '50%',
              border: '2px solid #FF6B4A',
            }}
          />
        );
      case 'triangle':
        return (
          <div
            key={shape.id}
            style={{
              ...baseStyle,
              width: 0,
              height: 0,
              borderLeft: `${shape.size / 2}px solid transparent`,
              borderRight: `${shape.size / 2}px solid transparent`,
              borderBottom: `${shape.size * 0.866}px solid rgba(59, 130, 246, 0.08)`,
            }}
          />
        );
      case 'square':
        return (
          <div
            key={shape.id}
            style={{
              ...baseStyle,
              width: shape.size,
              height: shape.size,
              border: '2px solid #10B981',
              borderRadius: '2px',
            }}
          />
        );
    }
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -1 }}
    >
      {/* 渐变底色 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 15% 25%, rgba(255,107,74,0.06) 0%, transparent 25%),
            radial-gradient(circle at 85% 75%, rgba(16,185,129,0.06) 0%, transparent 25%),
            radial-gradient(circle at 50% 50%, rgba(59,130,246,0.04) 0%, transparent 30%)
          `,
        }}
      />

      {/* 网格线 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(255,107,74,0.03) 1px, transparent 1px),
            linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* 动态几何形状 */}
      {shapes.map(renderShape)}
    </div>
  );
};

export default GeoBackground;