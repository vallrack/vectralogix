
"use client";

import React, { useState, useMemo } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { VectorMap } from '@/components/map/VectorMap';
import { 
  Square, 
  Circle, 
  Hexagon,
  Search,
  RefreshCw,
  LogOut,
  ChevronRight,
  Save,
  Navigation,
  ZoomIn,
  MapPin,
  Trash2,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const ZONES_TABS = [
  { id: 'zonas', label: 'Zonas' },
  { id: 'rutas', label: 'Rutas' },
  { id: 'buscar', label: 'Buscar' },
  { id: 'reportes', label: 'Reportes' },
];

const COLORS = [
  { id: 'blue', class: 'bg-blue-500', hex: '#3b82f6' },
  { id: 'green', class: 'bg-emerald-500', hex: '#10b981' },
  { id: 'red', class: 'bg-rose-500', hex: '#f43f5e' },
  { id: 'orange', class: 'bg-amber-500', hex: '#f59e0b' },
  { id: 'purple', class: 'bg-violet-500', hex: '#8b5cf6' },
  { id: 'pink', class: 'bg-pink-500', hex: '#ec4899' },
];

export default function SpatialHub() {
  const [activeTab, setActiveTab] = useState('zonas');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [activeTool, setActiveTool] = useState('polygon');
  const [isSaving, setIsSaving] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const firestore = useFirestore();
  const zonesQuery = useMemo(() => firestore ? collection(firestore, 'zones') : null, [firestore]);
  const { data: zones, loading: zonesLoading } = useCollection(zonesQuery);

  const filteredZones = useMemo(() => {
    if (!zones) return [];
    return zones.filter(zone => 
      zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [zones, searchQuery]);

  const handleSaveZone = () => {
    if (!firestore || !newZoneName) {
      toast({ title: "Error", description: "Asigna un nombre a la zona.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const colorHex = COLORS.find(c => c.id === selectedColor)?.hex || '#3b82f6';
    
    const zoneData = {
      name: newZoneName,
      type: activeTool,
      color: colorHex,
      coordinates: [
        { lat: 4.6097, lng: -74.0817 }, 
      ],
      createdAt: serverTimestamp()
    };

    addDoc(collection(firestore, 'zones'), zoneData)
      .then(() => {
        toast({ title: "Éxito", description: "Zona guardada correctamente." });
        setNewZoneName('');
        setActiveTab('zonas');
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'zones',
          operation: 'create',
          requestResourceData: zoneData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSaving(false));
  };

  const handleDeleteZone = (id: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'zones', id))
      .then(() => toast({ title: "Eliminado", description: "La zona ha sido removida." }))
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: `zones/${id}`,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleZoomToZone = (zone: any) => {
    toast({ 
      title: `Enfocando: ${zone.name}`, 
      description: `Analizando entorno en coordenadas ${zone.type}...` 
    });
    // Aquí se dispararía la lógica de cámara del mapa
  };

  return (
    <div className="flex h-screen bg-[#0A0C10] text-foreground overflow-hidden">
      <AppSidebar />
      
      {/* Sidebar de Mapa */}
      <aside className="w-[380px] min-w-[380px] bg-[#0E1117] border-r border-white/5 flex flex-col z-20 shadow-2xl relative">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/20">
              JO
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">José Daniel Avendaño</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">@VectraAdmin</p>
            </div>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
            <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-rose-500 transition-colors" />
          </button>
        </div>

        <div className="flex px-2 border-b border-white/5">
          {ZONES_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2",
                activeTab === tab.id 
                  ? "text-primary border-primary" 
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === 'zonas' && (
              <motion.div 
                key="zonas"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="glass-panel rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">TRAZADO INTELIGENTE</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Selecciona una herramienta para delimitar un área de operación en el territorio nacional.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Nombre de la nueva zona..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                      value={newZoneName}
                      onChange={(e) => setNewZoneName(e.target.value)}
                    />
                    
                    <div className="flex gap-2.5">
                      {COLORS.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setSelectedColor(color.id)}
                          className={cn(
                            "w-6 h-6 rounded-full transition-all ring-offset-2 ring-offset-[#0E1117]",
                            color.class,
                            selectedColor === color.id ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"
                          )}
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <ToolButton active={activeTool === 'polygon'} onClick={() => setActiveTool('polygon')} icon={Hexagon} label="POLÍGONO" />
                      <ToolButton active={activeTool === 'rect'} onClick={() => setActiveTool('rect')} icon={Square} label="RECT" />
                      <ToolButton active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} icon={Circle} label="RADIO" />
                    </div>

                    <button 
                      onClick={handleSaveZone}
                      disabled={isSaving || !newZoneName}
                      className="w-full bg-primary text-white py-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'GUARDANDO...' : 'CONFIRMAR Y GUARDAR'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">ZONAS ACTIVAS ({zones?.length || 0})</h3>
                  <div className="space-y-3">
                    {zonesLoading ? (
                      <div className="py-8 flex justify-center"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                    ) : zones?.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic text-center py-8">No hay zonas guardadas aún.</p>
                    ) : (
                      zones?.map((zone) => (
                        <div key={zone.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-all group">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleZoomToZone(zone)}>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
                            <div>
                              <p className="text-xs font-bold">{zone.name}</p>
                              <p className="text-[9px] text-muted-foreground uppercase">{zone.type}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleZoomToZone(zone)} className="p-1.5 hover:bg-primary/20 rounded-md text-primary" title="Zoom">
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteZone(zone.id)} className="p-1.5 hover:bg-rose-500/20 rounded-md text-rose-500" title="Eliminar">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'buscar' && (
              <motion.div 
                key="buscar"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Filtrar por nombre o tipo..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">RESULTADOS ({filteredZones.length})</h3>
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-3">
                    {filteredZones.length === 0 ? (
                      <div className="py-20 text-center">
                        <Search className="w-8 h-8 text-white/5 mx-auto mb-3" />
                        <p className="text-[11px] text-muted-foreground">No se encontraron coincidencias.</p>
                      </div>
                    ) : (
                      filteredZones.map((zone) => (
                        <div key={zone.id} 
                          onClick={() => handleZoomToZone(zone)}
                          className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer group shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-background border border-white/5 flex items-center justify-center">
                              <MapPin className="w-4 h-4" style={{ color: zone.color }} />
                            </div>
                            <div>
                              <p className="text-xs font-bold">{zone.name}</p>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{zone.type}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'rutas' && (
              <motion.div 
                key="rutas"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
                  <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">TRAZADO DE RUTA</h3>
                  <p className="text-[11px] leading-relaxed text-muted-foreground mb-4">Haz click en el mapa para añadir puntos de entrega y calcular la ruta óptima.</p>
                  <button className="w-full bg-white/5 border border-white/10 py-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                    <Navigation className="w-4 h-4" />
                    ACTIVAR MODO TRAZADO
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="p-4 border-t border-white/5">
           <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
             <span>VECTRA SPATIAL v2.4</span>
             <span className="text-emerald-500 flex items-center gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               LIVE ENGINE
             </span>
           </div>
        </div>
      </aside>
      
      {/* Área del Mapa */}
      <main className="flex-1 relative bg-black">
        <VectorMap />
        
        {/* Controles del Mapa Flotantes */}
        <div className="absolute top-6 right-6 flex flex-col gap-3 z-30">
          <div className="bg-[#0E1117] border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            <button className="p-3.5 hover:bg-white/5 border-b border-white/10 text-sm font-bold transition-colors">+</button>
            <button className="p-3.5 hover:bg-white/5 text-sm font-bold transition-colors">−</button>
          </div>
          <button className="p-3.5 bg-primary text-white rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
            <MapPin className="w-5 h-5" />
          </button>
        </div>

        {/* Overlay de Coordenadas */}
        <div className="absolute bottom-6 left-6 bg-[#0E1117]/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-mono text-muted-foreground z-30">
          LAT: 4.609712 | LNG: -74.081745 | ZOOM: 12.5x
        </div>
      </main>
    </div>
  );
}

function ToolButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center py-4 rounded-xl border transition-all text-[9px] font-bold gap-2.5",
        active 
          ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(56,122,245,0.1)]" 
          : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
