import { useState, useRef, useCallback, useEffect } from "react";

function DetectionOverlay({ enabled, points, onPointsChange, label = "1:User-defined" }) {
  const svgRef = useRef(null);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const pointsRef = useRef(points);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  const getRelativeCoords = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  // Check if click is near an existing point
  const findNearPoint = useCallback((coords) => {
    const threshold = 4;
    for (let i = 0; i < pointsRef.current.length; i++) {
      const p = pointsRef.current[i];
      const dist = Math.sqrt((p.x - coords.x) ** 2 + (p.y - coords.y) ** 2);
      if (dist < threshold) return i;
    }
    return -1;
  }, []);

  const handleClick = useCallback(
    (e) => {
      if (!enabled || dragIndex !== null) return;
      e.stopPropagation();
      const coords = getRelativeCoords(e);
      const current = pointsRef.current;

      // Don't add if clicking near an existing point
      if (findNearPoint(coords) >= 0) return;

      if (current.length < 4) {
        onPointsChange([...current, coords]);
      }
    },
    [enabled, onPointsChange, getRelativeCoords, findNearPoint, dragIndex],
  );

  const handleVertexMouseDown = useCallback(
    (e, index) => {
      if (!enabled) return;
      e.stopPropagation();
      e.preventDefault();
      setDragIndex(index);
    },
    [enabled],
  );

  const handleMouseMove = useCallback(
    (e) => {
      const coords = getRelativeCoords(e);

      // Dragging an existing point
      if (dragIndex !== null) {
        const updated = [...pointsRef.current];
        updated[dragIndex] = coords;
        onPointsChange(updated);
        return;
      }

      // Hover preview while drawing
      if (enabled && pointsRef.current.length < 4) {
        setHoverPoint(coords);
      }
    },
    [enabled, dragIndex, onPointsChange, getRelativeCoords],
  );

  const handleMouseUp = useCallback(() => {
    setDragIndex(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverPoint(null);
    setDragIndex(null);
  }, []);

  const polygonPath =
    points.length >= 3
      ? points.map((p) => `${p.x},${p.y}`).join(" ")
      : "";

  const previewPath =
    points.length >= 1 && points.length < 4 && hoverPoint && dragIndex === null
      ? [...points, hoverPoint].map((p) => `${p.x},${p.y}`).join(" ")
      : "";

  const labelPos =
    points.length >= 3
      ? {
          x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
          y: Math.min(...points.map((p) => p.y)) - 3,
        }
      : null;

  const redSquare =
    points.length >= 1
      ? { x: points[0].x - 1.5, y: points[0].y - 1.5 }
      : null;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full z-20"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ cursor: dragIndex !== null ? "grabbing" : enabled && points.length < 4 ? "crosshair" : "default" }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Completed polygon */}
      {polygonPath && (
        <polygon
          points={polygonPath}
          fill="rgba(255, 255, 0, 0.06)"
          stroke="#FFD700"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
      )}

      {/* Preview polygon while drawing */}
      {previewPath && (
        <polygon
          points={previewPath}
          fill="none"
          stroke="#FFD700"
          strokeWidth="0.4"
          strokeDasharray="1.5,0.8"
          strokeLinejoin="round"
          opacity="0.6"
        />
      )}

      {/* Vertices - draggable */}
      {points.map((p, i) => (
        <g key={i}>
          {/* Larger invisible hit area for easier grabbing */}
          <circle
            cx={p.x}
            cy={p.y}
            r="4"
            fill="transparent"
            style={{ cursor: enabled ? "grab" : "default" }}
            onMouseDown={(e) => handleVertexMouseDown(e, i)}
          />
          {/* Visible vertex */}
          <circle
            cx={p.x}
            cy={p.y}
            r="1.8"
            fill="#FFD700"
            stroke="#fff"
            strokeWidth="0.4"
            style={{ pointerEvents: "none" }}
          />
        </g>
      ))}

      {/* Red square marker at first point */}
      {redSquare && (
        <rect
          x={redSquare.x}
          y={redSquare.y}
          width="3"
          height="3"
          fill="none"
          stroke="#FF0000"
          strokeWidth="0.5"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Label */}
      {labelPos && (
        <text
          x={labelPos.x}
          y={labelPos.y}
          fill="#FFD700"
          fontSize="3"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          textAnchor="middle"
          style={{ pointerEvents: "none" }}
        >
          {label}
        </text>
      )}

      {/* Instruction text while drawing */}
      {enabled && points.length < 4 && (
        <text
          x="50"
          y="96"
          fill="rgba(255,255,255,0.7)"
          fontSize="2.5"
          fontFamily="Arial, sans-serif"
          textAnchor="middle"
          style={{ pointerEvents: "none" }}
        >
          Click to place point ({points.length}/4)
        </text>
      )}
    </svg>
  );
}

export default DetectionOverlay;
