
"use client";

import React, { useState } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { VectorMap } from '@/components/map/VectorMap';
import { 
  Pencil, 
  Circle, 
  Square, 
  Trash2, 
  Save, 
  MousePointer2, 
  Layers, 
  Activity, 
  Hexagon,
  ChevronLeft,
  Search,
  Zap,
  Navigation2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SpatialHub() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeTool, setActiveTool] = useState('select');

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'polygon', icon: Hexagon, label: 'Polygon' },
    { id: 'radius', icon: Circle, label: 'Radius' },
    { id: 'path', icon: Pencil, label: 'Path' },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AppSidebar />
      
      <main className="flex-1 relative">
        <VectorMap />

        {/* Floating Tool Panel */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          <div className="glass-panel p-2 rounded-2xl flex flex-col gap-1 shadow-2xl">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={cn(
                  "p-3 rounded-xl transition-all relative group",
                  activeTool === tool.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                )}
              >
                <tool.icon className="w-6 h-6" />
                <div className="absolute left-16 px-2 py-1 glass-panel rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none">
                  {tool.label.toUpperCase()}
                </div>
              </button>
            ))}
            <div className="h-px bg-white/10 my-2 mx-2" />
            <button className="p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all">
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Right Info Panel */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div 
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="absolute right-0 top-0 bottom-0 w-[400px] glass-panel border-l border-white/5 m-6 rounded-3xl overflow-hidden flex flex-col shadow-2xl z-20"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-lg font-headline font-bold">Zone Profiler</h3>
                </div>
                <button onClick={() => setPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                {/* Search / Location */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Search</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Find sector, hub, or unit..." 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                {/* Zone Metrics */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sector Analysis</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Density</p>
                      <p className="text-xl font-headline font-bold">12.4 <span className="text-[10px] font-medium text-muted-foreground">u/km²</span></p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Efficiency</p>
                      <p className="text-xl font-headline font-bold text-green-500">92%</p>
                    </div>
                  </div>
                </div>

                {/* Legend / Layers */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Layers</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Real-time Traffic', color: 'bg-orange-500' },
                      { label: 'Fleet Distribution', color: 'bg-primary' },
                      { label: 'High Demand Zones', color: 'bg-red-500' },
                      { label: 'Weather Overlay', color: 'bg-accent' },
                    ].map((layer, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", layer.color)} />
                          <span className="text-sm font-medium">{layer.label}</span>
                        </div>
                        <div className="w-8 h-4 bg-white/10 rounded-full relative overflow-hidden group-hover:bg-primary/20 transition-all">
                          <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full group-hover:translate-x-4 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 flex gap-3">
                <button className="flex-1 py-4 bg-primary text-white text-xs font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all">
                  <Save className="w-4 h-4" />
                  SAVE REGION
                </button>
                <button className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                  <Navigation2 className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!panelOpen && (
          <button 
            onClick={() => setPanelOpen(true)}
            className="absolute right-6 top-6 glass-panel p-4 rounded-2xl hover:bg-primary/20 transition-all shadow-2xl z-30"
          >
            <Layers className="w-6 h-6 text-primary" />
          </button>
        )}
      </main>
    </div>
  );
}
