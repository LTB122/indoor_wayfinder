import { MOCK_NODES, MOCK_EDGES } from "@/features/map-editor/data";
import { useEffect, useState } from "react";
import { MapEdge, MapNode } from "../types";

export const useMapData = () => {
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