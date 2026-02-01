export interface MapEdge{
  id: number;
  start_node_id: number; 
  end_node_id: number;   
  type: string;          
  polyline?: { x: number; y: number }[]; 
  weight: GLfloat;
  bidirectional: boolean;
}