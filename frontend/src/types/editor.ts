// src/types/editor.ts
export interface NodeData {
  id?: number; // Có thể null nếu là node mới chưa lưu
  x: number;
  y: number;
  is_landmark: boolean;
  aliases: string; // Chuỗi nhập vào: "Phòng A, Căn tin"
  temp_id: number; // ID tạm để xử lý ở frontend
}

export interface EdgeData {
  id?: number;
  start_node_temp_id: number;
  end_node_temp_id: number;
  type: "walk" | "stairs" | "elevator" | "escalator";
  bidirectional: boolean;
}

export type EditorMode = "select" | "add_node" | "add_edge";