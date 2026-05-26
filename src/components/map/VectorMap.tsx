
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Car, LocateFixed, Layers, ZoomIn, ZoomOut, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_LOCATIONS, MOCK_DRIVERS } from '@/lib/mock-data';

interface VectorMapProps {
  showTraffic?: boolean;
  selectedZone?: string;
}

export function VectorMap({ showTraffic = true, selectedZone }: VectorMapProps) {
  const [zoom, setZoom] = useState(14);
  const [center, setCenter] = useState({ x: 50, y: 50 });
  
  // Simulate map movement or interactive elements
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0A0C10] select-none cursor-crosshair">
      {/* Simulated Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(#387AF5 1px, transparent 1px), linear-gradient(90deg, #387AF5 1px, transparent 1px)`,
          backgroundSize: `${zoom * 4}px ${zoom * 4}px`,
          backgroundPosition: `${center.x}% ${center.y}%`
        }}
      />

      {/* Map Content Layer */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[200%] h-[200%] rotate-x-12 perspective-1000">
          
          {/* Simulated Routes */}
          <svg className="absolute inset-0 w-full h-full opacity-40">
            <path 
              d="M 500 400 L 700 600 L 1000 550 L 1200 800" 
              fill="none" 
              stroke="#387AF5" 
              strokeWidth="3" 
              strokeDasharray="8 4"
              className="animate-[dash_20s_linear_infinite]"
            />
            {showTraffic && (
              <path 
                d="M 400 300 L 600 500 L 900 450" 
                fill="none" 
                stroke="#F59E0B" 
                strokeWidth="4" 
                className="opacity-60"
              />
            )}
          </svg>

          {/* Delivery Locations */}
          {MOCK_LOCATIONS.map((loc, i) => (
            <motion.div
              key={loc.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="absolute pointer-events-auto"
              style={{ left: `${30 + i * 12}%`, top: `${20 + (i % 3) * 15}%` }}
            >
              <div className="group relative">
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <MapPin className="w-8 h-8 text-primary drop-shadow-lg" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 glass-panel rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {loc.address}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Drivers (Live) */}
          {MOCK_DRIVERS.map((driver, i) => (
            <motion.div
              key={driver.id}
              animate={{ 
                x: [0, 20, -10, 0],
                y: [0, -15, 10, 0]
              }}
              transition={{ 
                duration: 10 + i * 2, 
                repeat: Infinity,
                ease: "linear" 
              }}
              className="absolute pointer-events-auto"
              style={{ left: `${45 + i * 10}%`, top: `${45 + i * 8}%` }}
            >
              <div className="relative flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full border-2 border-accent bg-background overflow-hidden animate-pulse-subtle">
                  <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
                </div>
                <div className="glass-panel px-2 py-1 rounded text-[10px] hidden group-hover:block absolute left-10">
                  <div className="font-bold">{driver.name}</div>
                  <div className="text-accent">{driver.vehicleType.toUpperCase()}</div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute right-6 bottom-6 flex flex-col gap-2">
        <div className="glass-panel p-2 flex flex-col gap-2 rounded-xl">
          <button onClick={() => setZoom(prev => Math.min(prev + 1, 20))} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ZoomIn className="w-5 h-5 text-foreground/80" />
          </button>
          <div className="h-px bg-white/10 mx-2" />
          <button onClick={() => setZoom(prev => Math.max(prev - 1, 5))} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ZoomOut className="w-5 h-5 text-foreground/80" />
          </button>
        </div>
        <button className="glass-panel p-3 rounded-full hover:bg-primary/20 transition-all active:scale-95">
          <LocateFixed className="w-6 h-6 text-primary" />
        </button>
      </div>

      {/* Top Floating Stats */}
      <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 animate-in slide-in-from-top duration-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium tracking-wider">NETWORK STATUS: OPTIMAL</span>
          </div>
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-3 animate-in slide-in-from-top duration-700">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">40.7128° N, 74.0060° W</span>
          </div>
        </div>
        
        <div className="pointer-events-auto glass-panel p-1 rounded-full flex gap-1">
          <button className="px-4 py-1 rounded-full bg-primary text-xs font-bold shadow-lg shadow-primary/20">HYBRID</button>
          <button className="px-4 py-1 rounded-full text-xs font-medium hover:bg-white/5">TRAFFIC</button>
          <button className="px-4 py-1 rounded-full text-xs font-medium hover:bg-white/5">TERRAIN</button>
        </div>
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 map-gradient-overlay pointer-events-none" />
    </div>
  );
}
