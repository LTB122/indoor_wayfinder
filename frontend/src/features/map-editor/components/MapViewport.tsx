import { MapEdge, MapNode } from "../types";

// MapViewport bây giờ vẽ SVG dựa trên dữ liệu props
interface MapViewportProps {
    nodes: MapNode[];
    edges: MapEdge[];
    selectedId: number | null;
    selectedType: "node" | "edge" | null;
    onSelect: (type: "node" | "edge", id: number) => void;
}

export const MapViewport = ({ nodes, edges, selectedId, selectedType, onSelect }: MapViewportProps) => {
    return (
        <main className="flex-1 relative bg-slate-100 dark:bg-[#0f172a] blueprint-grid overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center p-12">
                <svg className="w-full h-full" fill="none" height="100%" viewBox="0 0 800 600" width="100%" xmlns="http://www.w3.org/2000/svg">
                    {/* Static Buildings Background (Giữ nguyên để làm nền) */}
                    <g className="opacity-50 pointer-events-none">
                        <rect className="text-slate-300 dark:text-slate-800" fill="currentColor" height="120" rx="4" width="180" x="150" y="100"></rect>
                        <rect className="text-slate-300 dark:text-slate-800" fill="currentColor" height="200" rx="4" width="120" x="450" y="80"></rect>
                        <rect className="text-slate-300 dark:text-slate-800" fill="currentColor" height="150" rx="4" width="250" x="200" y="350"></rect>
                        {/* <path d="M240 160 L450 160 L510 280 L325 425 L240 160" opacity="0.6" stroke="#137fec" strokeDasharray="4 2" strokeWidth="2"></path> */}
                    </g>

                    {/* LAYER EDGE: Đã chuyển sang dùng thẻ <path> */}
                    {edges.map((edge) => {
                        const startNode = nodes.find((n) => n.id === edge.start_node_id);
                        const endNode = nodes.find((n) => n.id === edge.end_node_id);
                        if (!startNode || !endNode) return null;

                        const isSelected = selectedType === "edge" && selectedId === edge.id;

                        // ==================================================================================
                        // LOGIC MỚI TẠO PATH DATA (d="...")
                        // 1. Bắt đầu bằng lệnh M (Move to) đến node đầu
                        let pathData = `M ${startNode.x} ${startNode.y}`;

                        // 2. Nếu có các điểm trung gian (polyline json), dùng lệnh L (Line to) để nối đến đó
                        if (edge.polyline && edge.polyline.length > 0) {
                            pathData += edge.polyline.map((p) => ` L ${p.x} ${p.y}`).join("");
                        }

                        // 3. Kết thúc bằng lệnh L nối đến node cuối
                        pathData += ` L ${endNode.x} ${endNode.y}`;
                        // Kết quả ví dụ: "M 100 100 L 200 150 L 300 300"
                        // ==================================================================================

                        return (
                            <g
                                key={edge.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect("edge", edge.id);
                                }}
                                className="cursor-pointer group"
                            >
                                {/* Vùng click rộng trong suốt (Hit area) - Dùng <path> */}
                                <path
                                    d={pathData} // <-- Dùng thuộc tính d thay vì points
                                    fill="none"
                                    stroke="transparent"
                                    strokeWidth="20"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Đường hiển thị chính - Dùng <path> */}
                                <path
                                    d={pathData} // <-- Dùng thuộc tính d thay vì points
                                    fill="none" // Quan trọng: path mặc định sẽ tô màu đen nếu không set fill="none"
                                    stroke={isSelected ? "#3b82f6" : "#1e3a8a"}
                                    strokeWidth={isSelected ? 4 : 2}
                                    strokeDasharray={isSelected ? "0" : "6 4"}
                                    strokeLinecap="round" // Làm tròn đầu mút
                                    strokeLinejoin="round" // Làm tròn góc gấp khúc
                                    className="transition-all duration-300 ease-in-out"
                                />

                                {/* Mũi tên chỉ hướng cho đường 1 chiều (Đã fix lỗi Polyline) */}
                                {!edge.bidirectional &&
                                    (() => {
                                        // 1. Tạo danh sách TẤT CẢ các điểm đi qua: Start -> Polyline -> End
                                        const allPoints = [
                                            { x: startNode.x, y: startNode.y },
                                            ...(edge.polyline || []), // Nếu không có polyline thì mảng này rỗng
                                            { x: endNode.x, y: endNode.y },
                                        ];

                                        // 2. Tìm đoạn thẳng nằm ở giữa (Middle Segment)
                                        // Ví dụ: A -> B -> C -> D. Có 3 đoạn. Ta lấy đoạn thứ 2 (B -> C)
                                        const totalSegments = allPoints.length - 1;
                                        const middleSegmentIndex = Math.floor(totalSegments / 2);

                                        const p1 = allPoints[middleSegmentIndex]; // Điểm đầu của đoạn giữa
                                        const p2 = allPoints[middleSegmentIndex + 1]; // Điểm cuối của đoạn giữa

                                        // 3. Tính toán vị trí và góc TRÊN ĐOẠN ĐÓ
                                        const midX = (p1.x + p2.x) / 2;
                                        const midY = (p1.y + p2.y) / 2;

                                        const dx = p2.x - p1.x;
                                        const dy = p2.y - p1.y;
                                        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                                        return (
                                            <path
                                                d="M -5 -5 L 1 0 L -5 5" // Hình mũi tên mảnh mai
                                                fill="none"
                                                stroke={isSelected ? "#3b82f6" : "#1e3a8a"} // Xanh đậm
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                // Dịch chuyển đến giữa đoạn segment đó và xoay
                                                transform={`translate(${midX}, ${midY}) rotate(${angle})`}
                                                className="transition-all duration-300 ease-in-out pointer-events-none"
                                            />
                                        );
                                    })()}
                            </g>
                        );
                    })}

                    {/* DYNAMIC NODES RENDER LAYER */}
                    {nodes.map((node) => {
                        const isSelected = selectedType === "node" && selectedId === node.id;
                        return (
                            <g
                                key={node.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect("node", node.id);
                                }}
                                className="group"
                            >
                                {/* Vùng click rộng hơn một chút để dễ bấm */}
                                <circle cx={node.x} cy={node.y} r="15" fill="transparent" className="cursor-pointer" />

                                {/* Node chính */}
                                <circle
                                    className={`node-hover transition-colors duration-200 ${isSelected ? "fill-primary" : "fill-slate-500 dark:fill-slate-400 group-hover:fill-primary/70"}`}
                                    cx={node.x}
                                    cy={node.y}
                                    r={isSelected ? 8 : 6}
                                />

                                {/* Vòng highlight khi được chọn */}
                                {isSelected && (
                                    <circle cx={node.x} cy={node.y} fill="transparent" r="14" stroke="#137fec" strokeWidth="2" className="animate-pulse" />
                                )}

                                {/* Label text */}
                                <text
                                    className={`pointer-events-none text-[10px] font-medium transition-all ${isSelected ? "fill-primary font-bold -translate-y-1" : "fill-slate-500 dark:fill-slate-400"}`}
                                    textAnchor="middle"
                                    x={node.x}
                                    y={node.y - 20}
                                >
                                    {node.name}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Floating Controls (Giữ nguyên) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-3 px-6 py-2.5 bg-primary text-white font-bold rounded-full shadow-2xl">
                    <span className="material-symbols-outlined text-xl">Mode</span>
                    <span>Add Node</span>
                </div>
            </div>
        </main>
    );
};
