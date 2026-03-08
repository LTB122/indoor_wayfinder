'use client';

import { useState, useEffect, useRef } from 'react';
import { wayfindingApi } from '@/features/wayfinding/api/wayfindingApi';
import { mapApi } from './api/mapApi';
import { buildingApi } from '@/features/editor/api/buildingApi';
import { RouteResponse, MapData, MapNode, MapEdge, Building } from '@/shared/types';
import { LocationDropdown } from './components/LocationDropdown';
import { getFullImageUrl } from '@/shared/api/client';

const ACTION_ICONS: Record<string, string> = {
  start: 'trip_origin',
  straight: 'straight',
  slight_left: 'turn_slight_left',
  slight_right: 'turn_slight_right',
  turn_left: 'turn_left',
  turn_right: 'turn_right',
  use_elevator: 'elevator',
  use_stairs: 'stairs',
  enter_elevator: 'elevator',
  enter_stairs: 'stairs',
  arrive: 'flag',
};

const NODE_COLORS: Record<string, string> = {
  path: '#6b7280',
  room: '#8b5cf6',
  entrance: '#22c55e',
  stairs: '#f59e0b',
  elevator: '#3b82f6',
};

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

interface FloorMap {
  map: MapData;
  nodes: MapNode[];
  edges: MapEdge[];
  isCampus?: boolean;
}

interface FloorSegment {
  floorIndex: number;
  pathCoords: number[][];
  instructions: any[];
}

export default function NavigationPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [floorMaps, setFloorMaps] = useState<FloorMap[]>([]);
  const [currentFloorIndex, setCurrentFloorIndex] = useState(0);
  const [currentMap, setCurrentMap] = useState<MapData | null>(null);
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [allNodes, setAllNodes] = useState<MapNode[]>([]);
  const [allEdges, setAllEdges] = useState<MapEdge[]>([]);
  const [startLocation, setStartLocation] = useState('');
  const [startNodeId, setStartNodeId] = useState<number | undefined>();
  const [endLocation, setEndLocation] = useState('');
  const [endNodeId, setEndNodeId] = useState<number | undefined>();
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [floorSegments, setFloorSegments] = useState<FloorSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const data = await buildingApi.getAll();
        setBuildings(data);
        if (data.length > 0) {
          setSelectedBuildingId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load buildings:', err);
      }
    };
    loadBuildings();
  }, []);

  useEffect(() => {
    const loadMaps = async () => {
      if (!selectedBuildingId) return;
      try {
        setMapLoading(true);

        // Always load campus map first
        const campusData = await mapApi.getMapWithData(1);
        const campusFloor: FloorMap = {
          map: campusData.map,
          nodes: campusData.nodes,
          edges: campusData.edges,
          isCampus: true,
        };

        // Then load building floors
        const maps = await mapApi.getMapsByBuilding(selectedBuildingId);
        
        const floorData: FloorMap[] = await Promise.all(
          maps.map(async (m) => {
            const data = await mapApi.getMapWithData(m.id);
            return {
              map: data.map,
              nodes: data.nodes,
              edges: data.edges,
            };
          })
        );

        // Sort building floors by floor level
        floorData.sort((a, b) => (a.map.floor_level || 0) - (b.map.floor_level || 0));

        // Combine: campus first, then building floors
        const allFloors = [campusFloor, ...floorData];
        setFloorMaps(allFloors);
        
        // Default to campus (index 0)
        setCurrentFloorIndex(0);
        setCurrentMap(allFloors[0].map);
        setNodes(allFloors[0].nodes);
        setEdges(allFloors[0].edges);

        const allNodesCombined = allFloors.flatMap(f => f.nodes);
        const allEdgesCombined = allFloors.flatMap(f => f.edges);
        setAllNodes(allNodesCombined);
        setAllEdges(allEdgesCombined);
      } catch (err) {
        console.error('Failed to load maps:', err);
      } finally {
        setMapLoading(false);
      }
    };
    loadMaps();
  }, [selectedBuildingId]);

  useEffect(() => {
    if (floorMaps.length > 0 && currentFloorIndex < floorMaps.length) {
      setCurrentMap(floorMaps[currentFloorIndex].map);
      setNodes(floorMaps[currentFloorIndex].nodes);
      setEdges(floorMaps[currentFloorIndex].edges);
    }
  }, [currentFloorIndex, floorMaps]);

  useEffect(() => {
    if (currentMap && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setPosition({
        x: (rect.width - MAP_WIDTH) / 2,
        y: (rect.height - MAP_HEIGHT) / 2,
      });
    }
  }, [currentMap]);

  const handleFindRoute = async () => {
    if (!startNodeId || !endNodeId) {
      setError('Please select both start and destination');
      return;
    }

    // Use campus map (map_id=1) for routing to support campus -> building routes
    const mapId = 1;

    setLoading(true);
    setError('');

    try {
      const result = await wayfindingApi.findRoute({
        map_id: mapId,
        start_node_id: startNodeId,
        end_node_id: endNodeId,
      });
      setRoute(result);

      // Parse route into floor segments
      const segments: FloorSegment[] = [];
      let currentSegment: FloorSegment | null = null;
      let currentFloorIdx = -1;

      for (let i = 0; i < result.path_coords.length; i++) {
        const coord = result.path_coords[i];
        
        let nodeMatch = null;
        let newFloorIdx = currentFloorIdx;

        // Ưu tiên tìm node ở TẦNG HIỆN TẠI trước để tránh bị trùng tọa độ ảo
        if (currentFloorIdx !== -1 && floorMaps[currentFloorIdx]) {
           const currentMapId = floorMaps[currentFloorIdx].map.id;
           nodeMatch = allNodes.find(n => 
             n.map_id === currentMapId && 
             Math.abs(n.x - coord[0]) < 1 && 
             Math.abs(n.y - coord[1]) < 1
           );
        }

        // Nếu không có ở tầng hiện tại (có thể là điểm polyline, hoặc đã đi đến thang máy chuyển tầng)
        if (!nodeMatch) {
           nodeMatch = allNodes.find(n => Math.abs(n.x - coord[0]) < 1 && Math.abs(n.y - coord[1]) < 1);
           if (nodeMatch) {
              // Tìm thấy node ở tầng khác -> Xác nhận đây là điểm chuyển tầng!
              newFloorIdx = floorMaps.findIndex(f => f.map.id === nodeMatch!.map_id);
           }
        }

        // Khởi tạo đoạn đầu tiên HOẶC tạo đoạn mới khi xác nhận chuyển tầng
        if (!currentSegment || newFloorIdx !== currentFloorIdx) {
          currentFloorIdx = newFloorIdx !== -1 ? newFloorIdx : currentFloorIdx;
          
          currentSegment = {
            floorIndex: currentFloorIdx,
            pathCoords: [coord], // Điểm bắt đầu của tầng mới
            instructions: [],
          };
          segments.push(currentSegment);
        } else {
          // Cùng tầng thì nối tiếp nét vẽ (sẽ không bị dư đường nối khác tầng nữa)
          currentSegment.pathCoords.push(coord);
        }
      }

      if (currentSegment) {
        segments.push(currentSegment);
      }

      for (const instr of result.instructions) {
        const coord = instr.coordinate;
        const node = allNodes.find(n => 
          Math.abs(n.x - coord[0]) < 1 && Math.abs(n.y - coord[1]) < 1
        );
        
        if (!node) continue;
        
        const floorIdx = floorMaps.findIndex(f => f.map.id === node.map_id);
        if (floorIdx === -1) continue;

        if (floorIdx !== currentFloorIdx) {
          currentFloorIdx = floorIdx;
          const seg = segments.find(s => s.floorIndex === floorIdx);
          if (seg) {
            seg.instructions.push(instr);
          }
        }
      }

      setFloorSegments(segments);

      // Auto-switch to starting floor
      if (segments.length > 0) {
        setCurrentFloorIndex(segments[0].floorIndex);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Could not find route. Please try different locations.';
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFloorSwitch = (floorIndex: number) => {
    setCurrentFloorIndex(floorIndex);
  };

  const handleSwap = () => {
    const tempLocation = startLocation;
    const tempNodeId = startNodeId;
    setStartLocation(endLocation);
    setStartNodeId(endNodeId);
    setEndLocation(tempLocation);
    setEndNodeId(tempNodeId);
  };

  // Map pan/zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(Math.max(s * delta, 0.5), 3));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setPosition((p) => ({ x: p.x + dx, y: p.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Get polyline string for edge
  const getEdgePolyline = (edge: MapEdge) => {
    const startNode = nodes.find((n) => n.id === edge.start_node_id);
    const endNode = nodes.find((n) => n.id === edge.end_node_id);
    if (!startNode || !endNode) return '';

    let points = `${startNode.x},${startNode.y}`;
    
    if (edge.polyline && edge.polyline.length > 0) {
      edge.polyline.forEach((p) => {
        if (Array.isArray(p) && p.length >= 2) {
          points += ` ${p[0]},${p[1]}`;
        }
      });
    }
    
    points += ` ${endNode.x},${endNode.y}`;
    return points;
  };

  const getFloorName = (index: number) => {
    const map = floorMaps[index]?.map;
    if (!map) return '';
    return map.floor_level !== null && map.floor_level !== undefined 
      ? (map.floor_level >= 0 ? `Tầng ${map.floor_level}` : `B${Math.abs(map.floor_level)}`)
      : map.name;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200 bg-white px-6 py-3 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white">map</span>
          </div>
          <h2 className="text-gray-900 text-lg font-bold leading-tight">
            {currentMap?.name || 'Campus Pathfinding'}
          </h2>
          
          {/* Building Selector */}
          <select
            value={selectedBuildingId || ''}
            onChange={(e) => setSelectedBuildingId(Number(e.target.value))}
            className="ml-4 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <div className="hidden md:flex items-center gap-9">
            <a className="text-gray-600 text-sm font-medium hover:text-blue-600 transition-colors" href="#">Map</a>
            <a className="text-gray-600 text-sm font-medium hover:text-blue-600 transition-colors" href="#">Buildings</a>
            <a className="text-gray-600 text-sm font-medium hover:text-blue-600 transition-colors" href="#">Schedules</a>
            <a className="text-gray-600 text-sm font-medium hover:text-blue-600 transition-colors" href="#">Settings</a>
          </div>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-blue-600 bg-gray-200">
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-105 border-r border-gray-200 flex flex-col bg-white overflow-y-visible z-10 shadow-lg relative">
          <div className="p-4 space-y-4">
            {/* Search */}
            <div className="flex flex-col gap-2">
              <LocationDropdown
                value={startLocation}
                onChange={(val, nodeId) => {
                  setStartLocation(val);
                  setStartNodeId(nodeId);
                }}
                placeholder="Start location..."
                icon="origin"
                mapIds={floorMaps.map(fm => fm.map.id)}
              />
              
              <div className="flex justify-center -my-2 relative z-10">
                <button 
                  onClick={handleSwap}
                  className="bg-blue-600 p-1 rounded-full text-white shadow-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="material-symbols-outlined">swap_vert</span>
                </button>
              </div>
              
              <LocationDropdown
                value={endLocation}
                onChange={(val, nodeId) => {
                  setEndLocation(val);
                  setEndNodeId(nodeId);
                }}
                placeholder="Destination..."
                icon="destination"
                mapIds={floorMaps.map(fm => fm.map.id)}
              />
            </div>

            {/* Find Route Button */}
            <button
              onClick={handleFindRoute}
              disabled={loading || !startNodeId || !endNodeId}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Finding route...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">navigation</span>
                  Find Route
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <hr className="border-gray-200 my-2" />

            {/* Directions */}
            {route && (
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-2 pb-4">
                  <h3 className="text-gray-900 text-lg font-bold leading-tight">Directions</h3>
                  <span className="text-xs text-gray-500">Est. {Math.ceil(route.total_distance_m / 80)} mins • {Math.round(route.total_distance_m)}m</span>
                </div>
                <div className="space-y-1">
                  {route.instructions.map((instruction, idx) => (
                    <div 
                      key={idx}
                      className={`flex gap-4 p-3 rounded-lg ${
                        instruction.action === 'start' || instruction.action === 'arrive'
                          ? 'bg-blue-50 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      } transition-colors`}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full ${
                          instruction.action === 'start' || instruction.action === 'arrive'
                            ? 'bg-blue-100'
                            : 'bg-gray-100'
                        }`}>
                          <span className={`material-symbols-outlined ${
                            instruction.action === 'start' || instruction.action === 'arrive'
                              ? 'text-blue-600'
                              : 'text-gray-500'
                          }`}>
                            {ACTION_ICONS[instruction.action] || 'straight'}
                          </span>
                        </div>
                        {idx < route.instructions.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-gray-900 text-sm font-medium">{instruction.text}</p>
                        {instruction.distance_m > 0 && (
                          <p className="text-gray-500 text-xs">{instruction.distance_m}m</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!route && !loading && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">directions</span>
                <p className="text-gray-500 text-sm">Enter start and destination to find a route</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="mt-auto p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-around text-gray-500">
              <button className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors">
                <span className="material-symbols-outlined">directions_walk</span>
                <span className="text-[10px]">Walk</span>
              </button>
              <button className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors">
                <span className="material-symbols-outlined">accessible</span>
                <span className="text-[10px]">Accessible</span>
              </button>
              <button className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors">
                <span className="material-symbols-outlined">share</span>
                <span className="text-[10px]">Share</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Map Area */}
        <main className="flex-1 relative bg-gray-200">
          {/* Floor Selector Tabs */}
          {floorMaps.length > 1 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              {floorMaps.map((fm, idx) => (
                <button
                  key={fm.map.id}
                  onClick={() => setCurrentFloorIndex(idx)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    currentFloorIndex === idx
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {fm.map.floor_level !== null && fm.map.floor_level !== undefined 
                    ? (fm.map.floor_level >= 0 ? `Tầng ${fm.map.floor_level}` : `B${Math.abs(fm.map.floor_level)}`)
                    : fm.map.name}
                </button>
              ))}
            </div>
          )}

          {mapLoading ? (
            <div className="flex items-center justify-center h-full">
              <span className="material-symbols-outlined text-4xl animate-spin text-gray-400">sync</span>
            </div>
          ) : floorMaps.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <span className="material-symbols-outlined text-6xl mb-4">domain</span>
                <p>No buildings found. Please create a building first.</p>
              </div>
            </div>
          ) : (
            <svg
              ref={svgRef}
              className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <g
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: '0 0',
                }}
              >
                {/* Background Map Image */}
                {currentMap && (
                  <image
                    href={getFullImageUrl(currentMap.image_url)}
                    x="0"
                    y="0"
                    width={MAP_WIDTH}
                    height={MAP_HEIGHT}
                    preserveAspectRatio="xMidYMid meet"
                    className="opacity-90"
                  />
                )}

                {/* Edges */}
                {edges.map((edge) => (
                  <polyline
                    key={edge.id}
                    points={getEdgePolyline(edge)}
                    fill="none"
                    stroke="#94a3b8" 
                    strokeWidth="2"
                  />
                ))}

                {/* 1. Chỉ vẽ Route Path của tầng/map hiện tại */}
                {route && floorSegments.filter(seg => seg.floorIndex === currentFloorIndex).map((segment, idx) => (
                  <path
                    key={`route-seg-${idx}`}
                    d={segment.pathCoords.map((coord, i) => 
                      `${i === 0 ? 'M' : 'L'} ${coord[0]},${coord[1]}`
                    ).join(' ')}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-lg"
                  />
                ))}

                {/* Nodes (Giữ nguyên của bạn) */}
                {nodes.map((node) => (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.type === 'room' ? 12 : 8}
                      fill={NODE_COLORS[node.type] || NODE_COLORS.path}
                      stroke="white"
                      strokeWidth={2}
                    />
                    {node.name && (
                      <text
                        x={node.x}
                        y={node.y - 15}
                        textAnchor="middle"
                        fill="#1f2937"
                        fontSize="10"
                        fontWeight="500"
                      >
                        {node.name}
                      </text>
                    )}
                  </g>
                ))}

                {/* 2. Start/End Markers - Chỉ hiển thị khi đang ở đúng tầng của điểm đó */}
                {route && floorSegments.length > 0 && (
                  <>
                    {/* Nút START (Chỉ vẽ nếu đoạn đường đầu tiên nằm ở tầng hiện tại) */}
                    {floorSegments[0].floorIndex === currentFloorIndex && (
                      <g>
                        <circle cx={floorSegments[0].pathCoords[0][0]} cy={floorSegments[0].pathCoords[0][1]} r="14" fill="#2563eb" />
                        <circle cx={floorSegments[0].pathCoords[0][0]} cy={floorSegments[0].pathCoords[0][1]} r="8" fill="white" />
                        <text x={floorSegments[0].pathCoords[0][0] + 20} y={floorSegments[0].pathCoords[0][1] + 5} fill="#1e40af" fontSize="12" fontWeight="bold">
                          BẮT ĐẦU
                        </text>
                      </g>
                    )}

                    {/* Nút END (Chỉ vẽ nếu đoạn đường cuối cùng nằm ở tầng hiện tại) */}
                    {floorSegments[floorSegments.length - 1].floorIndex === currentFloorIndex && (
                      <g>
                        <circle 
                          cx={floorSegments[floorSegments.length - 1].pathCoords[floorSegments[floorSegments.length - 1].pathCoords.length - 1][0]} 
                          cy={floorSegments[floorSegments.length - 1].pathCoords[floorSegments[floorSegments.length - 1].pathCoords.length - 1][1]} 
                          r="14" fill="#dc2626" 
                        />
                        <circle 
                          cx={floorSegments[floorSegments.length - 1].pathCoords[floorSegments[floorSegments.length - 1].pathCoords.length - 1][0]} 
                          cy={floorSegments[floorSegments.length - 1].pathCoords[floorSegments[floorSegments.length - 1].pathCoords.length - 1][1]} 
                          r="8" fill="white" 
                        />
                        <text 
                          x={floorSegments[floorSegments.length - 1].pathCoords[floorSegments[floorSegments.length - 1].pathCoords.length - 1][0] + 20} 
                          y={floorSegments[floorSegments.length - 1].pathCoords[floorSegments[floorSegments.length - 1].pathCoords.length - 1][1] + 5} 
                          fill="#991b1b" fontSize="12" fontWeight="bold"
                        >
                          ĐÍCH ĐẾN
                        </text>
                      </g>
                    )}
                  </>
                )}

                {/* 3. TRANSITION MARKERS (Các nút bấm chuyển tầng/map) */}
                {route && floorSegments.map((seg, i) => {
                  const isCurrentFloor = seg.floorIndex === currentFloorIndex;
                  const hasNext = i < floorSegments.length - 1;
                  const hasPrev = i > 0;
                  const elements = [];

                  // A. Điểm lên tầng tiếp theo (Nằm ở CUỐI đoạn đường của tầng hiện tại)
                  if (isCurrentFloor && hasNext) {
                    const nextSeg = floorSegments[i + 1];
                    const endCoord = seg.pathCoords[seg.pathCoords.length - 1];
                    const nextFloorName = getFloorName(nextSeg.floorIndex);

                    elements.push(
                      <g 
                        key={`to-next-${i}`} 
                        onClick={(e) => { e.stopPropagation(); handleFloorSwitch(nextSeg.floorIndex); }}
                        className="cursor-pointer group"
                      >
                        <circle cx={endCoord[0]} cy={endCoord[1]} r="16" fill="#f59e0b" className="group-hover:fill-amber-600 transition-colors" />
                        {/* Biểu tượng mũi tên đi lên/tiếp tục */}
                        <path d={`M${endCoord[0]-5},${endCoord[1]+2} L${endCoord[0]},${endCoord[1]-4} L${endCoord[0]+5},${endCoord[1]+2}`} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        
                        {/* Hộp nền cho chữ dễ đọc hơn */}
                        <rect x={endCoord[0] + 20} y={endCoord[1] - 12} width="120" height="24" rx="4" fill="white" fillOpacity="0.8" className="shadow-sm" />
                        <text x={endCoord[0] + 25} y={endCoord[1] + 4} fill="#b45309" fontSize="12" fontWeight="bold">
                          Tiếp: {nextFloorName} ➡️
                        </text>
                      </g>
                    );
                  }

                  // B. Điểm quay lại tầng trước (Nằm ở ĐẦU đoạn đường của tầng hiện tại)
                  if (isCurrentFloor && hasPrev) {
                    const prevSeg = floorSegments[i - 1];
                    const startCoord = seg.pathCoords[0];
                    const prevFloorName = getFloorName(prevSeg.floorIndex);

                    elements.push(
                      <g 
                        key={`to-prev-${i}`} 
                        onClick={(e) => { e.stopPropagation(); handleFloorSwitch(prevSeg.floorIndex); }}
                        className="cursor-pointer group"
                      >
                        <circle cx={startCoord[0]} cy={startCoord[1]} r="16" fill="#64748b" className="group-hover:fill-slate-700 transition-colors" />
                        {/* Biểu tượng mũi tên đi xuống/quay lại */}
                        <path d={`M${startCoord[0]-5},${startCoord[1]-2} L${startCoord[0]},${startCoord[1]+4} L${startCoord[0]+5},${startCoord[1]-2}`} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        
                        <rect x={startCoord[0] + 20} y={startCoord[1] - 12} width="115" height="24" rx="4" fill="white" fillOpacity="0.8" />
                        <text x={startCoord[0] + 25} y={startCoord[1] + 4} fill="#334155" fontSize="12" fontWeight="bold">
                          ⬅️ Lùi: {prevFloorName}
                        </text>
                      </g>
                    );
                  }

                  return elements;
                })}
              </g>
            </svg>
          )}

          {/* Map Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <button 
              onClick={() => setScale((s) => Math.min(s * 1.2, 3))}
              className="bg-white p-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-md"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
            <button 
              onClick={() => setScale((s) => Math.max(s * 0.8, 0.5))}
              className="bg-white p-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-md"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <button 
              onClick={() => {
                setScale(1);
                if (svgRef.current) {
                  const rect = svgRef.current.getBoundingClientRect();
                  setPosition({ x: (rect.width - MAP_WIDTH) / 2, y: (rect.height - MAP_HEIGHT) / 2 });
                }
              }}
              className="bg-white p-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-md mt-4"
            >
              <span className="material-symbols-outlined">fit_screen</span>
            </button>
          </div>

          {/* Legend */}
          <div className="absolute top-6 left-6 flex items-center gap-3 bg-white/90 backdrop-blur px-4 py-2 rounded-lg border border-gray-200 shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-xs text-gray-600">Route</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-xs text-gray-600">Path</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Stairs</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
