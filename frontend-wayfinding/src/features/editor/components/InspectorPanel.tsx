import { useState, useEffect } from 'react';
import { useEditorStore } from '../stores/editorStores';
import { MapNode, MapEdge } from '@/shared/types'; // Nhớ import đúng type

export const InspectorPanel = () => {
  // 1. LẤY STATE TỪ STORE
  const { 
    currentMap, nodes, edges, selectedId, selectedType, isEditing,
    updateNode, updateEdge, deleteNode, deleteEdge, setEditing 
  } = useEditorStore();

  // 2. TÌM ITEM ĐANG CHỌN
  // Memoize hoặc lấy trực tiếp đều được vì Store đã tối ưu
  const data = selectedType === 'node' 
    ? nodes.find(n => n.id === selectedId)
    : edges.find(e => e.id === selectedId);

  // 3. STATE LOCAL CHO FORM
  // Dùng state này để lưu giá trị đang nhập liệu trước khi save (hoặc auto-save)
  const [formData, setFormData] = useState<any>(null);

  // Sync data vào formData khi selection thay đổi
  useEffect(() => {
    if (data) {
        // Nếu ID thay đổi (chọn node khác) -> Reset form và tắt Edit
        if (formData?.id !== data.id) {
             setFormData({ ...data });
             setEditing(false);
        } else {
             // Nếu cùng ID (đang chỉnh sửa hoặc đang kéo thả) -> Chỉ cập nhật data mới (ví dụ tọa độ)
             // Giữ nguyên các trường đang nhập dở nếu cần, ở đây mình ưu tiên sync từ store
             setFormData((prev: any) => ({ ...prev, ...data }));
        }
    } else {
        setFormData(null);
    }
  }, [data, setEditing]);

  // Nếu không có data (chưa chọn gì hoặc data bị xóa), hiện Empty State
  if (!formData || !selectedType) {
    if (!currentMap) return <aside className="w-80 bg-white border-l border-slate-200" />;
    return <EmptyState currentMap={currentMap} />;
  }

  // 4. HANDLERS
  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (selectedType === 'node') updateNode(formData.id, formData);
    else updateEdge(formData.id, formData);
    setEditing(false);
  };

  const handleCancel = () => {
    setFormData({ ...data }); // Revert về data gốc từ store
    setEditing(false);
  };

  const handleDelete = () => {
    if (confirm("Bạn có chắc chắn muốn xóa đối tượng này?")) {
      if (selectedType === 'node') deleteNode(formData.id);
      else deleteEdge(formData.id);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleSave(); // Nếu đang sửa mà bấm nút này -> Save
    } else {
      setEditing(true); // Bật chế độ sửa
    }
  };

  // --- RENDER ---
  return (
    <aside className="w-80 h-full border-l border-slate-200 bg-white flex flex-col shadow-xl z-20 animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <PanelHeader 
        type={selectedType} 
        id={formData.id} 
        name={formData.name || formData.type} 
        isEditing={isEditing}
        onToggleEdit={toggleEdit}
        onNameChange={(val: any) => handleChange('name', val)}
      />

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {selectedType === 'node' ? (
          <NodeForm 
            data={formData as MapNode} 
            isEditing={isEditing} 
            onChange={handleChange} 
          />
        ) : (
          <EdgeForm 
            data={formData as MapEdge} 
            isEditing={isEditing} 
            onChange={handleChange} 
          />
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <PanelFooter 
        isEditing={isEditing} 
        onSave={handleSave} 
        onCancel={handleCancel} 
        onDelete={handleDelete} 
      />
    </aside>
  );
};

// ============================================================================
// SUB-COMPONENTS (Tách ra cho gọn)
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
      <span className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border mb-2
          ${type === 'node' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
          {type === "node" ? "Location" : "Connection"} <span className="opacity-50 mx-1">|</span> #{id}
      </span>
      {isEditing && type === 'node' ? (
          <input 
              type="text" value={name} onChange={(e) => onNameChange(e.target.value)}
              className="w-full bg-white px-2 py-1 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 text-lg font-bold text-slate-800"
              autoFocus placeholder="Tên địa điểm..."
          />
      ) : (
          <h2 className="text-lg font-bold text-slate-800 leading-tight truncate">{name}</h2>
      )}
    </div>
    <button onClick={onToggleEdit} className={`flex items-center justify-center w-8 h-8 rounded-full transition-all 
        ${isEditing ? "bg-green-600 text-white shadow-lg hover:bg-green-700" : "bg-white text-slate-400 border border-slate-200 hover:text-blue-600 hover:border-blue-200"}`}>
        <span className="material-symbols-outlined text-lg">{isEditing ? "check" : "edit"}</span>
    </button>
  </div>
);

const NodeForm = ({ data, isEditing, onChange }: { data: MapNode, isEditing: boolean, onChange: (f: string, v: any) => void }) => (
  <>
    {/* Coordinates */}
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex justify-between items-center mb-3">
            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Coordinates</h4>
            {isEditing && <span className="text-[10px] text-blue-600 italic animate-pulse">Kéo thả trên map</span>}
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] text-slate-500 font-medium mb-1 block">X</label><div className="font-mono text-sm text-slate-700 font-bold bg-white px-2 py-1.5 rounded border border-slate-200">{Math.round(data.x)}</div></div>
            <div><label className="text-[10px] text-slate-500 font-medium mb-1 block">Y</label><div className="font-mono text-sm text-slate-700 font-bold bg-white px-2 py-1.5 rounded border border-slate-200">{Math.round(data.y)}</div></div>
        </div>
    </div>
    {/* Type */}
    <div>
        <label className="text-xs font-bold text-slate-700 mb-2 block">Loại địa điểm</label>
        <select disabled={!isEditing} value={data.type} onChange={(e) => onChange("type", e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-700 outline-none appearance-none ${isEditing ? "bg-white border-slate-300 focus:border-blue-500" : "bg-slate-50 border-transparent cursor-not-allowed"}`}>
            <option value="path">Điểm trung gian (Path)</option>
            <option value="room">Phòng (Room)</option>
            <option value="stairs">Cầu thang</option>
            <option value="elevator">Thang máy</option>
            <option value="entrance">Cổng ra vào</option>
        </select>
    </div>
  </>
);

const EdgeForm = ({ data, isEditing, onChange }: { data: MapEdge, isEditing: boolean, onChange: (f: string, v: any) => void }) => (
  <>
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
        <div className="text-xs text-slate-500">Kết nối</div>
        <div className="text-xs font-bold font-mono text-slate-700">#{data.start_node_id} <span className="mx-1 text-slate-400">→</span> #{data.end_node_id}</div>
    </div>
    <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Weight</label>
            <input type="number" disabled={!isEditing} value={data.weight || 0} onChange={(e) => onChange("weight", parseFloat(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg border text-sm font-mono font-bold text-slate-700 outline-none ${isEditing ? "bg-white border-slate-300 focus:border-blue-500" : "bg-slate-50 border-transparent"}`} />
        </div>
        <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Type</label>
            <select disabled={!isEditing} value={data.type} onChange={(e) => onChange("type", e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-700 outline-none ${isEditing ? "bg-white border-slate-300 focus:border-blue-500" : "bg-slate-50 border-transparent"}`}>
                <option value="walk">Đi bộ</option>
                <option value="stairs">Thang bộ</option>
                <option value="elevator">Thang máy</option>
            </select>
        </div>
    </div>
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isEditing ? "bg-white border-slate-200" : "bg-slate-50 border-transparent"}`}>
        <span className="text-xs font-bold text-slate-600">Đường 2 chiều</span>
        <input type="checkbox" disabled={!isEditing} checked={data.bidirectional ?? true} onChange={(e) => onChange("bidirectional", e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
    </div>
  </>
);

const PanelFooter = ({ isEditing, onSave, onCancel, onDelete }: any) => (
  isEditing ? (
      <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="py-2.5 rounded-lg text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors">Hủy bỏ</button>
          <button onClick={onSave} className="py-2.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-md hover:bg-blue-700 transition-colors">Lưu thay đổi</button>
      </div>
  ) : (
      <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onDelete} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-red-600 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 shadow-sm transition-all duration-200 font-bold text-xs">
              <span className="material-symbols-outlined text-sm">delete</span> Xóa đối tượng
          </button>
      </div>
  )
);