
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, LocateFixed, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import { MOCK_LOCATIONS, MOCK_DRIVERS } from '@/lib/mock-data';

interface VectorMapProps {
  showTraffic?: boolean;
}

export function VectorMap({ showTraffic = true }: VectorMapProps) {
  const [zoom, setZoom] = useState(12);
  const [mapMode, setMapMode] = useState<'vector' | 'google'>('vector');
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0A0C10] select-none">
      
      {mapMode === 'google' ? (
        <div className="w-full h-full grayscale-[0.8] contrast-[1.2] invert-[0.05]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3976.0!2d-74.0760!3d4.5981!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses-419!2sco!4v1620000000000!5m2!1ses-419!2sco"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            className="opacity-60"
          />
        </div>
      ) : (
        <div className="absolute inset-0">
          {/* Simulated Grid Background */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(#387AF5 1px, transparent 1px), linear-gradient(90deg, #387AF5 1px, transparent 1px)`,
              backgroundSize: `${zoom * 5}px ${zoom * 5}px`,
            }}
          />

          {/* Map Content Layer */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-full h-full perspective-1000">
              
              {/* Simulated Colombian Hub Routes */}
              <svg className="absolute inset-0 w-full h-full opacity-30">
                <path 
                  d="M 200 100 Q 400 300 600 500 T 1000 800" 
                  fill="none" 
                  stroke="#387AF5" 
                  strokeWidth="2" 
                  strokeDasharray="10 5"
                  className="animate-[dash_25s_linear_infinite]"
                />
              </svg>

              {/* Delivery Locations */}
              {MOCK_LOCATIONS.map((loc, i) => (
                <motion.div
                  key={loc.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="absolute pointer-events-auto"
                  style={{ left: `${20 + (i * 15)}%`, top: `${30 + ((i % 2) * 25)}%` }}
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

              {/* Live Drivers */}
              {MOCK_DRIVERS.map((driver, i) => (
                <motion.div
                  key={driver.id}
                  animate={{ 
                    x: [0, 50, -25, 0],
                    y: [0, -30, 20, 0]
                  }}
                  transition={{ 
                    duration: 15 + i * 5, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                  className="absolute pointer-events-auto"
                  style={{ left: `${30 + i * 10}%`, top: `${40 + i * 8}%` }}
                >
                  <div className="relative flex items-center gap-2 group">
                    <div className="w-9 h-9 rounded-2xl border-2 border-accent bg-background overflow-hidden shadow-lg">
                      <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="glass-panel px-3 py-2 rounded-xl text-[10px] hidden group-hover:block absolute left-12 z-50">
                      <div className="font-bold">{driver.name}</div>
                      <div className="text-accent uppercase">{driver.vehicleType}</div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute right-6 bottom-6 flex flex-col gap-2">
        <div className="glass-panel p-2 flex flex-col gap-2 rounded-2xl shadow-2xl">
          <button onClick={() => setZoom(prev => Math.min(prev + 1, 20))} className="p-3 hover:bg-white/10 rounded-xl transition-colors">
            <ZoomIn className="w-5 h-5 text-foreground/80" />
          </button>
          <button onClick={() => setZoom(prev => Math.max(prev - 1, 5))} className="p-3 hover:bg-white/10 rounded-xl transition-colors">
            <ZoomOut className="w-5 h-5 text-foreground/80" />
          </button>
        </div>
        <button className="glass-panel p-4 rounded-full bg-primary text-white shadow-xl hover:scale-105 active:scale-95 transition-all">
          <LocateFixed className="w-6 h-6" />
        </button>
      </div>

      {/* Selector de Modo */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto glass-panel p-1.5 rounded-full shadow-2xl">
        <button 
          onClick={() => setMapMode('vector')}
          className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mapMode === 'vector' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5'}`}
        >
          VECTOR AI
        </button>
        <button 
          onClick={() => setMapMode('google')}
          className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mapMode === 'google' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5'}`}
        >
          GOOGLE MAPS
        </button>
      </div>

      {/* Overlay info */}
      <div className="absolute top-6 left-6 flex gap-4 pointer-events-none">
        <div className="glass-panel px-5 py-2.5 rounded-full flex items-center gap-3 shadow-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest uppercase">OPERACIÓN COLOMBIA: ESTABLE</span>
        </div>
      </div>

      <div className="absolute inset-0 map-gradient-overlay pointer-events-none" />
    </div>
  );
}
