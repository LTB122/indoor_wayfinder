"use client";

import React, { useEffect } from 'react';

declare global {
  interface Window {
    tailwind?: any;
  }
}

export default function CampusMap() {
  useEffect(() => {
    // Load Tailwind CDN and configure it like in test.html
    const script = document.createElement('script');
    script.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
    script.async = true;
    
    script.onload = () => {
      // Configure Tailwind like in test.html
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
                "display": ["Inter", "sans-serif"]
              },
              borderRadius: { 
                "DEFAULT": "0.25rem", 
                "lg": "0.5rem", 
                "xl": "0.75rem", 
                "full": "9999px" 
              },
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
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      
      body {
        font-family: 'Inter', sans-serif;
      }
      
      .map-gradient {
        background: radial-gradient(circle at center, #1a2a3a 0%, #101922 100%);
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
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#233648] px-6 py-3 bg-[#f6f7f8] dark:bg-[#101922] z-20">
        <div className="flex items-center gap-4 text-white">
          <div className="size-8 bg-[#137fec] rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white">map</span>
          </div>
          <h2 className="text-black dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Campus Pathfinding</h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <div className="hidden md:flex items-center gap-9">
            <a className="text-gray-600 dark:text-white text-sm font-medium leading-normal hover:text-[#137fec] transition-colors" href="#">Map</a>
            <a className="text-gray-600 dark:text-white text-sm font-medium leading-normal hover:text-[#137fec] transition-colors" href="#">Buildings</a>
            <a className="text-gray-600 dark:text-white text-sm font-medium leading-normal hover:text-[#137fec] transition-colors" href="#">Schedules</a>
            <a className="text-gray-600 dark:text-white text-sm font-medium leading-normal hover:text-[#137fec] transition-colors" href="#">Settings</a>
          </div>
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-[#137fec]"
            data-alt="User profile avatar"
            style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAnMDsvjMFf7EF8S-nY_sqzt6KwK4tLmOCfdUlsJ_BuG2HJUXTfKrFr3WCx3EJs7A6OKkgt6cQf3CPQ_IM0JTjwrUccoOIoO-eA7aqN6b2ysTDCgd0h6aYI0Cr9E-noID9gjivs9zboLtdzIP_B2ScWMsoUnb3kmX4979NQHhIITLeDL1sNJjN4seFibh1f0u2mKPgmma3ZmXeB8iPt3eoMSinHWr1MocISWBBarttWc0nGM3wyO1VbG7iGd16RgB6HCzIO4HtqC39A")'}}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation & Search */}
        <aside className="w-[420px] border-r border-[#233648] flex flex-col bg-[#f6f7f8] dark:bg-[#101922] overflow-y-auto z-10">
          <div className="p-4 space-y-4">
            {/* Search Bar Component */}
            <div className="flex flex-col gap-2">
              <label className="flex flex-col min-w-40 h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full border border-[#324d67]">
                  <div className="text-[#92adc9] flex bg-[#233648] items-center justify-center pl-4 rounded-l-lg">
                    <span className="material-symbols-outlined">my_location</span>
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-white focus:outline-0 focus:ring-0 border-none bg-[#233648] h-full placeholder:text-[#92adc9] px-4 text-base font-normal"
                    defaultValue="Tòa A" 
                  />
                </div>
              </label>
              <div className="flex justify-center -my-2 relative z-10">
                <button className="bg-[#137fec] p-1 rounded-full text-white shadow-lg">
                  <span className="material-symbols-outlined">swap_vert</span>
                </button>
              </div>
              <label className="flex flex-col min-w-40 h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full border border-[#137fec]">
                  <div className="text-[#92adc9] flex bg-[#233648] items-center justify-center pl-4 rounded-l-lg">
                    <span className="material-symbols-outlined text-[#137fec]">location_on</span>
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-white focus:outline-0 focus:ring-0 border-none bg-[#233648] h-full placeholder:text-[#92adc9] px-4 text-base font-normal"
                    defaultValue="Phòng 202" 
                  />
                  <div className="flex items-center justify-center rounded-r-lg border-none bg-[#233648] pr-4">
                    <button className="flex items-center justify-center bg-transparent text-white">
                      <span className="material-symbols-outlined text-[#92adc9]">close</span>
                    </button>
                  </div>
                </div>
              </label>
            </div>

            {/* Action Panel / Suggestion */}
            <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-[#137fec]/40 bg-[#137fec]/10 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-white text-sm font-bold leading-tight">Did you mean...?</p>
                <p className="text-[#92adc9] text-sm font-normal leading-normal">Tòa A (Cơ sở 1 - Đào tạo chính)</p>
              </div>
              <a className="text-sm font-bold leading-normal tracking-[0.015em] flex items-center gap-2 text-[#137fec] hover:underline" href="#">
                Select this location
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>

            <hr className="border-[#233648] my-2" />

            {/* Directions List */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-2 pb-4">
                <h3 className="text-white text-lg font-bold leading-tight">Directions</h3>
                <span className="text-xs text-[#92adc9]">Est. 3 mins • 120m</span>
              </div>
              <div className="space-y-1">
                {/* Step 1 */}
                <div className="flex gap-4 p-3 rounded-lg bg-[#137fec]/20 border-l-4 border-[#137fec]">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#137fec]/30 p-2 rounded-full">
                      <span className="material-symbols-outlined text-[#137fec]">straight</span>
                    </div>
                    <div className="w-0.5 h-full bg-[#137fec]/30 my-1"></div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-white text-sm font-medium">Go straight 50m</p>
                    <p className="text-[#92adc9] text-xs">Towards Main Square</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 p-3 rounded-lg hover:bg-[#233648] transition-colors">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#233648] p-2 rounded-full">
                      <span className="material-symbols-outlined text-[#92adc9]">turn_right</span>
                    </div>
                    <div className="w-0.5 h-full bg-[#233648] my-1"></div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-white text-sm font-medium">Turn right at Node C</p>
                    <p className="text-[#92adc9] text-xs">Entrance of Building A</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 p-3 rounded-lg hover:bg-[#233648] transition-colors">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#233648] p-2 rounded-full">
                      <span className="material-symbols-outlined text-[#92adc9]">stairs</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-white text-sm font-medium">Go up to Floor 2 via Staircase 1</p>
                    <p className="text-[#92adc9] text-xs">Room 202 is on the left</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer of Sidebar */}
          <div className="mt-auto p-4 bg-[#0a1118]">
            <div className="flex items-center justify-around text-[#92adc9]">
              <button className="flex flex-col items-center gap-1 hover:text-white">
                <span className="material-symbols-outlined">directions_walk</span>
                <span className="text-[10px]">Walk</span>
              </button>
              <button className="flex flex-col items-center gap-1 hover:text-white">
                <span className="material-symbols-outlined">accessible</span>
                <span className="text-[10px]">Accessible</span>
              </button>
              <button className="flex flex-col items-center gap-1 hover:text-white">
                <span className="material-symbols-outlined">share</span>
                <span className="text-[10px]">Share</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Map Area */}
        <main className="flex-1 relative map-gradient">
          {/* Placeholder for Map Visualization */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {/* Representing a 3D campus view with a stylized path */}
            <div className="relative w-full h-full opacity-60 pointer-events-none" data-location="University Campus">
              <div 
                className="absolute inset-0 bg-cover bg-center mix-blend-overlay"
                style={{backgroundImage: 'url("https://images.unsplash.com/photo-1541339907198-e08759dfc3f3?auto=format&fit=crop&w=1600&q=80")'}}
              />
            </div>

            {/* SVG Overlay for Route */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 600">
              <path 
                className="drop-shadow-[0_0_10px_rgba(19,127,236,0.8)]"
                d="M 200,500 L 400,450 L 500,300 L 550,250" 
                fill="none" 
                stroke="#137fec"
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="6"
              />
              {/* Start Pin */}
              <circle cx="200" cy="500" fill="#137fec" r="8" />
              <text fill="white" fontSize="14" fontWeight="bold" x="180" y="480">START: Tòa A</text>
              {/* End Pin */}
              <circle cx="550" cy="250" fill="#ff4d4d" r="8" />
              <text fill="white" fontSize="14" fontWeight="bold" x="565" y="245">END: P. 202</text>
            </svg>

            {/* Exploded View / Floor Detail Overlay */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col gap-4">
              <div className="bg-[#111a22]/80 backdrop-blur-md border border-[#233648] p-4 rounded-xl shadow-2xl w-48">
                <p className="text-xs font-bold text-[#137fec] uppercase mb-3">Building A - Floor View</p>
                <div className="space-y-2">
                  <div className="h-10 w-full bg-[#233648] rounded flex items-center px-3 justify-between border border-transparent hover:border-[#137fec] cursor-pointer">
                    <span className="text-xs">Floor 3</span>
                    <span className="material-symbols-outlined text-sm">lock</span>
                  </div>
                  <div className="h-10 w-full bg-[#137fec] rounded flex items-center px-3 justify-between border border-[#137fec] shadow-[0_0_15px_rgba(19,127,236,0.3)]">
                    <span className="text-xs font-bold">Floor 2</span>
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                  </div>
                  <div className="h-10 w-full bg-[#233648] rounded flex items-center px-3 justify-between border border-transparent">
                    <span className="text-xs">Floor 1</span>
                    <span className="material-symbols-outlined text-sm">history</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <button className="bg-[#111a22] p-3 rounded-lg border border-[#233648] text-white hover:bg-[#233648]">
              <span className="material-symbols-outlined">add</span>
            </button>
            <button className="bg-[#111a22] p-3 rounded-lg border border-[#233648] text-white hover:bg-[#233648]">
              <span className="material-symbols-outlined">remove</span>
            </button>
            <button className="bg-[#111a22] p-3 rounded-lg border border-[#233648] text-white hover:bg-[#233648] mt-4">
              <span className="material-symbols-outlined">layers</span>
            </button>
            <button className="bg-[#137fec] p-3 rounded-lg text-white shadow-xl">
              <span className="material-symbols-outlined">navigation</span>
            </button>
          </div>

          {/* Floor Legend */}
          <div className="absolute top-6 left-6 flex items-center gap-3 bg-[#111a22]/60 backdrop-blur px-4 py-2 rounded-full border border-[#233648]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#137fec] rounded-full"></div>
              <span className="text-xs">Indoor Route</span>
            </div>
            <div className="w-px h-4 bg-[#233648]"></div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-xs">Outdoor Walk</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}