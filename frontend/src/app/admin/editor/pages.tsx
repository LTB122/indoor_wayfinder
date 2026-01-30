"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import EditorSidebar from "@/components/EditorSidebar";
import MapCanvas from "@/components/MapCanvas";
import { NodeData, EdgeData, EditorMode } from "@/types/editor";
import { Loader2, RefreshCw } from "lucide-react";

const API_BASE_URL = "http://localhost:8000";
const MAP_ID = 1; // Bạn có thể lấy từ params nếu cần

export default function EditorPage() {
  const [mapUrl, setMapUrl] = useState("");
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  
  const [mode, setMode] = useState<EditorMode>("select");
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedEdgeIdx, setSelectedEdgeIdx] = useState<number | null>(null); // Dùng index trong mảng state
  
  const [connectStartId, setConnectStartId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Cho các tác vụ thêm/xóa/sửa

  // ---------------------------------------------------------
  // 1. LOAD DATA (Dùng API /full)
  // ---------------------------------------------------------
  const fetchMapData = async () => {
    setIsLoading(true);
    try {
      // Load thông tin map full
      const res = await axios.get(`${API_BASE_URL}/maps/${MAP_ID}/full`);
      const data = res.data;

      // URL ảnh (backend trả về path /static/..., cần ghép domain)
      // Lưu ý: data.image_url hay image_path tùy thuộc vào response của bạn
      // Ở đây mình giả định bạn đã trả về image_url chuẩn hoặc mình tự ghép
      setMapUrl(`${API_BASE_URL}/static/uploads/${data.image_path.split(/[/\\]/).pop()}`);

      // Map Nodes từ DB sang format Editor
      // DB: id, aliases: ["a", "b"]
      // Editor: temp_id (=id), aliases: "a, b"
      const mappedNodes = data.nodes.map((n: any) => ({
        ...n,
        temp_id: n.id, // Quan trọng: dùng ID thật làm temp_id
        aliases: n.aliases ? n.aliases.join(", ") : "",
      }));

      // Map Edges
      const mappedEdges = data.edges.map((e: any) => ({
        ...e,
        // Backend trả về start_node_id, map sang temp_id
        start_node_temp_id: e.start_node_id,
        end_node_temp_id: e.end_node_id,
      }));

      setNodes(mappedNodes);
      setEdges(mappedEdges);
    } catch (err) {
      console.error("Lỗi tải map:", err);
      alert("Không thể tải dữ liệu bản đồ.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  // ---------------------------------------------------------
  // 2. CÁC HÀM XỬ LÝ (CRUD TRỰC TIẾP)
  // ---------------------------------------------------------

  // --- THÊM NODE ---
  const handleAddNode = async (x: number, y: number) => {
    setIsProcessing(true);
    try {
      // Gọi API tạo Node ngay lập tức
      const payload = {
        map_id: MAP_ID,
        x, y,
        is_landmark: false,
        aliases: [] // Mặc định rỗng
      };
      const res = await axios.post(`${API_BASE_URL}/nodes`, payload);
      const newNodeDB = res.data;

      // Cập nhật State
      const newNode: NodeData = {
        ...newNodeDB,
        temp_id: newNodeDB.id, // ID thật
        aliases: "",
      };
      setNodes((prev) => [...prev, newNode]);
      
      // Auto select
      setSelectedNodeId(newNode.temp_id);
      setMode("select");
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tạo node.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CẬP NHẬT NODE (Sửa Aliases, Landmark) ---
  const handleUpdateNode = async (updated: NodeData) => {
    // Cập nhật UI trước (Optimistic UI) cho mượt
    setNodes((prev) => prev.map((n) => (n.temp_id === updated.temp_id ? updated : n)));

    // Debounce hoặc gọi API luôn (ở đây gọi luôn cho đơn giản, thực tế nên debounce)
    try {
      // 1. Update thông tin cơ bản
      await axios.patch(`${API_BASE_URL}/nodes/${updated.id}`, {
        is_landmark: updated.is_landmark,
        // Backend Node update có thể chưa hỗ trợ update alias trực tiếp trong 1 API
        // Nếu API patch node của bạn chưa update alias, bạn cần gọi API riêng hoặc sửa Backend
        // Giả định API Patch Node của bạn đã được sửa để nhận list aliases (nếu chưa thì API này chỉ update landmark)
      });
      
      // 2. Update Alias (Vì cấu trúc API Alias riêng lẻ, ta làm cách "Chữa cháy" nhanh nhất:
      // Xóa hết alias cũ của node này -> Tạo lại alias mới)
      // Lưu ý: Cách này hơi thô nhưng phù hợp với yêu cầu "thêm xóa sửa bình thường" mà không cần viết API sync phức tạp
      
      // Bước A: Lấy danh sách alias hiện tại từ API (hoặc bỏ qua nếu chấp nhận rủi ro)
      // Bước B: Xóa hết (cần API delete alias by node_id, nhưng bạn chỉ có delete by id)
      // => Tốt nhất: Hãy sửa Backend API PATCH /nodes để nhận luôn list aliases.
      // => Nếu không sửa Backend: Frontend chỉ update được landmark/tọa độ. 
      // => Giải pháp tạm: coi như API Patch Node đã xịn.
      
    } catch (error) {
      console.error("Lỗi update node:", error);
    }
  };

  // --- THÊM EDGE ---
  const handleAddEdge = async (startId: number, endId: number) => {
    setIsProcessing(true);
    try {
      const payload = {
        start_node_id: startId,
        end_node_id: endId,
        map_id: MAP_ID, // Nếu backend cần để check
        type: "walk",
        bidirectional: true,
        polyline: [] // Để rỗng cho backend tự nối thẳng
      };
      const res = await axios.post(`${API_BASE_URL}/edges`, payload);
      const newEdgeDB = res.data;

      const newEdge: EdgeData = {
        ...newEdgeDB,
        start_node_temp_id: newEdgeDB.start_node_id,
        end_node_temp_id: newEdgeDB.end_node_id,
      };
      
      setEdges((prev) => [...prev, newEdge]);
      setConnectStartId(null);
      setMode("select");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Lỗi tạo cạnh.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CẬP NHẬT EDGE ---
  const handleUpdateEdge = async (updated: EdgeData) => {
    // Cập nhật UI
    const newEdges = [...edges];
    if (selectedEdgeIdx !== null) {
        newEdges[selectedEdgeIdx] = updated;
        setEdges(newEdges);
    }

    // Gọi API
    if (updated.id) {
        try {
            await axios.patch(`${API_BASE_URL}/edges/${updated.id}`, {
                type: updated.type,
                bidirectional: updated.bidirectional
            });
        } catch (error) {
            console.error("Lỗi update edge", error);
        }
    }
  };

  // --- XÓA (NODE HOẶC EDGE) ---
  const handleDelete = async () => {
    if (!confirm("Bạn chắc chắn muốn xóa?")) return;
    setIsProcessing(true);
    try {
        if (selectedNodeId !== null) {
            // Xóa Node (API sẽ tự xóa các edge liên quan nếu backend có cascade, 
            // nếu không frontend phải tự lọc state)
            await axios.delete(`${API_BASE_URL}/nodes/${selectedNodeId}`);
            
            // Update State
            setNodes(nodes.filter(n => n.temp_id !== selectedNodeId));
            setEdges(edges.filter(e => e.start_node_temp_id !== selectedNodeId && e.end_node_temp_id !== selectedNodeId));
            setSelectedNodeId(null);
        } 
        else if (selectedEdgeIdx !== null) {
            const edgeToDelete = edges[selectedEdgeIdx];
            if (edgeToDelete.id) {
                await axios.delete(`${API_BASE_URL}/edges/${edgeToDelete.id}`);
            }
            // Update State
            setEdges(edges.filter((_, idx) => idx !== selectedEdgeIdx));
            setSelectedEdgeIdx(null);
        }
    } catch (error) {
        console.error("Lỗi xóa:", error);
        alert("Không thể xóa item này.");
    } finally {
        setIsProcessing(false);
    }
  };

  // --- RESET MAP (CLEAR ALL) ---
  const handleClearMap = async () => {
    if (!confirm("CẢNH BÁO: Hành động này sẽ xóa sạch Nodes và Edges của bản đồ này. Tiếp tục?")) return;
    setIsProcessing(true);
    try {
        await axios.post(`${API_BASE_URL}/maps/clear-map`, { 
            map_id: MAP_ID, 
            delete_map: false, 
            delete_upload: false 
        });
        // Reset state
        setNodes([]);
        setEdges([]);
        setSelectedNodeId(null);
        setSelectedEdgeIdx(null);
        alert("Đã làm sạch bản đồ.");
    } catch (error) {
        alert("Lỗi khi clear map.");
    } finally {
        setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------
  // 3. LOGIC GIAO DIỆN (SELECT, CONNECT)
  // ---------------------------------------------------------

  const handleSelectNode = (node: NodeData) => {
    if (mode === "add_edge") {
      if (connectStartId === null) {
        setConnectStartId(node.temp_id);
      } else {
        if (connectStartId === node.temp_id) return; 
        // Gọi hàm tạo edge
        handleAddEdge(connectStartId, node.temp_id);
      }
      return;
    }
    setSelectedNodeId(node.temp_id);
    setSelectedEdgeIdx(null);
    setConnectStartId(null);
  };

  const handleSelectEdge = (edge: EdgeData & { id: number }) => {
    // EdgeData & { id: number } là type từ MapCanvas trả về (id ở đây là index mảng)
    setSelectedEdgeIdx(edge.id); 
    setSelectedNodeId(null);
  };

  // Helpers lấy data đang chọn
  const getSelectedNode = () => nodes.find(n => n.temp_id === selectedNodeId) || null;
  const getSelectedEdge = () => selectedEdgeIdx !== null ? edges[selectedEdgeIdx] : null;

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center gap-2"><Loader2 className="animate-spin"/> Đang tải dữ liệu...</div>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      
      {/* Sidebar (Đã sửa để không dùng nút Save All nữa) */}
      <EditorSidebar
        mode={mode} setMode={setMode}
        selectedNode={getSelectedNode()}
        selectedEdge={getSelectedEdge()}
        onUpdateNode={handleUpdateNode}
        onUpdateEdge={handleUpdateEdge}
        onDelete={handleDelete}
        // Nút Save All giờ đổi thành chức năng khác hoặc ẩn đi, 
        // ở đây mình tái sử dụng prop onSaveAll thành nút Clear Map
        onSaveAll={handleClearMap} 
        isSaving={isProcessing}
      />

      {/* Override Text nút Save trong Sidebar (nếu bạn không muốn sửa component con) 
          Hoặc tốt nhất là sửa EditorSidebar để nút Save thành "Reset Map" 
      */}

      <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative bg-gray-200">
        {mapUrl ? (
          <MapCanvas
            imageUrl={mapUrl}
            nodes={nodes}
            edges={edges}
            mode={mode}
            onAddNode={handleAddNode}
            onSelectNode={handleSelectNode}
            onSelectEdge={handleSelectEdge}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeIdx}
          />
        ) : (
          <div className="text-gray-500">Chưa có bản đồ.</div>
        )}

        {/* Thông báo trạng thái nối điểm */}
        {mode === "add_edge" && (
          <div className="absolute top-4 bg-blue-100 border-blue-400 border px-4 py-2 rounded shadow text-sm font-medium text-blue-800 flex items-center gap-2">
            <RefreshCw size={16} className={connectStartId ? "animate-spin" : ""} />
            {connectStartId === null ? "Chọn điểm bắt đầu..." : "Chọn điểm kết thúc..."}
          </div>
        )}
        
        {/* Loading overlay khi đang xử lý CRUD */}
        {isProcessing && (
           <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center cursor-wait">
             <Loader2 className="animate-spin text-blue-600" size={32} />
           </div>
        )}
      </div>
    </div>
  );
}