"use client";

import React, { useEffect } from 'react';

declare global {
  interface Window {
    tailwind?: any;
  }
}

export default function IndoorBuildingMap() {
  useEffect(() => {
    // Load Tailwind CDN and configure it like in original
    const script = document.createElement('script');
    script.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
    script.async = true;
    
    script.onload = () => {
      // Configure Tailwind
      if (window.tailwind) {
        window.tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "primary": "#137fec",
                "background-light": "#f6f7f8",
                "background-dark": "#101922",
              },
              fontFamily: {
                "display": ["Inter"]
              },
              borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
            },
          },
        };
      }
    };
    
    document.head.appendChild(script);
    
    // Add custom styles
    const style = document.createElement('style');
    style.textContent = `
      .material-symbols-outlined {
        font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24
      }
      .floor-plan-overlay {
        background-image: linear-gradient(rgba(16, 25, 34, 0.6), rgba(16, 25, 34, 0.6)), url(https://lh3.googleusercontent.com/aida-public/AB6AXuCm7Kgq4KlZkCgg5IleKcuEHEl454EnK28Oql3c5olyPr6JaKGdBuYX00uDdpdvFiOp9HbrFmXnazfSFgoZBoDW2qcz2YLroOhj38WP2J7tzBFY7LLCd8XqNXIwHVj3POH0TeczSiu-8R3zautxj89vbpY2JgbddXplQAS4_buQ5W4PmrHtwicaJa-BXJb-100w0df1v1Lm5Bte0On5aVcILNIq5NC8z3RPKfIiu-FV_sw1-j5Xe3as_H3OkGP2u7BSVMXtjHPfzdmy);
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Cleanup
      document.head.removeChild(script);
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark px-6 py-3 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined text-3xl">map</span>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Indoor Map Manager</h2>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:border-slate-800"></div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 text-sm">Campus</span>
            <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
            <span className="text-slate-900 dark:text-white text-sm font-medium">Engineering Block A</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
                      <div className="flex w-full flex-1 items-stretch rounded-lg h-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#192633]">
              <div className="text-slate-400 dark:text-[#92adc9] flex items-center justify-center pl-3">
                <span className="material-symbols-outlined text-xl">search</span>
              </div>
              <input 
                className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:outline-0 focus:ring-0 text-sm placeholder:text-slate-400 dark:placeholder:text-[#92adc9] px-2" 
                placeholder="Search node..." 
                defaultValue=""
              />
            </div>
          <button className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-blue-600 transition-colors">
            <span className="material-symbols-outlined text-sm">save</span>
            <span>Save Changes</span>
          </button>
          <div className="h-8 w-8 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden">
            <img 
              alt="User Avatar" 
              data-alt="User profile placeholder" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuChPWSfTCFaNFHHhyvxMryTY9XNDsL9VaoUgqZgAI3JZzebbCSK-ueyEybq8QuXFTBVGxzhq29MElILw0M91Lqi8GfrjcSwd42VRCrza0xqMQagrk4jpTVuVMC0mxWN5HoBHvt0TLESjR4KQZw9qJKwa46LRzy_Pz_-Juv3de0mFyUR4eZ1Ce3ApliITi3klAHR3Z5tBvLw18oN6v3C6SWUq9z_dlbe7q5ueCaz5eP0RquXOAIQouBqjwrBuG3tRLCG4ruf7gSY6f17"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Floor Selector */}
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Floors</h3>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined">layers</span>
              <span className="text-sm font-medium">Floor 4</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined">layers</span>
              <span className="text-sm font-medium">Floor 3</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined">layers</span>
              <span className="text-sm font-medium">Floor 2</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>layers</span>
              <span className="text-sm font-medium">Floor 1</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined">layers</span>
              <span className="text-sm font-medium">Basement</span>
            </button>
          </nav>
          <div className="p-4">
            <button className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-400 hover:text-primary hover:border-primary transition-all group">
              <span className="material-symbols-outlined">add_circle</span>
              <span className="text-sm font-medium">Add Floor</span>
            </button>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col relative bg-slate-50 dark:bg-slate-900/50">
          {/* Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">near_me</span>
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">add_location_alt</span>
            </button>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">polyline</span>
            </button>
            <button className="p-2 bg-primary/10 text-primary rounded-lg">
              <span className="material-symbols-outlined">stairs</span>
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-semibold">
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              Preview Routing
            </button>
          </div>

          {/* Map Controls (Floating Right) */}
          <div className="absolute right-6 bottom-6 z-10 flex flex-col gap-2">
            <div className="flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
              <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700 rounded-t-lg">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">add</span>
              </button>
              <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-lg">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">remove</span>
              </button>
            </div>
            <button className="p-2.5 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">my_location</span>
            </button>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden floor-plan-overlay" data-location="Floor Plan Visualizer">
            {/* Interactive Node Overlay (Visual representation) */}
            <svg className="absolute inset-0 w-full h-full" style={{filter: 'drop-shadow(0 0 8px rgba(19, 127, 236, 0.3))'}}>
              {/* Edges */}
              <line stroke="#137fec" strokeDasharray="8,4" strokeWidth="3" x1="20%" x2="45%" y1="30%" y2="30%"></line>
              <line stroke="#137fec" strokeWidth="3" x1="45%" x2="45%" y1="30%" y2="60%"></line>
              <line stroke="#137fec" strokeWidth="3" x1="45%" x2="65%" y1="60%" y2="60%"></line>
              {/* Nodes */}
              <circle cx="20%" cy="30%" fill="#137fec" r="6"></circle>
              <circle cx="45%" cy="30%" fill="#137fec" r="6"></circle>
              <circle cx="65%" cy="60%" fill="#137fec" r="6"></circle>
              {/* Selected Staircase Node */}
              <circle className="animate-pulse" cx="45%" cy="60%" fill="none" r="10" stroke="#137fec" strokeWidth="2"></circle>
              <circle cx="45%" cy="60%" fill="#137fec" r="6"></circle>
              {/* Interfloor Link Highlight */}
              <path d="M 45% 60% L 45% 50%" stroke="#137fec" strokeOpacity="0.5" strokeWidth="2"></path>
            </svg>
            <div className="absolute" style={{left: '46%', top: '62%'}}>
              <div className="bg-primary text-white text-[10px] px-2 py-0.5 rounded shadow-lg font-bold">STAIRCASE A</div>
            </div>
          </div>

          {/* Footer coordinates */}
          <div className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex justify-between items-center shrink-0">
            <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
              <span>X: 142.42</span>
              <span>Y: 884.10</span>
              <span>NODE_ID: ST_01_A</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Draft last saved 2m ago
            </div>
          </div>
        </main>

        {/* Right Sidebar: Inspector */}
        <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Node Properties</h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          
          <div className="p-6 flex flex-col gap-6 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-primary">
                <span className="material-symbols-outlined">stairs</span>
                <span className="text-sm font-medium">Staircase / Connector</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Label / ID</label>
              <input 
                className="w-full rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm py-2 dark:text-white focus:ring-primary" 
                type="text" 
                defaultValue="Staircase A"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Room Number</label>
              <input 
                className="w-full rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm py-2 dark:text-white focus:ring-primary" 
                placeholder="e.g. 102" 
                type="text"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aliases</label>
              <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 min-h-[80px]">
                <span className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded text-xs dark:text-white">
                  West Wing Stairs
                  <span className="material-symbols-outlined text-[10px] cursor-pointer">close</span>
                </span>
                <span className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded text-xs dark:text-white">
                  Fire Exit 1
                  <span className="material-symbols-outlined text-[10px] cursor-pointer">close</span>
                </span>
                <button className="text-primary text-xs font-medium px-2 py-1">+ Add Alias</button>
              </div>
            </div>
            
            <div className="h-px bg-slate-200 dark:bg-slate-800"></div>
            
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vertical Connections</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-2 rounded bg-slate-100 dark:bg-slate-800">
                  <span className="text-xs dark:text-white">Floor 2 - Staircase A</span>
                  <span className="material-symbols-outlined text-sm text-primary">link</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-100 dark:bg-slate-800">
                  <span className="text-xs dark:text-white">Basement - Staircase A</span>
                  <span className="material-symbols-outlined text-sm text-primary">link</span>
                </div>
              </div>
              <button className="text-xs font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">add</span> Link another floor
              </button>
            </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <button className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800">Delete</button>
            <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold">Apply</button>
          </div>
        </aside>
      </div>
    </div>
  );
}