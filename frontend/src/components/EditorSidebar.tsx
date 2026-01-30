// src/components/EditorSidebar.tsx
import React from "react";
import { NodeData, EdgeData, EditorMode } from "@/types/editor";
import { Save, Trash2, Plus, ArrowRightLeft } from "lucide-react";

interface SidebarProps {
  mode: EditorMode;
  setMode: (m: EditorMode) => void;
  selectedNode: NodeData | null;
  selectedEdge: EdgeData | null;
  onUpdateNode: (n: NodeData) => void;
  onUpdateEdge: (e: EdgeData) => void;
  onDelete: () => void;
  onSaveAll: () => void;
  isSaving: boolean;
}

export default function EditorSidebar({
  mode, setMode, selectedNode, selectedEdge,
  onUpdateNode, onUpdateEdge, onDelete, onSaveAll, isSaving
}: SidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen flex flex-col p-4 shadow-xl z-20">
      <h1 className="text-xl font-bold mb-4 text-gray-800">Map Editor</h1>

      {/* Toolbar */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("select")}
          className={`flex-1 p-2 rounded text-sm font-medium ${mode === "select" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          Select
        </button>
        <button
          onClick={() => setMode("add_node")}
          className={`flex-1 p-2 rounded text-sm font-medium ${mode === "add_node" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          + Node
        </button>
        <button
          onClick={() => setMode("add_edge")}
          className={`flex-1 p-2 rounded text-sm font-medium ${mode === "add_edge" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          + Edge
        </button>
      </div>

      {/* Properties Panel */}
      <div className="flex-1 overflow-y-auto">
        {selectedNode && (
          <div className="space-y-4 border p-3 rounded bg-blue-50">
            <h3 className="font-semibold text-blue-800">Edit Node</h3>
            <div>
              <label className="text-xs font-bold text-gray-500">Tên địa điểm (cách nhau dấu phẩy)</label>
              <input
                type="text"
                className="w-full border rounded p-2 text-sm mt-1"
                placeholder="VD: Phòng họp, Meeting Room"
                value={selectedNode.aliases}
                onChange={(e) => onUpdateNode({ ...selectedNode, aliases: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="landmark"
                checked={selectedNode.is_landmark}
                onChange={(e) => onUpdateNode({ ...selectedNode, is_landmark: e.target.checked })}
              />
              <label htmlFor="landmark" className="text-sm">Là điểm nổi bật (Landmark)</label>
            </div>
            <div className="text-xs text-gray-400">
              Tọa độ: ({Math.round(selectedNode.x)}, {Math.round(selectedNode.y)})
            </div>
          </div>
        )}

        {selectedEdge && (
          <div className="space-y-4 border p-3 rounded bg-orange-50">
            <h3 className="font-semibold text-orange-800">Edit Edge</h3>
            <div>
              <label className="text-xs font-bold text-gray-500">Loại đường</label>
              <select
                className="w-full border rounded p-2 text-sm mt-1"
                value={selectedEdge.type}
                onChange={(e) => onUpdateEdge({ ...selectedEdge, type: e.target.value as any })}
              >
                <option value="walk">Đi bộ (Walk)</option>
                <option value="stairs">Cầu thang bộ (Stairs)</option>
                <option value="elevator">Thang máy (Elevator)</option>
                <option value="escalator">Thang cuốn (Escalator)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedEdge.bidirectional}
                onChange={(e) => onUpdateEdge({ ...selectedEdge, bidirectional: e.target.checked })}
              />
              <label className="text-sm">Đường 2 chiều</label>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 space-y-2">
        {(selectedNode || selectedEdge) && (
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
          >
            <Trash2 size={16} /> Xóa đang chọn
          </button>
        )}
        
        <button
          onClick={onSaveAll}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition shadow-md disabled:opacity-50"
        >
          <Save size={18} /> {isSaving ? "Đang lưu..." : "LƯU DỮ LIỆU"}
        </button>
      </div>
    </div>
  );
}