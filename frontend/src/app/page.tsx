"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import MapViewer from "@/components/MapViewer";
import RouteSidebar from "@/components/RouteSidebar";
import { RouteResponse } from "@/types/map";

// Cấu hình URL Backend
const API_BASE_URL = "http://localhost:8000"; 
const MAP_ID = 1; // ID bản đồ mặc định, sau này có thể làm menu chọn tầng

export default function Home() {
  const [query, setQuery] = useState("");
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapImageUrl, setMapImageUrl] = useState("");

  // 1. Load thông tin Map khi mở app
  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/maps/${MAP_ID}`);
        // Backend trả về image_url dạng /static/..., cần ghép với domain
        setMapImageUrl(`${API_BASE_URL}${res.data.image_url}`);
      } catch (err) {
        console.error("Lỗi load map:", err);
      }
    };
    fetchMap();
  }, []);

  // 2. Hàm tìm đường
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      // Giả lập vị trí hiện tại (cx, cy) nếu user không nói "từ đâu"
      // Trong thực tế, cx/cy lấy từ thao tác click trên bản đồ
      const currentPos = { cx: 100, cy: 100 }; 
      
      const res = await axios.get<RouteResponse>(`${API_BASE_URL}/route/query`, {
        params: {
          map_id: MAP_ID,
          q: query,
          cx: currentPos.cx, // Gửi kèm vị trí hiện tại
          cy: currentPos.cy,
        },
      });
      
      setRouteData(res.data);
    } catch (error: any) {
      alert(error.response?.data?.detail || "Không tìm thấy đường đi.");
      setRouteData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-gray-100">
      {/* Cột trái: Điều hướng */}
      <RouteSidebar 
        query={query}
        setQuery={setQuery}
        onSearch={handleSearch}
        isLoading={loading}
        instructions={routeData?.instructions || []}
        totalDistance={routeData?.total_distance_m || 0}
      />

      {/* Cột phải: Bản đồ */}
      <div className="flex-1 relative h-full">
        {mapImageUrl ? (
          <MapViewer 
            imageUrl={mapImageUrl} 
            routeData={routeData} 
            onMapClick={(x, y) => console.log(x, y)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Đang tải bản đồ...
          </div>
        )}
      </div>
    </main>
  );
}