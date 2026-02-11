import { useRef, useState, useEffect } from "react";
import { MapData } from "@/shared/types";
import { mapApi } from "../../maps/api/maps"; // Import API đã tách

interface MapOverlayProps {
  onUploadSuccess: (mapData: MapData) => void;
}

export const MapOverlay = ({ onUploadSuccess }: MapOverlayProps) => {
  // --- STATE ---
  const [existingMaps, setExistingMaps] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. FETCH DANH SÁCH MAP KHI MOUNT
  useEffect(() => {
    const loadMaps = async () => {
      try {
        // Gọi API lấy danh sách map (bao gồm cả logic Campus)
        const maps = await mapApi.getAll(); 
        
        // LOGIC TỰ ĐỘNG CHỌN NẾU CHỈ CÓ 1 MAP CAMPUS
        // (Giả sử logic backend trả về list, ta check ở frontend)
        const campusMaps = maps.filter(m => !m.building_id);
        if (campusMaps.length === 1 && maps.length === 1) {
             onUploadSuccess(campusMaps[0]);
             return;
        }
        
        setExistingMaps(maps);
      } catch (error) {
        console.error("Lỗi tải danh sách map:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMaps();
  }, [onUploadSuccess]);

  if (loading) {
      return (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
               <span className="material-symbols-outlined text-4xl animate-spin text-blue-600">progress_activity</span>
          </div>
      );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col p-8 border border-indigo-50 rounded-3xl bg-white shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto text-black">
        
        <h3 className="text-2xl font-extrabold text-slate-800 mb-6 text-center">Quản lý Bản đồ</h3>

        {/* PHẦN 1: LIST MAP CÓ SẴN */}
        {existingMaps.length > 0 && (
            <ExistingMapSection maps={existingMaps} onSelect={onUploadSuccess} />
        )}

        {/* Divider */}
        {existingMaps.length > 0 && <div className="border-t border-slate-200 my-6 relative"><span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-2 text-xs text-slate-400 font-bold uppercase">Hoặc</span></div>}

        {/* PHẦN 2: FORM UPLOAD */}
        <UploadMapForm onSuccess={onUploadSuccess} />
        
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS (Tách ra cho gọn logic)
// ============================================================================

const ExistingMapSection = ({ maps, onSelect }: { maps: MapData[], onSelect: (m: MapData) => void }) => {
    const [selectedId, setSelectedId] = useState<string>(maps[0]?.id.toString() || "");

    const handleSelect = () => {
        const map = maps.find(m => m.id.toString() === selectedId);
        if (map) onSelect(map);
    };

    return (
        <div className="mb-2 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
            <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined">folder_open</span> Mở bản đồ đã lưu
            </h4>
            <div className="flex gap-3">
                <select 
                    value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                    className="flex-1 pl-4 pr-10 py-3 rounded-xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer text-slate-700 font-medium"
                >
                    {maps.map((map) => (
                        <option key={map.id} value={map.id}>
                            {map.name} ({map.building_id ? `Tòa nhà ID: ${map.building_id}` : "Campus"})
                        </option>
                    ))}
                </select>
                <button onClick={handleSelect} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 whitespace-nowrap">
                    Mở Map
                </button>
            </div>
        </div>
    );
};

const UploadMapForm = ({ onSuccess }: { onSuccess: (m: MapData) => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [scale, setScale] = useState<string>("1.0");
    const [floor, setFloor] = useState<string>("");
    const [buildingId, setBuildingId] = useState<string>("");

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!name.trim()) { setError("Vui lòng nhập tên bản đồ."); return; }

        setIsProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("file", file);
            formData.append("scale_ratio", scale.toString());
            if (floor) formData.append("floor_level", floor.toString());
            if (buildingId) formData.append("building_id", buildingId.toString());

            // GỌI API QUA SERVICE
            const newMap = await mapApi.upload(formData);
            onSuccess(newMap);

        } catch (err: any) {
            console.error(err);
            setError("Upload thất bại. Vui lòng thử lại.");
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div>
            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500">add_photo_alternate</span> Tải lên bản đồ mới
            </h4>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tên bản đồ *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="VD: Tầng 1 - Tòa A"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tỉ lệ (Scale)</label>
                        <input type="number" step="0.1" value={scale} onChange={e => setScale(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tầng số</label>
                        <input type="number" value={floor} onChange={e => setFloor(e.target.value)} placeholder="Trống = Chung"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
                    </div>
                </div>

                <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">ID Tòa nhà</label>
                     <input type="number" value={buildingId} onChange={e => setBuildingId(e.target.value)} placeholder="Optional"
                         className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
                </div>

                {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span> {error}</div>}
                
                <button onClick={() => { if(!name.trim()) setError("Nhập tên trước!"); else fileInputRef.current?.click(); }} disabled={isProcessing}
                    className="w-full py-3.5 px-6 font-bold rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-2 disabled:bg-slate-300">
                    {isProcessing ? "Đang xử lý..." : <><span className="material-symbols-outlined">cloud_upload</span> Chọn ảnh & Tải lên</>}
                </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} disabled={isProcessing} />
        </div>
    );
};