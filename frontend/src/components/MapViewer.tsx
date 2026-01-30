"use client";

import React, { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { RouteResponse } from "@/types/map";

interface MapViewerProps {
  imageUrl: string;
  routeData: RouteResponse | null;
  onMapClick?: (x: number, y: number) => void;
}

export default function MapViewer({ imageUrl, routeData, onMapClick }: MapViewerProps) {
  // Chuyển đổi mảng tọa độ [[x,y],...] thành chuỗi "x,y x,y" cho SVG
  const polylinePoints = routeData?.path_coords
    .map((p) => `${p[0]},${p[1]}`)
    .join(" ");

  // Xử lý click để lấy tọa độ (dùng khi user muốn chọn điểm "Tôi đang ở đây")
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!onMapClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Tính toán tọa độ tương đối trên ảnh gốc đòi hỏi logic phức tạp hơn do zoom
    // Ở bản đơn giản này, ta tạm bỏ qua hoặc chỉ log ra
    console.log("Clicked map (logic convert pixel cần xử lý thêm)");
  };

  return (
    <div className="w-full h-full bg-gray-100 overflow-hidden relative border border-gray-300 rounded-lg">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit
      >
        <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
          <div className="relative cursor-crosshair" onClick={handleImageClick}>
            {/* 1. Bản đồ nền */}
            <img
              src={imageUrl}
              alt="Indoor Map"
              className="block max-w-none" // Quan trọng: max-w-none để ảnh không bị co lại
              style={{ pointerEvents: "none" }} // Tránh drag ảnh
            />

            {/* 2. Lớp vẽ đường đi (SVG overlay) */}
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ zIndex: 10 }}
              // ViewBox quan trọng: Phải khớp với kích thước thật của ảnh (cần lấy từ API hoặc onLoad)
              // Ở đây giả định viewbox tự động scale theo container cha
            >
              {routeData && (
                <>
                  {/* Đường viền bao quanh (cho nổi bật) */}
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="white"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                  />
                  {/* Đường chính màu xanh */}
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="#3b82f6" // Blue-500
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-md"
                  />

                  {/* Điểm đầu (Start) */}
                  <circle
                    cx={routeData.path_coords[0][0]}
                    cy={routeData.path_coords[0][1]}
                    r="6"
                    fill="#22c55e" // Green-500
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Điểm cuối (End) */}
                  <circle
                    cx={routeData.path_coords[routeData.path_coords.length - 1][0]}
                    cy={routeData.path_coords[routeData.path_coords.length - 1][1]}
                    r="6"
                    fill="#ef4444" // Red-500
                    stroke="white"
                    strokeWidth="2"
                  />
                </>
              )}
            </svg>
          </div>
        </TransformComponent>
      </TransformWrapper>
      
      {/* Nút chỉ dẫn (Watermark hoặc Control) */}
      <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded shadow text-xs text-gray-500 backdrop-blur-sm">
        Sử dụng chuột/cảm ứng để Zoom & Pan
      </div>
    </div>
  );
}