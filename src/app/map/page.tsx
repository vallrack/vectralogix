
"use client";

import React, { useState } from 'react';
import { VectorMap } from '@/components/map/VectorMap';
import { 
  Square, 
  Circle, 
  Hexagon,
  Search,
  RefreshCw,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const ZONES_TABS = [
  { id: 'zonas', label: 'Zonas' },
  { id: 'rutas', label: 'Rutas' },
  { id: 'buscar', label: 'Buscar' },
  { id: 'reportes', label: 'Reportes' },
];

const COLORS = [
  { id: 'blue', class: 'bg-blue-500' },
  { id: 'green', class: 'bg-emerald-500' },
  { id: 'red', class: 'bg-rose-500' },
  { id: 'orange', class: 'bg-amber-500' },
  { id: 'purple', class: 'bg-violet-500' },
  { id: 'pink', class: 'bg-pink-500' },
];

export default function SpatialHub() {
  const [activeTab, setActiveTab] = useState('zonas');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [activeTool, setActiveTool] = useState('polygon');

  return (
    <div className="flex h-screen bg-[#0A0C10] text-foreground overflow-hidden">
      {/* Sidebar de Mapa Estilo Referencia */}
      <aside className="w-[380px] bg-[#0E1117] border-r border-white/5 flex flex-col z-20">
        {/* User Profile */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
              JO
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">José Daniel Avendaño Morales</p>
              <p className="text-[10px] text-muted-foreground">@Vattrack</p>
            </div>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-2 border-b border-white/5">
          {ZONES_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                activeTab === tab.id 
                  ? "text-blue-500 border-blue-500" 
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Crear Nueva Zona Section */}
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-2">CREAR NUEVA ZONA</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Elige color y herramienta, dibuja en el mapa y completa nombre y descripción en el modal.
                </p>
              </div>

              {/* Color Picker */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Color de la Zona</p>
                <div className="flex gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color.id)}
                      className={cn(
                        "w-6 h-6 rounded-full transition-all ring-offset-2 ring-offset-[#0E1117]",
                        color.class,
                        selectedColor === color.id ? "ring-2 ring-white scale-110" : "opacity-80 hover:opacity-100"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Drawing Tools */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Seleccionar Herramienta de Dibujo</p>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setActiveTool('polygon')}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 rounded-xl border transition-all text-[9px] font-bold gap-2",
                      activeTool === 'polygon' ? "bg-blue-600/20 border-blue-600 text-blue-500" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    <Hexagon className="w-4 h-4" />
                    POLÍGONO
                  </button>
                  <button 
                    onClick={() => setActiveTool('rect')}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 rounded-xl border transition-all text-[9px] font-bold gap-2",
                      activeTool === 'rect' ? "bg-blue-600/20 border-blue-600 text-blue-500" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    <Square className="w-4 h-4" />
                    RECTÁNGULO
                  </button>
                  <button 
                    onClick={() => setActiveTool('circle')}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 rounded-xl border transition-all text-[9px] font-bold gap-2",
                      activeTool === 'circle' ? "bg-blue-600/20 border-blue-600 text-blue-500" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    <Circle className="w-4 h-4" />
                    CÍRCULO
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mis Zonas List */}
          <div className="space-y-6 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest">MIS ZONAS (0)</h3>
              <button className="p-1 hover:bg-white/5 rounded transition-colors">
                <RefreshCw className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
            
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <p className="text-xs text-muted-foreground italic">No hay zonas guardadas.</p>
            </div>
          </div>
        </div>
        
        {/* Footer info/brand */}
        <div className="p-4 flex justify-between items-center border-t border-white/5">
           <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-[10px] font-bold">N</div>
        </div>
      </aside>
      
      {/* Map Area */}
      <main className="flex-1 relative">
        <VectorMap />
        
        {/* Map Controls (Top Right) */}
        <div className="absolute top-6 right-6 flex flex-col gap-2">
          <div className="bg-[#0E1117] border border-white/10 rounded-lg overflow-hidden flex flex-col shadow-2xl">
            <button className="p-3 hover:bg-white/5 border-b border-white/10 text-sm font-bold">+</button>
            <button className="p-3 hover:bg-white/5 text-sm font-bold">−</button>
          </div>
        </div>
      </main>
    </div>
  );
}
