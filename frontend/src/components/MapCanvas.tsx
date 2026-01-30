// src/components/MapCanvas.tsx

import React, { useRef } from "react";
import { NodeData, EdgeData, EditorMode } from "@/types/editor";

interface MapCanvasProps {
  imageUrl: string;
  nodes: NodeData[];
  edges: EdgeData[];
  mode: EditorMode;
  onAddNode: (x: number, y: number) => void;
  onSelectNode: (node: NodeData) => void;
  
  // --- SỬA DÒNG NÀY ---
  // Cũ: onSelectEdge: (edge: EdgeData) => void;
  // Mới: Bắt buộc trả về object có id là number
  onSelectEdge: (edge: EdgeData & { id: number }) => void; 
  // --------------------

  selectedNodeId: number | null;
  selectedEdgeId: number | null;
}

export default function MapCanvas({
  imageUrl, nodes, edges, mode,
  onAddNode, onSelectNode, onSelectEdge, selectedNodeId, selectedEdgeId
}: MapCanvasProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  const handleBgClick = (e: React.MouseEvent) => {
    if (mode !== "add_node" || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onAddNode(x, y);
  };

  return (
    <div className="relative inline-block border shadow-lg bg-gray-500 overflow-auto max-w-full max-h-full">
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Map Base"
        className="block select-none pointer-events-auto cursor-crosshair"
        onClick={handleBgClick}
        draggable={false}
      />

      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {edges.map((edge, idx) => {
          const start = nodes.find(n => n.temp_id === edge.start_node_temp_id);
          const end = nodes.find(n => n.temp_id === edge.end_node_temp_id);
          if (!start || !end) return null;

          const isSelected = idx === selectedEdgeId;
          const strokeColor = edge.type === "elevator" ? "purple" : edge.type === "stairs" ? "orange" : "blue";

          return (
            <line
              key={`edge-${idx}`}
              x1={start.x} y1={start.y}
              x2={end.x} y2={end.y}
              stroke={isSelected ? "red" : strokeColor}
              strokeWidth={isSelected ? 4 : 2}
              className="pointer-events-auto cursor-pointer hover:stroke-red-400"
              onClick={(e) => {
                e.stopPropagation();
                // Ở đây chúng ta gán idx vào id, nên nó khớp với kiểu EdgeData & { id: number }
                onSelectEdge({ ...edge, id: idx }); 
              }}
            />
          );
        })}

        {nodes.map((node) => {
          const isSelected = node.temp_id === selectedNodeId;
          return (
            <g 
              key={`node-${node.temp_id}`} 
              className="pointer-events-auto cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node);
              }}
            >
              <circle
                cx={node.x} cy={node.y}
                r={isSelected ? 8 : 5}
                fill={node.is_landmark ? "#ffeb3b" : "white"}
                stroke={isSelected ? "red" : "black"}
                strokeWidth={2}
              />
              {node.aliases && (
                <text x={node.x + 10} y={node.y} fontSize="10" fill="black" fontWeight="bold" className="bg-white px-1">
                  {node.aliases.split(',')[0]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}