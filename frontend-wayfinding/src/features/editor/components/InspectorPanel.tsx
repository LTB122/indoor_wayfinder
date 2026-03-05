import { useState, useEffect } from "react";
import { useEditorStore } from "../stores/editorStores";
import { MapNode, MapEdge } from "@/shared/types";
import { editorApi } from "@/features/editor/api/editorApi";
import { BuildingModal } from "./BuildingModal"; // Đảm bảo đã tạo file này như bài trước

export const InspectorPanel = () => {
  // 1. LẤY STATE TỪ STORE
  const { currentMap, nodes, edges, selectedId, selectedType, isEditing, updateNode, updateEdge, deleteNode, deleteEdge, setEditing } =
    useEditorStore();

  // 2. TÌM ITEM ĐANG CHỌN
  const data = selectedType === "node" ? nodes.find((n) => n.id === selectedId) : edges.find((e) => e.id === selectedId);

  // 3. STATE LOCAL
  const [formData, setFormData] = useState<any>(null);
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);

  // Sync data vào formData khi selection thay đổi
  useEffect(() => {
    if (data) {
      if (formData?.id !== data.id) {
        setFormData({ ...data });
        setEditing(false);
      } else {
        // Sync dữ liệu mới (ví dụ khi kéo thả node) nhưng giữ nguyên các trường đang edit dở nếu cần
        setFormData((prev: any) => ({ ...prev, ...data }));
      }
    } else {
      setFormData(null);
    }
  }, [data, setEditing]);

  // Empty State
  if (!formData || !selectedType) {
    if (!currentMap) return <aside className="w-80 bg-white border-l border-slate-200" />;
    return <EmptyState currentMap={currentMap} />;
  }

  // 4. HANDLERS
  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (selectedType === "node") {
        updateNode(formData.id, formData);
        await editorApi.updateNode(formData.id, formData);
      } else {
        updateEdge(formData.id, formData);
        await editorApi.updateEdge(formData.id, formData);
      }
      setEditing(false);
    } catch (error) {
      alert("Lỗi lưu dữ liệu!");
      setFormData({ ...data }); // Revert
    }
  };

  const handleDelete = async () => {
    if (confirm("Bạn có chắc chắn muốn xóa?")) {
      try {
        if (selectedType === "node") {
          await editorApi.deleteNode(formData.id);
          deleteNode(formData.id);
        } else {
          await editorApi.deleteEdge(formData.id);
          deleteEdge(formData.id);
        }
      } catch (error) {
        alert("Không thể xóa!");
      }
    }
  };

  const handleCancel = () => {
    setFormData({ ...data });
    setEditing(false);
  };

  const toggleEdit = () => {
    if (isEditing) handleSave();
    else setEditing(true);
  };

  const currentBuildingId = (formData as any).building_id || (formData as any).building?.id || null;

  // --- RENDER ---
  return (
    <>
      <aside className="w-80 h-full border-l border-slate-200 bg-white flex flex-col shadow-xl z-20 animate-in slide-in-from-right duration-300">
        {/* HEADER */}
        <PanelHeader
          type={selectedType}
          id={formData.id}
          name={formData.name || formData.type}
          isEditing={isEditing}
          onToggleEdit={toggleEdit}
          onNameChange={(val: any) => handleChange("name", val)}
        />

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {selectedType === "node" ? (
            <NodeForm
              data={formData as MapNode}
              isEditing={isEditing}
              onChange={handleChange}
              onManageBuilding={() => setIsBuildingModalOpen(true)}
            />
          ) : (
            <EdgeForm data={formData as MapEdge} isEditing={isEditing} onChange={handleChange} />
          )}
        </div>

        {/* FOOTER */}
        <PanelFooter isEditing={isEditing} onSave={handleSave} onCancel={handleCancel} onDelete={handleDelete} />
      </aside>

      {/* BUILDING MODAL */}
      {isBuildingModalOpen && formData && selectedType === "node" && (
        <BuildingModal
          nodeId={formData.id}
          initialBuildingId={currentBuildingId}
          onClose={() => setIsBuildingModalOpen(false)}
          onSuccess={() => {
            // Khi save xong, refresh lại data node (để cập nhật thông tin building vừa thêm)
            // Có thể gọi api get node detail lại hoặc update store
            console.log("Building updated for node", formData.id);
            setIsBuildingModalOpen(false);
            // Mẹo: Trigger fetch lại node data nếu cần thiết
          }}
        />
      )}
    </>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const EmptyState = ({ currentMap }: { currentMap: any }) => (
  <aside className="w-80 h-full border-l border-slate-200 bg-white flex flex-col p-0 shadow-xl z-20">
    <div className="h-40 bg-slate-100 relative overflow-hidden">
      <img src={currentMap.image_url} className="w-full h-full object-cover opacity-50 blur-sm" alt="Map Cover" />
      <div className="absolute inset-0 bg-linear-to-t from-white to-transparent"></div>
      <div className="absolute bottom-4 left-6">
        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Current Map</span>
        <h2 className="text-xl font-bold text-slate-800 mt-1 truncate w-64">{currentMap.name}</h2>
      </div>
    </div>
    <div className="p-6 text-center text-slate-400">
      <p className="text-sm">Chọn một đối tượng để xem chi tiết</p>
    </div>
  </aside>
);

const PanelHeader = ({ type, id, name, isEditing, onToggleEdit, onNameChange }: any) => (
  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
    <div className="flex-1 mr-2">
      <span
        className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border mb-2
          ${type === "node" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}
      >
        {type === "node" ? "Location" : "Connection"} <span className="opacity-50 mx-1">|</span> #{id}
      </span>
      {isEditing && type === "node" ? (
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full bg-white px-2 py-1 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 text-lg font-bold text-slate-800"
          autoFocus
          placeholder="Tên địa điểm..."
        />
      ) : (
        <h2 className="text-lg font-bold text-slate-800 leading-tight truncate">{name}</h2>
      )}
    </div>
    <button
      onClick={onToggleEdit}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all 
        ${isEditing ? "bg-green-600 text-white shadow-lg hover:bg-green-700" : "bg-white text-slate-400 border border-slate-200 hover:text-blue-600 hover:border-blue-200"}`}
    >
      <span className="material-symbols-outlined text-lg">{isEditing ? "check" : "edit"}</span>
    </button>
  </div>
);

// --- NODE FORM (ĐÃ SỬA: Thêm phần Building) ---
const NodeForm = ({
  data,
  isEditing,
  onChange,
  onManageBuilding,
}: {
  data: MapNode;
  isEditing: boolean;
  onChange: (f: string, v: any) => void;
  onManageBuilding: () => void;
}) => {
  // Kiểm tra xem node này đã gắn building chưa (Logic giả định: data.building hoặc data.building_id)
  // Bạn cần điều chỉnh logic này tùy vào API trả về cái gì
  const hasBuilding = !!(data as any).building || !!(data as any).building_id;
  const buildingInfo = (data as any).building || { name: "Đã gắn tòa nhà", floor_count: "?" };

  return (
    <>
      {/* 1. Coordinates */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Coordinates</h4>
          {isEditing && <span className="text-[10px] text-blue-600 italic animate-pulse">Kéo thả trên map</span>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-slate-500 font-medium mb-1 block">X</label>
            <div className="font-mono text-sm text-slate-700 font-bold bg-white px-2 py-1.5 rounded border border-slate-200">
              {Math.round(data.x)}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-medium mb-1 block">Y</label>
            <div className="font-mono text-sm text-slate-700 font-bold bg-white px-2 py-1.5 rounded border border-slate-200">
              {Math.round(data.y)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Type */}
      <div>
        <label className="text-xs font-bold text-slate-700 mb-2 block">Loại địa điểm</label>
        <select
          disabled={!isEditing}
          value={data.type}
          onChange={(e) => onChange("type", e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-700 outline-none appearance-none ${
            isEditing ? "bg-white border-slate-300 focus:border-blue-500" : "bg-slate-50 border-transparent cursor-not-allowed"
          }`}
        >
          <option value="path">Điểm trung gian (Path)</option>
          <option value="room">Phòng (Room)</option>
          <option value="stairs">Cầu thang</option>
          <option value="elevator">Thang máy</option>
          <option value="entrance">Cổng ra vào</option>
        </select>
      </div>

      {/* 3. BUILDING MANAGER (NEW SECTION) */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Chi tiết tòa nhà</h4>
          {hasBuilding && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Đã thiết lập</span>}
        </div>

        {hasBuilding ? (
          // A. ĐÃ CÓ BUILDING -> HIỆN CARD GRADIENT
          <div
            onClick={onManageBuilding}
            className="group cursor-pointer relative overflow-hidden rounded-xl bg-linear-to-br from-slate-800 to-slate-900 p-4 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-medium mb-0.5">Thông tin</div>
                <div className="text-lg font-bold leading-tight truncate w-40">{buildingInfo.name || "Building Info"}</div>
                <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">layers</span>
                  Quản lý tầng & map
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined">edit</span>
              </div>
            </div>
            {/* Trang trí nền */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 right-10 w-16 h-16 bg-blue-500/20 rounded-full blur-xl"></div>
          </div>
        ) : (
          // B. CHƯA CÓ BUILDING -> HIỆN NÚT "THÊM" NÉT ĐỨT
          <button
            onClick={onManageBuilding}
            className="group relative w-full py-4 rounded-xl overflow-hidden bg-white border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300"
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">domain_add</span>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-indigo-900">Thiết lập tòa nhà</div>
                <div className="text-[10px] text-indigo-500 font-medium mt-0.5">Thêm tầng & bản đồ chi tiết</div>
              </div>
            </div>
          </button>
        )}
      </div>
    </>
  );
};

// --- EDGE FORM (Giữ nguyên) ---
const EdgeForm = ({ data, isEditing, onChange }: { data: MapEdge; isEditing: boolean; onChange: (f: string, v: any) => void }) => (
  <>
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
      <div className="text-xs text-slate-500">Kết nối</div>
      <div className="text-xs font-bold font-mono text-slate-700">
        #{data.start_node_id} <span className="mx-1 text-slate-400">→</span> #{data.end_node_id}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Weight</label>
        <input
          type="number"
          disabled={!isEditing}
          value={data.weight || 0}
          onChange={(e) => onChange("weight", parseFloat(e.target.value))}
          className={`w-full px-3 py-2 rounded-lg border text-sm font-mono font-bold text-slate-700 outline-none ${
            isEditing ? "bg-white border-slate-300 focus:border-blue-500" : "bg-slate-50 border-transparent"
          }`}
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Type</label>
        <select
          disabled={!isEditing}
          value={data.type}
          onChange={(e) => onChange("type", e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-700 outline-none ${
            isEditing ? "bg-white border-slate-300 focus:border-blue-500" : "bg-slate-50 border-transparent"
          }`}
        >
          <option value="walk">Đi bộ</option>
          <option value="stairs">Thang bộ</option>
          <option value="elevator">Thang máy</option>
        </select>
      </div>
    </div>
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
        isEditing ? "bg-white border-slate-200" : "bg-slate-50 border-transparent"
      }`}
    >
      <span className="text-xs font-bold text-slate-600">Đường 2 chiều</span>
      <input
        type="checkbox"
        disabled={!isEditing}
        checked={data.bidirectional ?? true}
        onChange={(e) => onChange("bidirectional", e.target.checked)}
        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
      />
    </div>
  </>
);

const PanelFooter = ({ isEditing, onSave, onCancel, onDelete }: any) =>
  isEditing ? (
    <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-2 gap-3">
      <button onClick={onCancel} className="py-2.5 rounded-lg text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors">
        Hủy bỏ
      </button>
      <button
        onClick={onSave}
        className="py-2.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-md hover:bg-blue-700 transition-colors"
      >
        Lưu thay đổi
      </button>
    </div>
  ) : (
    <div className="p-4 border-t border-slate-200 bg-slate-50">
      <button
        onClick={onDelete}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-red-600 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 shadow-sm transition-all duration-200 font-bold text-xs"
      >
        <span className="material-symbols-outlined text-sm">delete</span> Xóa đối tượng
      </button>
    </div>
  );