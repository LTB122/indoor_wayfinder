import { useState, useRef, MouseEvent } from "react";
import { useMapControls } from "../hooks/useMapControl"; 
import { MapContent } from "./MapContent";
import { MapOverlay } from "./MapOverlay"; 
import { useEditorStore } from "../stores/editorStores";
import { MapNode, MapEdge } from "@/shared/types";

export const MapViewport = ({ onCursorMove }: { onCursorMove?: (x: number, y: number) => void }) => {
    // 1. ZUSTAND HOOK
    const { 
        currentMap, nodes, edges, activeTool, selectedId, selectedType,
        setMap, addNode, addEdge, selectItem, isEditing, updateNode
    } = useEditorStore();

    // 2. INTERNAL STATE (Chỉ dùng cho việc vẽ và zoom/pan)
    const { scale, position, isDragging, handlers, reset } = useMapControls(!!currentMap);
    
    // State tọa độ chuột ảo (đã tính scale/pan)
    const [virtualMouse, setVirtualMouse] = useState({ x: 0, y: 0 });
    
    // State tạm thời khi đang vẽ Edge (Polyline)
    const [edgeStartNodeId, setEdgeStartNodeId] = useState<number | null>(null);
    const [drawingPath, setDrawingPath] = useState<{ x: number; y: number }[]>([]);

	const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);

    // Refs
    const svgRef = useRef<SVGSVGElement>(null);
    const groupRef = useRef<SVGGElement>(null);

    // --- HÀM TÍNH TOÁN TỌA ĐỘ CHUẨN ---
    const getMapCoordinates = (e: MouseEvent) => {
        const svg = svgRef.current;
        const group = groupRef.current;
        if (!svg || !group) return { x: 0, y: 0 };

        let point = svg.createSVGPoint();
        point.x = e.clientX;
        point.y = e.clientY;

        const ctm = group.getScreenCTM();
        if (ctm) {
            point = point.matrixTransform(ctm.inverse());
        }
        return { x: point.x, y: point.y };
    };

    // --- EVENT HANDLERS ---

    const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
        const coords = getMapCoordinates(e);
        setVirtualMouse(coords);
        onCursorMove?.(coords.x, coords.y);

        // LOGIC KÉO THẢ NODE
        if (draggingNodeId !== null && isEditing) {
            // Cập nhật trực tiếp vào Store (Zustand sẽ làm component re-render cực nhanh)
            updateNode(draggingNodeId, { x: coords.x, y: coords.y });
            return; // Chặn sự kiện Pan bản đồ
        }

        // Chỉ Pan bản đồ khi không kéo node
        if (activeTool === "select" && draggingNodeId === null) {
            handlers.onMouseMove(e);
        }
    };

	const handleMouseUp = (e: MouseEvent) => {
        if (draggingNodeId !== null) {
            setDraggingNodeId(null);
             // Optional: Gọi API save to DB ở đây nếu muốn save ngay khi thả chuột
        }
        handlers.onMouseUp(e);
    };

    const handleBgClick = () => {
        if (!currentMap) return;

        // Tool: Add Node
        if (activeTool === "add-node") {
            const newNode: MapNode = {
                id: Date.now(), // ID tạm, backend sẽ cấp lại
                map_id: currentMap.id,
                x: virtualMouse.x,
                y: virtualMouse.y,
                name: `New Node`,
                type: 'path'
            };
            addNode(newNode);
        }

        // Tool: Add Edge (Thêm điểm neo cho đường gấp khúc)
        if (activeTool === "add-edge" && edgeStartNodeId !== null) {
            setDrawingPath((prev) => [...prev, { x: virtualMouse.x, y: virtualMouse.y }]);
        }
    };

    const handleNodeClick = (e: MouseEvent, nodeId: number) => {
		e.stopPropagation();
        if (activeTool === "select") {
            if (isEditing && selectedId === nodeId) {
                 setDraggingNodeId(nodeId);
            } else {
                 selectItem("node", nodeId);
            }
        } 
        else if (activeTool === "add-edge") {
            if (edgeStartNodeId === null) {
                // BƯỚC 1: Bắt đầu vẽ từ Node này
                setEdgeStartNodeId(nodeId);
                const startNode = nodes.find((n: { id: number; }) => n.id === nodeId);
                if (startNode) {
                    setDrawingPath([{ x: startNode.x, y: startNode.y }]);
                }
            } else {
                // BƯỚC 2: Kết thúc vẽ tại Node này -> Tạo Edge
                if (edgeStartNodeId !== nodeId) {
                    const newEdge: MapEdge = {
                        id: Date.now(),
                        start_node_id: edgeStartNodeId,
                        end_node_id: nodeId,
                        weight: 0, // Cần tính toán độ dài polyline sau
                        type: 'walk',
                        polyline: drawingPath.slice(1) // Bỏ điểm đầu vì trùng startNode
                    };
                    addEdge(newEdge);
                }
                // Reset state vẽ
                setEdgeStartNodeId(null);
                setDrawingPath([]);
            }
        }
    };

    // Helper tạo string cho thẻ <polyline>
    const getPolylineString = (points: { x: number; y: number }[]) => {
        return points.map((p) => `${p.x},${p.y}`).join(" ");
    };

    const cursorStyle = activeTool === "select" 
        ? (isDragging ? "cursor-grabbing" : "cursor-grab") 
        : "cursor-crosshair";

    return (
        <main className="flex-1 relative bg-slate-50 overflow-hidden">
            {/* Overlay: Load/Upload Map */}
            {!currentMap && <MapOverlay onUploadSuccess={setMap} />}

            <div className="absolute inset-0 flex items-center justify-center p-0">
                <svg
                    ref={svgRef}
                    className={`w-full h-full touch-none ${cursorStyle}`}
                    viewBox="0 0 800 600"
                    onWheel={handlers.onWheel}
                    onMouseDown={(e) => {
                        if (activeTool === "select") handlers.onMouseDown(e);
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={(e) => {
                    setDraggingNodeId(null); // Chuột ra khỏi khung thì ngừng kéo
                    handlers.onMouseLeave(e);
                }}
                    onClick={handleBgClick}
                >
                    {currentMap && (
                        <g
                            ref={groupRef}
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                transformOrigin: "0 0",
                                transition: isDragging ? "none" : "transform 0.1s ease-out",
                            }}
                        >
                            <MapContent
                                nodes={nodes}
                                edges={edges}
                                mapImage={currentMap.image_url}
                                selectedId={selectedId}
                                selectedType={selectedType}
                                onSelect={(type, id) => {
                            // MapContent gọi onSelect, ta cần chặn lại để xử lý MouseDown
                            // Tuy nhiên MapContent thường dùng onClick. 
                            // Để kéo mượt, tốt nhất nên chuyển logic click node trong MapContent sang onMouseDown
                        }}
								// TRUYỀN HÀM XỬ LÝ RIÊNG CHO NODE
								onNodeMouseDown={(e, id) => handleNodeClick(e, id)}
                                scale={scale}
                            />

                            {/* --- VISUAL FEEDBACK (GHOST ELEMENTS) --- */}
                            
                            {/* 1. Ghost Node */}
                            {activeTool === "add-node" && (
                                <circle
                                    cx={virtualMouse.x} cy={virtualMouse.y} r="8"
                                    fill="rgba(59, 130, 246, 0.5)" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 4"
                                    className="pointer-events-none"
                                />
                            )}

                            {/* 2. Drawing Edge Line */}
                            {activeTool === "add-edge" && edgeStartNodeId !== null && drawingPath.length > 0 && (
                                <>
                                    {/* Nét liền (đoạn đã chốt) */}
                                    <polyline
                                        points={getPolylineString(drawingPath)}
                                        fill="none" stroke="#2563eb" strokeWidth="2"
                                    />
                                    {/* Nét đứt (đi theo chuột) */}
                                    <line
                                        x1={drawingPath[drawingPath.length - 1].x}
                                        y1={drawingPath[drawingPath.length - 1].y}
                                        x2={virtualMouse.x}
                                        y2={virtualMouse.y}
                                        stroke="#2563eb" strokeWidth="2" strokeDasharray="5 5"
                                        className="pointer-events-none"
                                    />
                                    {/* Điểm neo */}
                                    {drawingPath.map((p, idx) => (
                                        <circle key={idx} cx={p.x} cy={p.y} r="3" fill="#2563eb" />
                                    ))}
                                </>
                            )}
                        </g>
                    )}
                </svg>
            </div>

            {/* --- CONTROLS --- */}
            {currentMap && (
                <>
                    <div className="absolute bottom-6 right-6 flex -translate-x-1/2">
                        <button onClick={reset} className="p-2 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition-colors" title="Reset View">
                            <span className="material-symbols-outlined">restart_alt</span>
                        </button>
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
                        <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-500 text-white font-bold rounded-full shadow-2xl opacity-90">
                            <span className="material-symbols-outlined text-xl">mouse</span>
                            <span className="text-sm">
                                {activeTool === 'select' ? "Kéo để di chuyển • Cuộn để Zoom" : 
                                 activeTool === 'add-node' ? "Click để đặt Node" : "Click Node bắt đầu -> Click nền thêm điểm -> Click Node kết thúc"}
                            </span>
                        </div>
                    </div>
                </>
            )}
        </main>
    );
};