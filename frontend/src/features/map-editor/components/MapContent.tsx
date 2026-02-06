import { MapNode, MapEdge } from "../types";

interface MapContentProps {
	nodes: MapNode[];
	edges: MapEdge[];
	mapImage: string;
	selectedId: number | null;
	selectedType: "node" | "edge" | null;
	onSelect: (type: "node" | "edge", id: number) => void;
	scale: number;
}

export const MapContent = ({ nodes, edges, mapImage, selectedId, selectedType, onSelect, scale }: MapContentProps) => {
	return (
		<>
			<image
				href={mapImage}
				x="0"
				y="0"
				width="800"
				height="600"
				preserveAspectRatio="xMidYMid slice"
				// THAY ĐỔI 3: Giảm opacity ít hơn để ảnh sáng hơn, bỏ chế độ invert
				className="opacity-80 transition-all"
			/>
			{/* ================================================================================== */}
			{/* LAYER EDGE                                                                         */}
			{/* ================================================================================== */}
			{edges.map((edge) => {
				const startNode = nodes.find((n) => n.id === edge.start_node_id);
				const endNode = nodes.find((n) => n.id === edge.end_node_id);
				if (!startNode || !endNode) return null;

				const isSelected = selectedType === "edge" && selectedId === edge.id;
				let pathData = `M ${startNode.x} ${startNode.y}`;
				if (edge.polyline && edge.polyline.length > 0) {
					pathData += edge.polyline.map((p) => ` L ${p.x} ${p.y}`).join("");
				}
				pathData += ` L ${endNode.x} ${endNode.y}`;

				return (
					<g
						key={edge.id}
						onClick={(e) => {
							e.stopPropagation();
							onSelect("edge", edge.id);
						}}
						className="cursor-pointer group"
					>
						{/* Hit Area */}
						<path d={pathData} fill="none" stroke="transparent" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />

						{/* Halo trắng (Viền nền) - Giúp tách khỏi ảnh map */}
						<path
							d={pathData}
							fill="none"
							stroke="white"
							strokeWidth={isSelected ? 8 : 6}
							strokeLinecap="round"
							strokeLinejoin="round"
							className="opacity-90"
						/>

						{/* Đường chính: MÀU XANH ĐẬM (NAVY) */}
						<path
							d={pathData}
							fill="none"
							// Normal: #1e40af (Blue 800 - Rất đậm, rõ như mực bút bi)
							// Selected: #3b82f6 (Blue 500 - Sáng rực rỡ)
							stroke={isSelected ? "#3b82f6" : "#1C4D8D"}
							strokeWidth={isSelected ? 4 : 3}
							strokeDasharray={isSelected ? "0" : "6 4"}
							strokeLinecap="round"
							strokeLinejoin="round"
							className="transition-colors duration-200"
						/>
					</g>
				);
			})}

			{/* ================================================================================== */}
			{/* LAYER NODE                                                                         */}
			{/* ================================================================================== */}
			{nodes.map((node) => {
				const isSelected = selectedType === "node" && selectedId === node.id;
				return (
					<g
						key={node.id}
						onClick={(e) => {
							e.stopPropagation();
							onSelect("node", node.id);
						}}
						className="group cursor-pointer"
					>
						{/* Hit Area */}
						<circle cx={node.x} cy={node.y} r="20" fill="transparent" />

						{/* Blocker nền trắng */}
						<circle cx={node.x} cy={node.y} r={isSelected ? 10 : 8} fill="white" />

						{/* NODE CHÍNH: KHÔNG CÓ CHẤM, VIỀN ĐẬM */}
						<circle
							className="transition-all duration-300 ease-out"
							cx={node.x}
							cy={node.y}
							r={isSelected ? 10 : 8}
							fill="white"
							// Normal: #1e40af (Blue 800) - Viền đậm, rõ ràng
							// Selected: #3b82f6 (Blue 500)
							stroke={isSelected ? "#3b82f6" : "#1e40af"}
							strokeWidth={isSelected ? 4 : 3}
							filter="url(#crisp-shadow)"
						/>

						{/* Pulse (Hiệu ứng sóng) khi chọn */}
						{isSelected && (
							<circle cx={node.x} cy={node.y} fill="transparent" r="16" stroke="#60a5fa" strokeWidth="2" className="animate-pulse opacity-60" />
						)}

						{/* Label Text: Màu xanh đậm (#1e3a8a) - Đọc rất rõ */}
						<text
							className={`pointer-events-none text-[11px] font-bold transition-all duration-300 
                                        ${isSelected ? "fill-blue-600 -translate-y-3 text-xs" : "fill-[#1C4D8D] opacity-0 group-hover:opacity-100"}`}
							textAnchor="middle"
							x={node.x}
							y={node.y - 16}
							style={{
                                fontSize: `${11 / scale}px`,
								paintOrder: "stroke",
								stroke: "white",
								strokeWidth: "3px",
								strokeLinecap: "round",
								strokeLinejoin: "round",
							}}
						>
							{node.name}
						</text>
					</g>
				);
			})}
		</>
	);
};
