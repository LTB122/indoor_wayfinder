import { useRef, useState, WheelEvent, MouseEvent } from "react";
import { MapEdge, MapNode } from "../types";
import { useMapControls } from "../components/useMapControl";
import { MapContent } from "./MapContent";
import { MapOverlay } from "./MapOverlay";

// MapViewport bây giờ vẽ SVG dựa trên dữ liệu props
interface MapViewportProps {
	nodes: MapNode[];
	edges: MapEdge[];
	selectedId: number | null;
	selectedType: "node" | "edge" | null;
	onSelect: (type: "node" | "edge", id: number) => void;
}

export const MapViewport = ({ nodes, edges, selectedId, selectedType, onSelect }: MapViewportProps) => {
	// State lưu URL của ảnh nền (trong thực tế bạn nên lưu cái này vào DB hoặc Context)
	const [mapImage, setMapImage] = useState<string | null>(null);
	const { scale, position, isDragging, handlers, reset } = useMapControls(!!mapImage);

	return (
		// THAY ĐỔI 1: Nền chuyển sang trắng và gradient nhẹ cho sang
		<main className="flex-1 relative bg-linear-to-br from-white to-slate-50 blueprint-grid overflow-hidden">
			{/* ===================================================================================== */}
			{/* LỚP PHỦ UPLOAD (OVERLAY) - THEME SÁNG                                                 */}
			{/* ===================================================================================== */}
			{!mapImage &&  (<MapOverlay onUpload={(url) => setMapImage(url)} /> )}

			{/* ===================================================================================== */}
			{/* VÙNG VẼ SVG                                                                           */}
			{/* ===================================================================================== */}
			<div className="absolute inset-0 flex items-center justify-center p-12">
				<svg className="w-full h-full touch-none" viewBox="0 0 800 600" {...handlers}>
					{/* BACKGROUND IMAGE */}
					{mapImage && (
						<g
							style={{
								transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
								transformOrigin: "center", // Có thể tinh chỉnh transformOrigin dựa trên vị trí chuột nếu muốn mượt hơn
								transition: isDragging ? "none" : "transform 0.1s ease-out",
							}}
						>
							<MapContent
								nodes={nodes}
								edges={edges}
								mapImage={mapImage}
								selectedId={selectedId}
								selectedType={selectedType}
								onSelect={onSelect}
								scale={scale}
							/>
						</g>
					)}

					{/* Grid Placeholder (Màu nhạt hơn) */}
					{!mapImage && (
						<defs>
							<filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
								<feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.3" />
							</filter>
							<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
								<path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-200" />
							</pattern>
						</defs>
					)}
					{!mapImage && <rect width="100%" height="100%" fill="url(#grid)" />}
				</svg>
			</div>

			{/* Nút Reset Zoom */}
			<div className="absolute bottom-6 right-6 flex right-1/2 -translate-x-1/2">
				<button
					onClick={reset}
					className="p-2 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition-colors"
				>
					<span className="material-symbols-outlined">restart_alt</span>
				</button>
			</div>

			{/* Floating Controls (Giữ nguyên) */}
			<div className="absolute bottom-6 left-1/2 -translate-x-1/2">
				<div className="flex items-center gap-3 px-6 py-2.5 bg-primary text-white font-bold rounded-full shadow-2xl">
					<span className="material-symbols-outlined text-xl">Mode</span>
					<span>Cuộn để Zoom • Chuột trái để Kéo</span>
				</div>
			</div>
		</main>
	);
};
