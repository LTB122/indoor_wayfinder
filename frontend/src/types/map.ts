// src/types/map.ts

export interface Instruction {
  step: number;
  text: string;
  action: "start" | "straight" | "turn_left" | "turn_right" | "slight_left" | "slight_right" | "enter_elevator" | "use_elevator" | "enter_stairs" | "use_stairs" | "arrive";
  distance_m: number;
  coordinate: [number, number];
}

export interface RouteResponse {
  map_id: number;
  path_coords: number[][]; // [[x, y], [x, y], ...]
  total_distance_m: number;
  instructions: Instruction[];
}

export interface MapData {
  id: number;
  name: string;
  image_url: string; // URL ảnh từ backend (ví dụ: http://localhost:8000/static/uploads/...)
  width?: number;
  height?: number;
}