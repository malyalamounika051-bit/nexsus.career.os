import { useEffect, useRef, useState, useCallback } from 'react';

const CATEGORY_COLORS = {
  frontend: '#38bdf8',
  backend: '#10b981',
  devops: '#f59e0b',
  data: '#a855f7',
  ai: '#ec4899',
  'soft-skills': '#06b6d4',
  default: '#64748b',
};

const SkillGraph = ({
  nodes = [],
  edges = [],
  width = 600,
  height = 450,
  onNodeClick,
  selectedNodeId,
}) => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [positions, setPositions] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragNode = useRef(null);
  const simRef = useRef({ velocities: [], running: true });

  // Initialize positions using force-directed layout
  useEffect(() => {
    if (nodes.length === 0) return;

    const cx = width / 2;
    const cy = height / 2;
    const initialPositions = nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      const r = Math.min(width, height) * 0.32;
      return {
        id: n.id,
        x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 30,
        y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 30,
        vx: 0,
        vy: 0,
      };
    });

    simRef.current.velocities = initialPositions;
    simRef.current.running = true;

    let iteration = 0;
    const maxIterations = 200;

    const simulate = () => {
      if (!simRef.current.running || iteration >= maxIterations) {
        setPositions([...simRef.current.velocities]);
        return;
      }

      const pos = simRef.current.velocities;
      const alpha = 1 - iteration / maxIterations;
      const repulsion = 2500;
      const attraction = 0.008;
      const damping = 0.85;
      const centerGravity = 0.01;

      // Apply forces
      for (let i = 0; i < pos.length; i++) {
        let fx = 0, fy = 0;

        // Repulsion between all nodes
        for (let j = 0; j < pos.length; j++) {
          if (i === j) continue;
          const dx = pos[i].x - pos[j].x;
          const dy = pos[i].y - pos[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }

        // Attraction along edges
        edges.forEach(edge => {
          const srcIdx = nodes.findIndex(n => n.id === edge.source);
          const tgtIdx = nodes.findIndex(n => n.id === edge.target);
          if (srcIdx === -1 || tgtIdx === -1) return;
          if (i !== srcIdx && i !== tgtIdx) return;

          const otherIdx = i === srcIdx ? tgtIdx : srcIdx;
          const dx = pos[otherIdx].x - pos[i].x;
          const dy = pos[otherIdx].y - pos[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const strength = edge.strength || 0.5;
          fx += dx * attraction * strength;
          fy += dy * attraction * strength;
        });

        // Center gravity
        fx += (cx - pos[i].x) * centerGravity;
        fy += (cy - pos[i].y) * centerGravity;

        pos[i].vx = (pos[i].vx + fx * alpha) * damping;
        pos[i].vy = (pos[i].vy + fy * alpha) * damping;
        pos[i].x += pos[i].vx;
        pos[i].y += pos[i].vy;

        // Boundary clamping
        const pad = 40;
        pos[i].x = Math.max(pad, Math.min(width - pad, pos[i].x));
        pos[i].y = Math.max(pad, Math.min(height - pad, pos[i].y));
      }

      iteration++;
      setPositions([...pos]);
      animFrameRef.current = requestAnimationFrame(simulate);
    };

    animFrameRef.current = requestAnimationFrame(simulate);

    return () => {
      simRef.current.running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [nodes, edges, width, height]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || positions.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    edges.forEach(edge => {
      const src = positions.find(p => p.id === edge.source);
      const tgt = positions.find(p => p.id === edge.target);
      if (!src || !tgt) return;

      const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target ||
        selectedNodeId === edge.source || selectedNodeId === edge.target;

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = isHighlighted
        ? `rgba(14, 165, 233, ${0.3 + (edge.strength || 0.5) * 0.5})`
        : `rgba(255, 255, 255, ${0.04 + (edge.strength || 0.5) * 0.08})`;
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach((node, i) => {
      const pos = positions[i];
      if (!pos) return;

      const baseSize = (node.size || 1) * 8 + 12;
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNodeId === node.id;
      const color = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.default;
      const r = isHovered || isSelected ? baseSize + 4 : baseSize;

      // Glow
      if (isHovered || isSelected) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isHovered || isSelected ? color : `${color}33`;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isHovered || isSelected ? 2.5 : 1.5;
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = isHovered || isSelected ? '#fff' : 'var(--color-text-dim, #8899b0)';
      ctx.font = `${isHovered || isSelected ? 'bold ' : ''}${Math.max(10, baseSize * 0.55)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isHovered || isSelected ? '#ffffff' : '#8899b0';
      ctx.fillText(node.label, pos.x, pos.y);
    });
  }, [positions, nodes, edges, hoveredNode, selectedNodeId, width, height]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Check hover
    let found = null;
    for (let i = 0; i < positions.length; i++) {
      const node = nodes[i];
      const pos = positions[i];
      if (!pos || !node) continue;
      const size = (node.size || 1) * 8 + 12;
      const dx = x - pos.x;
      const dy = y - pos.y;
      if (dx * dx + dy * dy < size * size) {
        found = node.id;
        break;
      }
    }
    setHoveredNode(found);
    canvasRef.current.style.cursor = found ? 'pointer' : 'default';
  }, [positions, nodes]);

  const handleClick = useCallback((e) => {
    if (hoveredNode && onNodeClick) {
      const node = nodes.find(n => n.id === hoveredNode);
      if (node) onNodeClick(node);
    }
  }, [hoveredNode, nodes, onNodeClick]);

  if (nodes.length === 0) {
    return (
      <div style={{
        width, height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px dashed var(--color-border)', borderRadius: 16,
        color: 'var(--color-text-muted)', fontSize: '0.85rem',
      }}>
        No skill graph data available
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ width, height, display: 'block', borderRadius: 16 }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      {/* Tooltip */}
      {hoveredNode && (() => {
        const node = nodes.find(n => n.id === hoveredNode);
        if (!node) return null;
        const pos = positions.find(p => p.id === hoveredNode);
        if (!pos) return null;
        const color = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.default;
        return (
          <div style={{
            position: 'absolute',
            left: Math.min(pos.x + 15, width - 160),
            top: Math.max(pos.y - 50, 10),
            background: 'var(--color-surface)',
            border: `1px solid ${color}40`,
            borderRadius: 10,
            padding: '0.6rem 0.85rem',
            boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 15px ${color}20`,
            pointerEvents: 'none',
            zIndex: 10,
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#fff', marginBottom: '0.2rem' }}>
              {node.label}
            </div>
            <div style={{ fontSize: '0.7rem', color, textTransform: 'capitalize' }}>
              {node.category}
            </div>
          </div>
        );
      })()}
      {/* Category legend */}
      <div style={{
        position: 'absolute', bottom: 8, right: 8,
        display: 'flex', flexWrap: 'wrap', gap: '0.35rem',
        background: 'rgba(6,9,26,0.85)', borderRadius: 8, padding: '0.4rem 0.6rem',
      }}>
        {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'default').map(([cat, col]) => (
          <span key={cat} style={{
            fontSize: '0.6rem', color: col, display: 'flex', alignItems: 'center', gap: '0.2rem',
            textTransform: 'capitalize',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, display: 'inline-block' }} />
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SkillGraph;
