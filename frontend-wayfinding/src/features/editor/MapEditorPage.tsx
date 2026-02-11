import { useState } from 'react';
import { ToolsPanel } from './components/ToolsPanel';
import { MapViewport } from './components/MapViewport';
import { InspectorPanel } from './components/InspectorPanel';
import { EditorHeader } from './components/EditorHeader';

export const MapEditorPage = () => {
  const [cursorCoords, setCursorCoords] = useState({ x: 0, y: 0 });

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden">
      
      {/* HEADER RIÊNG BIỆT CHO EDITOR */}
      <EditorHeader 
          mapName="Campus Floor 1 - Main Hall" 
          lastSaved="10:45 AM"
          onSave={() => alert("Saved!")}
      />
      
      {/* WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        <ToolsPanel cursorPos={cursorCoords} />
        
        <div className="flex-1 relative flex flex-col min-w-0">
          <MapViewport 
             onCursorMove={(x, y) => setCursorCoords({ x: Math.round(x), y: Math.round(y) })} 
          />
        </div>

        <InspectorPanel />
      </div>
    </div>
  );
};