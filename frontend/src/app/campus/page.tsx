"use client";

import React, { useEffect, useState } from "react";
import { MapNode } from "../../components/node";
import { MapEdge } from "../../components/edge";

// ==========================================
// 1. DATA TYPES & MOCK DATA (Giả lập Database)
// ==========================================

// Dữ liệu giả lập (thường sẽ lấy từ API)
const MOCK_NODES: MapNode[] = [
	{ id: 1, name: "Klarman Hall", is_landmark: true, x: 240, y: 160, aliases: ["Klarman"] },
	{ id: 2, name: "Cổng Đông (East Gate)", is_landmark: true, x: 510, y: 80, aliases: ["Cổng Đông", "East Gate"] },
	{ id: 3, name: "Student Center", is_landmark: true, x: 325, y: 425, aliases: ["Student Center"] },
	{ id: 4, name: "Ngã tư trung tâm", is_landmark: true, x: 510, y: 280, aliases: ["Ngã tư trung tâm"] },
	{ id: 5, name: "Thư viện", is_landmark: true, x: 450, y: 160, aliases: ["Thư viện"] },
	{ id: 6, name: "Bãi gửi xe", is_landmark: true, x: 600, y: 280, aliases: ["Bãi gửi xe"] },
];

const MOCK_EDGES: MapEdge[] = [
	// Đường thẳng bình thường (không có polyline)
	{
		id: 1,
		start_node_id: 1,
		end_node_id: 2,
		type: "walk",
		weight: 50,
		bidirectional: true,
		polyline: [],
	},

	// Đường gấp khúc (Ví dụ: đi vòng qua bãi cỏ)
	{
		id: 2,
		start_node_id: 2,
		end_node_id: 3,
		type: "walk",
		weight: 30,
		bidirectional: true,
		polyline: [
			{ x: 480, y: 200 },
			{ x: 480, y: 250 },
		],
	},

	// Đường 1 chiều
	{
		id: 3,
		start_node_id: 4,
		end_node_id: 3,
		type: "walk",
		weight: 100,
		bidirectional: true,
		polyline: [],
	},
];

// Custom Hook giả lập gọi API
const useMapData = () => {
	const [nodes, setNodes] = useState<MapNode[]>([]);
	const [edges, setEdges] = useState<MapEdge[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Giả vờ đợi 0.5 giây như đang gọi Server thật
		setTimeout(() => {
			setNodes(MOCK_NODES);
			setEdges(MOCK_EDGES);
			setLoading(false);
		}, 500);
	}, []);

	return { nodes, edges, loading };
};

// ==========================================
// 2. UTILITY COMPONENTS (Style Loader)
// ==========================================

const MapStyleLoader = () => {
	useEffect(() => {
		const script = document.createElement("script");
		script.src = "https://cdn.tailwindcss.com?plugins=forms,container-queries";
		script.async = true;
		script.onload = () => {
			if (window.tailwind) {
				window.tailwind.config = {
					darkMode: "class",
					theme: {
						extend: {
							colors: { primary: "#137fec", "background-light": "#f6f7f8", "background-dark": "#101922" },
							fontFamily: { display: ["Inter"] },
						},
					},
				};
			}
		};
		document.head.appendChild(script);
		const style = document.createElement("style");
		style.textContent = `
      .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      .blueprint-grid { background-image: radial-gradient(circle, #233648 1px, transparent 1px); background-size: 20px 20px; }
      .node-hover:hover { r: 8px; transition: all 0.2s ease; cursor: pointer; }
    `;
		document.head.appendChild(style);
		return () => {
			document.head.removeChild(script);
			document.head.removeChild(style);
		};
	}, []);
	return null;
};

// ==========================================
// 3. UI COMPONENTS (Tĩnh)
// ==========================================

const TopNavigation = () => (
	<header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark px-6 py-3 z-50">
		<div className="flex items-center gap-8">
			<div className="flex items-center gap-4 text-primary">
				<div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg">
					<span className="material-symbols-outlined">map</span>
				</div>
				<h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">Campus Map Editor</h2>
			</div>
			<nav className="flex items-center gap-6">
				<a className="text-primary text-sm font-semibold border-b-2 border-primary py-1" href="#">
					Map Editor
				</a>
				<a className="text-slate-500 dark:text-[#92adc9] text-sm font-medium hover:text-primary transition-colors" href="#">
					Building Manager
				</a>
			</nav>
		</div>
		<div className="flex flex-1 justify-end gap-4 items-center">
			<div
				className="bg-slate-200 dark:bg-slate-700 aspect-square bg-cover rounded-full size-8"
				style={{
					backgroundImage:
						'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCTqk3ShVeZ8KizqaRgItK0DFmK-VTH12rl67PC9HKvCo1JNHJalkrsYlSXcrf8oFgsae-GuYQFzzm7ghcOXhO6MHqrh__FoqLv1Y8scn3XiioJSlkzEjPUsKmRklVCDesVm4EefnlzKFNBOLbbooZ1xDg_R-TeDNYgDZcpidtePFmzJo8PSy2DtbLDCYl4unLVGn0DIld6vUxyFzIoCI1pI5w_kjTeQ8jf8Cj8Frq7Y9uUrrP5GNrvmakJ_8bDtf0s0vi-_4EBeLOv")',
				}}
			/>
		</div>
	</header>
);

const ToolsPanel = () => (
	<aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col p-4 gap-6">
		{/* (Giữ nguyên nội dung ToolsPanel cũ) */}
		<div className="flex flex-col gap-2">
			<h1 className="text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest opacity-50">Tools</h1>
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white shadow-sm cursor-pointer">
					<span className="material-symbols-outlined text-xl">near_me</span>
					<p className="text-sm font-medium">Select Tool</p>
				</div>
				<div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-[#92adc9] hover:bg-slate-100 dark:hover:bg-[#192633] cursor-pointer transition-colors">
					<span className="material-symbols-outlined text-xl">add_circle</span>
					<p className="text-sm font-medium">Add Node</p>
				</div>
				<div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-[#92adc9] hover:bg-slate-100 dark:hover:bg-[#192633] cursor-pointer transition-colors">
					<span className="material-symbols-outlined text-xl">conversion_path</span>
					<p className="text-sm font-medium">Add Edge</p>
				</div>
			</div>
		</div>
		<div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
			<div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
				<span>LAT: 42.3601 N</span>
				<span>LON: 71.0589 W</span>
			</div>
		</div>
	</aside>
);

// ==========================================
// 4. INTERACTIVE COMPONENTS (Động)
// ==========================================

// InspectorPanel bây giờ nhận props `node` để hiển thị
const InspectorPanel = ({ data, type }: { data: any; type: "node" | "edge" | null }) => {
	// 1. Nếu chưa chọn gì thì hiển thị màn hình chờ
	if (!data || !type) {
		return (
			<aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col items-center justify-center text-slate-400 p-6 text-center">
				<span className="material-symbols-outlined text-4xl mb-2 opacity-50">touch_app</span>
				<p className="text-sm">Click vào một địa điểm hoặc đường nối để xem chi tiết</p>
			</aside>
		);
	}

	return (
		<aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
			{/* HEADER: Tiêu đề thay đổi tùy theo Node hay Edge */}
			<div className="p-6 border-b border-slate-100 dark:border-slate-800">
				<div className="flex items-center justify-between mb-4">
					<span className="text-[10px] font-bold uppercase tracking-widest text-primary">{type === "node" ? "Node Details" : "Edge Properties"}</span>
					<span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">ID: {data.id}</span>
				</div>
				<h2 className="text-slate-900 dark:text-white text-xl font-bold mb-1">{type === "node" ? data.name : "Path Connection"}</h2>
				{type === "node" && data.description && <p className="text-slate-500 dark:text-[#92adc9] text-xs mt-1">{data.description}</p>}
			</div>

			<div className="p-6 flex flex-col gap-6">
				{/* ============================== */}
				{/* TRƯỜNG HỢP 1: HIỂN THỊ NODE    */}
				{/* ============================== */}
				{type === "node" ? (
					<>
						{/* Action Buttons */}
						<div className="flex flex-col gap-3">
							<button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold text-sm hover:bg-primary/20 transition-colors">
								<span className="material-symbols-outlined text-lg">domain</span>
								Chi tiết
							</button>
							<button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold text-sm hover:bg-primary/20 transition-colors">
								<span className="material-symbols-outlined text-lg">edit</span>
								Chỉnh sửa thông tin
							</button>
						</div>

						{/* Coordinates */}
						<div className="flex flex-col gap-3 p-4 rounded-lg bg-slate-50 dark:bg-[#192633] border border-slate-100 dark:border-slate-800">
							<div className="flex justify-between items-center">
								<span className="text-[10px] text-slate-400 font-mono uppercase">Tọa độ X</span>
								<span className="text-xs font-mono text-slate-600 dark:text-slate-300">{data.x}</span>
							</div>
							<div className="h-px bg-slate-200 dark:bg-[#233648]"></div>
							<div className="flex justify-between items-center">
								<span className="text-[10px] text-slate-400 font-mono uppercase">Tọa độ Y</span>
								<span className="text-xs font-mono text-slate-600 dark:text-slate-300">{data.y}</span>
							</div>
						</div>

						{/* Aliases Section (Đã sửa lỗi hiển thị) */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Aliases</h3>
								<button className="text-primary text-xs font-bold hover:underline">+ Add</button>
							</div>
							<div className="flex flex-wrap gap-2">
								{data.aliases && data.aliases.length > 0 ? (
									data.aliases.map((alias: string, index: number) => (
										<div
											key={index}
											className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-[#233648] text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
										>
											<span>{alias}</span>
											<span className="material-symbols-outlined text-xs cursor-pointer opacity-60 hover:opacity-100">close</span>
										</div>
									))
								) : (
									<span className="text-xs text-slate-400 italic">No aliases</span>
								)}
							</div>
						</div>

						{/* Flags (Chỉ hiện nếu có dữ liệu flags) */}
						{data.flags && (
							<div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
								<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Accessibility</h3>
								<div className="space-y-2">
									<label className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
										<span className="flex items-center gap-2">
											<span className="material-symbols-outlined text-lg">accessible</span>Wheelchair
										</span>
										<input
											checked={data.flags.wheelchair}
											readOnly
											type="checkbox"
											className="rounded text-primary focus:ring-primary bg-transparent"
										/>
									</label>
								</div>
							</div>
						)}
					</>
				) : (
					/* ============================== */
					/* TRƯỜNG HỢP 2: HIỂN THỊ EDGE    */
					/* ============================== */
					<>
						<div className="flex flex-col gap-4">
							{/* Thông tin kết nối */}
							<div className="p-4 bg-slate-50 dark:bg-[#192633] rounded border border-slate-100 dark:border-slate-700">
								<div className="flex justify-between mb-2">
									<span className="text-xs text-slate-500">Type</span>
									<span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">{data.type}</span>
								</div>
								<div className="h-px bg-slate-200 dark:bg-[#233648] my-2"></div>
								<div className="flex justify-between items-center mb-1">
									<span className="text-xs text-slate-500">Start Node</span>
									<span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{data.start_node_id}</span>
								</div>
								<div className="flex justify-center text-slate-400 my-1">
									<span className="material-symbols-outlined text-sm">arrow_downward</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-xs text-slate-500">End Node</span>
									<span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{data.end_node_id}</span>
								</div>
							</div>

							{/* Thông số kỹ thuật */}
							<div className="flex items-center justify-between p-3 rounded bg-slate-50 dark:bg-[#192633]">
								<span className="text-sm font-medium dark:text-slate-300">Weight</span>
								<div className="flex items-center gap-1">
									<span className="font-bold font-mono">{data.weight}</span>
									<span className="text-xs text-slate-400">m</span>
								</div>
							</div>

							<div className="flex items-center justify-between p-3 rounded bg-slate-50 dark:bg-[#192633]">
								<span className="text-sm font-medium dark:text-slate-300">Bidirectional</span>
								<input
									type="checkbox"
									checked={data.bidirectional}
									readOnly
									className="rounded border-slate-300 text-primary h-4 w-4 bg-transparent"
								/>
							</div>

							{/* Waypoints / Polyline Section */}
							<div className="flex flex-col gap-2">
								<div className="flex items-center justify-between">
									<span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Waypoints</span>
									{data.polyline && data.polyline.length > 0 && (
										<span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
											{data.polyline.length} points
										</span>
									)}
								</div>

								<div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-600">
									{data.polyline && data.polyline.length > 0 ? (
										// Trường hợp có điểm gấp khúc: Hiển thị danh sách đẹp
										<div className="flex flex-col gap-2 relative">
											{/* Đường kẻ nối mờ mờ làm nền */}
											<div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-600 z-0"></div>

											{data.polyline.map((point: { x: number; y: number }, index: number) => (
												<div key={index} className="flex items-center gap-3 relative z-10">
													{/* Số thứ tự hình tròn */}
													<div className="flex-none size-5 rounded-full bg-white dark:bg-slate-700 border border-primary/30 flex items-center justify-center shadow-sm">
														<span className="text-[9px] font-bold text-primary">{index + 1}</span>
													</div>

													{/* Tọa độ được format gọn gàng */}
													<div className="flex-1 flex items-center gap-2 text-xs bg-white dark:bg-slate-700 px-2 py-1.5 rounded border border-slate-100 dark:border-slate-600 shadow-sm font-mono text-slate-600 dark:text-slate-300">
														<span className="flex items-center gap-1">
															<span className="text-[9px] text-slate-400 uppercase">X:</span>
															<span>{point.x}</span>
														</span>
														<span className="text-slate-300 dark:text-slate-500">|</span>
														<span className="flex items-center gap-1">
															<span className="text-[9px] text-slate-400 uppercase">Y:</span>
															<span>{point.y}</span>
														</span>
													</div>
												</div>
											))}
										</div>
									) : (
										// Trường hợp đường thẳng: Hiển thị thông báo đẹp hơn
										<div className="flex items-center justify-center gap-2 py-4 text-slate-400 text-xs">
											<span className="material-symbols-outlined text-sm opacity-70">straight</span>
											<span>Đường thẳng trực tiếp</span>
										</div>
									)}
								</div>
							</div>
						</div>

						<button className="w-full mt-auto flex items-center justify-center gap-2 py-2.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-dashed border-slate-300 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200">
							<span className="material-symbols-outlined text-lg">delete</span>
							<span className="text-xs font-semibold">Remove Connection</span>
						</button>
					</>
				)}
			</div>
		</aside>
	);
};

// MapViewport bây giờ vẽ SVG dựa trên dữ liệu props
interface MapViewportProps {
	nodes: MapNode[];
	edges: MapEdge[];
	selectedId: number | null;
	selectedType: "node" | "edge" | null;
	onSelect: (type: "node" | "edge", id: number) => void;
}

const MapViewport = ({ nodes, edges, selectedId, selectedType, onSelect }: MapViewportProps) => {
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

// ==========================================
// 5. MAIN CONTROLLER
// ==========================================

export default function CampusMapEditor() {
	const { nodes, edges, loading } = useMapData();

	const [selectedId, setSelectedId] = React.useState<number | null>(null);
	const [selectedType, setSelectedType] = React.useState<"node" | "edge" | null>(null);

	const handleSelect = (type: "node" | "edge", id: number) => {
		setSelectedType(type);
		setSelectedId(id);
	};

	const handleDeselect = () => {
		setSelectedType(null);
		setSelectedId(null);
	};

	const selectedData = selectedType === "node" ? nodes.find((n) => n.id === selectedId) : edges.find((e) => e.id === selectedId);

	return (
		<>
			<MapStyleLoader />
			<div className="flex flex-col h-screen" onClick={handleDeselect}>
				<TopNavigation />

				<div className="flex flex-1 overflow-hidden">
					<ToolsPanel />

					{loading ? (
						<div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-[#0f172a]">
							<span className="text-primary animate-pulse font-bold">Loading Map Data...</span>
						</div>
					) : (
						<MapViewport nodes={nodes} edges={edges} selectedId={selectedId} selectedType={selectedType} onSelect={handleSelect} />
					)}

					{/* Truyền cả Data và Type xuống Inspector để nó biết đường hiển thị */}
					<InspectorPanel data={selectedData} type={selectedType} />
				</div>
			</div>
		</>
	);
}

declare global {
	interface Window {
		tailwind?: any;
	}
}
