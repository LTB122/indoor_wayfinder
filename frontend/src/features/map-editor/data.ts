import {MapEdge, MapNode} from "@/features/map-editor/types"

// Dữ liệu giả lập (thường sẽ lấy từ API)
export const MOCK_NODES: MapNode[] = [
	{ id: 1, name: "Klarman Hall", is_landmark: true, x: 240, y: 160, aliases: ["Klarman"] },
	{ id: 2, name: "Cổng Đông (East Gate)", is_landmark: true, x: 510, y: 80, aliases: ["Cổng Đông", "East Gate"] },
	{ id: 3, name: "Student Center", is_landmark: true, x: 325, y: 425, aliases: ["Student Center"] },
	{ id: 4, name: "Ngã tư trung tâm", is_landmark: true, x: 510, y: 280, aliases: ["Ngã tư trung tâm"] },
	{ id: 5, name: "Thư viện", is_landmark: true, x: 450, y: 160, aliases: ["Thư viện"] },
	{ id: 6, name: "Bãi gửi xe", is_landmark: true, x: 600, y: 280, aliases: ["Bãi gửi xe"] },
];
 
export const MOCK_EDGES: MapEdge[] = [
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