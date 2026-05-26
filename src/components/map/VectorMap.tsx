
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, LocateFixed, ZoomIn, ZoomOut } from 'lucide-react';
import { MOCK_LOCATIONS, MOCK_DRIVERS } from '@/lib/mock-data';

interface VectorMapProps {
  showTraffic?: boolean;
}

export function VectorMap({ showTraffic = true }: VectorMapProps) {
  const [zoom, setZoom] = useState(12);
  const [center] = useState({ x: 50, y: 50 });
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0A0C10] select-none cursor-crosshair">
      {/* Simulated Grid Background with Colombia "Feeling" */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(#387AF5 1px, transparent 1px), linear-gradient(90deg, #387AF5 1px, transparent 1px)`,
          backgroundSize: `${zoom * 5}px ${zoom * 5}px`,
          backgroundPosition: `${center.x}% ${center.y}%`
        }}
      />

      {/* Map Content Layer */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[150%] h-[150%] perspective-1000">
          
          {/* Simulated Routes connecting Colombian Hubs */}
          <svg className="absolute inset-0 w-full h-full opacity-30">
            <path 
              d="M 600 500 L 800 300 L 900 200 L 1100 450" 
              fill="none" 
              stroke="#387AF5" 
              strokeWidth="2" 
              strokeDasharray="10 5"
              className="animate-[dash_25s_linear_infinite]"
            />
            {showTraffic && (
              <path 
                d="M 500 600 L 700 400 L 850 550" 
                fill="none" 
                stroke="#F59E0B" 
                strokeWidth="3" 
                className="opacity-40"
              />
            )}
          </svg>

          {/* Delivery Locations in Colombia */}
          {MOCK_LOCATIONS.map((loc, i) => (
            <motion.div
              key={loc.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="absolute pointer-events-auto"
              style={{ left: `${35 + (i * 10)}%`, top: `${25 + ((i % 2) * 20)}%` }}
            >
              <div className="group relative">
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <MapPin className="w-8 h-8 text-primary drop-shadow-lg" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 glass-panel rounded-xl text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {loc.address}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Drivers in Colombia (Live Simulation) */}
          {MOCK_DRIVERS.map((driver, i) => (
            <motion.div
              key={driver.id}
              animate={{ 
                x: [0, 30, -15, 0],
                y: [0, -20, 10, 0]
              }}
              transition={{ 
                duration: 12 + i * 3, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="absolute pointer-events-auto"
              style={{ left: `${40 + i * 8}%`, top: `${50 + i * 5}%` }}
            >
              <div className="relative flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-2xl border-2 border-accent bg-background overflow-hidden shadow-lg shadow-accent/20">
                  <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
                </div>
                <div className="glass-panel px-3 py-2 rounded-xl text-[10px] hidden group-hover:block absolute left-12 z-50 border-accent/30">
                  <div className="font-bold text-foreground">{driver.name}</div>
                  <div className="text-accent font-medium uppercase tracking-tighter">{driver.vehicleType}</div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full neon-glow" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute right-6 bottom-6 flex flex-col gap-2">
        <div className="glass-panel p-2 flex flex-col gap-2 rounded-2xl">
          <button onClick={() => setZoom(prev => Math.min(prev + 1, 20))} className="p-3 hover:bg-white/10 rounded-xl transition-colors">
            <ZoomIn className="w-5 h-5 text-foreground/80" />
          </button>
          <div className="h-px bg-white/10 mx-2" />
          <button onClick={() => setZoom(prev => Math.max(prev - 1, 5))} className="p-3 hover:bg-white/10 rounded-xl transition-colors">
            <ZoomOut className="w-5 h-5 text-foreground/80" />
          </button>
        </div>
        <button className="glass-panel p-4 rounded-full bg-primary/10 hover:bg-primary/20 transition-all active:scale-95 border-primary/30">
          <LocateFixed className="w-6 h-6 text-primary" />
        </button>
      </div>

      {/* Top Floating Stats for Colombia */}
      <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          <div className="glass-panel px-5 py-2.5 rounded-full flex items-center gap-3 animate-in slide-in-from-top duration-500">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase">CO-NETWORK: OPERACIONAL</span>
          </div>
          <div className="glass-panel px-5 py-2.5 rounded-full flex items-center gap-3 animate-in slide-in-from-top duration-700">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold tracking-widest uppercase">BOGOTÁ, COLOMBIA (4.71° N, 74.07° W)</span>
          </div>
        </div>
        
        <div className="pointer-events-auto glass-panel p-1.5 rounded-full flex gap-1">
          <button className="px-5 py-1.5 rounded-full bg-primary text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">VECTOR</button>
          <button className="px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/5">TRÁFICO</button>
          <button className="px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/5">SATÉLITE</button>
        </div>
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 map-gradient-overlay pointer-events-none" />
    </div>
  );
}
