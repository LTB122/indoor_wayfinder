import React from "react";
import { Instruction } from "@/types/map";
import { 
  ArrowUp, CornerUpLeft, CornerUpRight, 
  ArrowUpRight, ArrowUpLeft, MapPin, 
  Building, MoveVertical 
} from "lucide-react";
import clsx from "clsx";

interface RouteSidebarProps {
  instructions: Instruction[];
  totalDistance: number;
  query: string;
  setQuery: (q: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

// Hàm chọn icon dựa trên action
const getIcon = (action: string) => {
  switch (action) {
    case "start": return <MapPin className="text-green-600" />;
    case "turn_left": return <CornerUpLeft className="text-blue-600" />;
    case "turn_right": return <CornerUpRight className="text-blue-600" />;
    case "slight_left": return <ArrowUpLeft className="text-blue-500" />;
    case "slight_right": return <ArrowUpRight className="text-blue-500" />;
    case "enter_elevator": 
    case "use_elevator": return <Building className="text-purple-600" />;
    case "enter_stairs": 
    case "use_stairs": return <MoveVertical className="text-orange-600" />;
    case "arrive": return <MapPin className="text-red-600 fill-red-100" />;
    default: return <ArrowUp className="text-gray-600" />;
  }
};

export default function RouteSidebar({ 
  instructions, totalDistance, query, setQuery, onSearch, isLoading 
}: RouteSidebarProps) {
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-lg border-r border-gray-200 w-full md:w-96 z-20">
      {/* Header & Search */}
      <div className="p-4 bg-blue-600 text-white shadow-md">
        <h1 className="text-xl font-bold mb-2">Indoor Map AI</h1>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="VD: Từ sảnh đến thang máy..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button 
            onClick={onSearch}
            disabled={isLoading}
            className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded font-medium text-sm transition disabled:opacity-50"
          >
            {isLoading ? "..." : "Đi"}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {instructions.length > 0 && (
        <div className="p-3 bg-gray-50 border-b flex justify-between items-center text-sm text-gray-600">
          <span>Tổng quãng đường:</span>
          <span className="font-bold text-gray-900">{totalDistance} mét</span>
        </div>
      )}

      {/* List Instructions */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {instructions.length === 0 ? (
          <div className="text-center text-gray-400 mt-10 text-sm">
            Nhập địa điểm để tìm đường <br/>(VD: "về phòng 101")
          </div>
        ) : (
          instructions.map((step, idx) => (
            <div 
              key={idx} 
              className={clsx(
                "flex items-start gap-3 p-3 rounded-lg border transition hover:bg-gray-50",
                step.action === "arrive" ? "bg-green-50 border-green-200" : "bg-white border-gray-100"
              )}
            >
              <div className="mt-1 p-1 bg-gray-100 rounded-full">
                {getIcon(step.action)}
              </div>
              <div>
                <p className="text-gray-800 text-sm font-medium leading-relaxed">
                  {step.text}
                </p>
                {step.distance_m > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Đi tiếp {step.distance_m}m
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}