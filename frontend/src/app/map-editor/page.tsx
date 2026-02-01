"use client";

import React, { useEffect, useState } from "react";
import {useMapData} from "@/features/map-editor/components/useMapData";
import { MapStyleLoader } from "@/features/map-editor/components/MapStyleLoader";
import { TopNavigation } from "@/features/map-editor/components/TopNavigation";
import { ToolsPanel } from "@/features/map-editor/components/ToolsPanel";
import { InspectorPanel } from "@/features/map-editor/components/InspectorPanel";
import { MapViewport } from "@/features/map-editor/components/MapViewport";

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

				<div className="flex flex-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
