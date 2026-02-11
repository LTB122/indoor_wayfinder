// src/shared/types/index.ts

export interface Coordinate {
  x: number;
  y: number;
}

export interface MapNode {
  id: number;
  map_id: number;
  x: number;
  y: number;
  name: string;
  type: 'path' | 'room' | 'entrance' | 'stairs' | 'elevator';
  aliases?: string[];
  flags?: {
    wheelchair?: boolean;
    hidden?: boolean;
  };
}

export interface MapEdge {
  id: number;
  start_node_id: number;
  end_node_id: number;
  weight: number;
  type: 'walk' | 'stairs' | 'elevator';
  bidirectional?: boolean;
  polyline?: number[][]; 
}

export interface Building {
    id: number;
    name: string;
    description?: string;
    maps?: MapData[]; 
}

export interface MapData {
  id: number;
  name: string;
  image_url: string; // URL đầy đủ (http://...)
  scale_ratio: number;
  floor_level?: number;
  building_id?: number;
}