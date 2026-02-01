export interface MapModel {
  id?: number;
  name: string;
  image_link: string; // URL của ảnh (từ server hoặc blob local)
  floor_number: number;
  scale: number;      // Tỉ lệ (ví dụ: 1px = 0.5 mét)
}

export interface MapNode {
  id: number;
  name: string;
  is_landmark: boolean;
  x: number;
  y: number;
  aliases: string[];
}

export interface MapEdge{
  id: number;
  start_node_id: number; 
  end_node_id: number;   
  type: string;          
  polyline?: { x: number; y: number }[]; 
  weight: GLfloat;
  bidirectional: boolean;
}