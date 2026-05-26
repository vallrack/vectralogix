
"use client";

import React, { useState, useMemo, useEffect } from 'react';
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
  Filter,
  Maximize2,
  Navigation2
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

// Base de datos de búsqueda para simular geocodificación en Colombia
const MOCK_COLOMBIA_LOCATIONS = [
  { name: 'Bello', lat: 6.3373, lng: -75.5579, type: 'Ciudad', color: '#3b82f6' },
  { name: 'Medellín', lat: 6.2442, lng: -75.5812, type: 'Ciudad', color: '#10b981' },
  { name: 'Bogotá', lat: 4.6097, lng: -74.0817, type: 'Capital', color: '#f43f5e' },
  { name: 'Cali', lat: 3.4516, lng: -76.5320, type: 'Ciudad', color: '#f59e0b' },
  { name: 'Barranquilla', lat: 10.9639, lng: -74.7964, type: 'Ciudad', color: '#8b5cf6' },
  { name: 'Cartagena', lat: 10.3910, lng: -75.4794, type: 'Ciudad', color: '#ec4899' },
  { name: 'Pereira', lat: 4.8133, lng: -75.6961, type: 'Ciudad', color: '#3b82f6' },
  { name: 'Bucaramanga', lat: 7.1193, lng: -73.1227, type: 'Ciudad', color: '#10b981' },
];

export default function SpatialHub() {
  const [activeTab, setActiveTab] = useState('zonas');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [activeTool, setActiveTool] = useState('polygon');
  const [isSaving, setIsSaving] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapZoom, setMapZoom] = useState(12.5);
  const [viewCenter, setViewCenter] = useState({ lat: 4.6097, lng: -74.0817 });

  const firestore = useFirestore();
  const zonesQuery = useMemo(() => firestore ? collection(firestore, 'zones') : null, [firestore]);
  const { data: zones, loading: zonesLoading } = useCollection(zonesQuery);

  // Filtrado de Zonas guardadas y Localizaciones de Colombia
  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return { saved: zones || [], mapPoints: [] };

    const saved = (zones || []).filter(z => z.name.toLowerCase().includes(query));
    const mapPoints = MOCK_COLOMBIA_LOCATIONS.filter(l => l.name.toLowerCase().includes(query));
    
    return { saved, mapPoints };
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
        { lat: viewCenter.lat + (Math.random() - 0.5) * 0.05, lng: viewCenter.lng + (Math.random() - 0.5) * 0.05 }, 
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

  const handleDeleteZone = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleFocusPoint = (point: any) => {
    toast({ 
      title: `Analizando: ${point.name}`, 
      description: `Enfocando entorno en ${point.name} (Colombia)...` 
    });
    setMapZoom(15);
    // En una app real, actualizaríamos el estado del mapa
    if (point.lat && point.lng) {
      setViewCenter({ lat: point.lat, lng: point.lng });
    }
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
                      Selecciona una herramienta para delimitar un área de operación.
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
                      <div className="py-12 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center px-4">
                        <MapPin className="w-8 h-8 text-white/5 mb-2" />
                        <p className="text-[11px] text-muted-foreground">Crea tu primera zona para visualizarla aquí.</p>
                      </div>
                    ) : (
                      zones?.map((zone) => (
                        <div 
                          key={zone.id} 
                          onClick={() => handleFocusPoint(zone)}
                          className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-primary/30 transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
                            <div>
                              <p className="text-xs font-bold">{zone.name}</p>
                              <p className="text-[9px] text-muted-foreground uppercase">{zone.type}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => handleDeleteZone(zone.id, e)} className="p-1.5 hover:bg-rose-500/20 rounded-md text-rose-500" title="Eliminar">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
                    placeholder="Buscar zonas o localizaciones en Colombia..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-6">
                  {searchResults.mapPoints.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">MAPA (COLOMBIA)</h3>
                      {searchResults.mapPoints.map((point) => (
                        <div 
                          key={point.name}
                          onClick={() => handleFocusPoint(point)}
                          className="flex items-center justify-between p-4 bg-accent/5 border border-accent/10 rounded-2xl hover:bg-accent/10 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                              <Navigation2 className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                              <p className="text-xs font-bold">{point.name}</p>
                              <p className="text-[9px] text-muted-foreground uppercase">{point.type}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">ZONAS GUARDADAS</h3>
                    {searchResults.saved.length === 0 && searchResults.mapPoints.length === 0 ? (
                      <div className="py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl">
                        <Search className="w-8 h-8 text-white/5 mx-auto mb-3" />
                        <p className="text-[11px] text-muted-foreground">No se encontraron resultados para "{searchQuery}".</p>
                      </div>
                    ) : (
                      searchResults.saved.map((zone) => (
                        <div key={zone.id} 
                          onClick={() => handleFocusPoint(zone)}
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
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
      
      {/* Área del Mapa Principal */}
      <main className="flex-1 relative bg-black overflow-hidden">
        <VectorMap />
        
        {/* Marcadores Visuales en el Mapa */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Marcadores de Zonas Guardadas */}
          {searchResults.saved.map((zone: any) => (
            <MapMarker 
              key={zone.id} 
              point={zone} 
              onFocus={() => handleFocusPoint(zone)} 
            />
          ))}

          {/* Marcadores de Localizaciones Geográficas (Colombia) */}
          {searchResults.mapPoints.map((point: any) => (
            <MapMarker 
              key={point.name} 
              point={point} 
              onFocus={() => handleFocusPoint(point)}
              isPointOfInterest
            />
          ))}
        </div>

        {/* Buscador Inteligente Flotante en el Mapa */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
           <div className="bg-[#0E1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl flex items-center gap-2 group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                placeholder="Buscar ciudad o zona (ej. Bello, Medellín...)"
                className="bg-transparent border-none outline-none text-xs flex-1 text-white placeholder:text-muted-foreground py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                onClick={() => setSearchQuery('')}
                className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
           </div>
        </div>
        
        {/* Controles del Mapa Flotantes */}
        <div className="absolute top-6 right-6 flex flex-col gap-3 z-30">
          <div className="bg-[#0E1117] border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            <button 
              onClick={() => setMapZoom(prev => Math.min(prev + 0.5, 18))}
              className="p-3.5 hover:bg-white/5 border-b border-white/10 text-sm font-bold transition-colors"
            >+</button>
            <button 
              onClick={() => setMapZoom(prev => Math.max(prev - 0.5, 5))}
              className="p-3.5 hover:bg-white/5 text-sm font-bold transition-colors"
            >−</button>
          </div>
          <button className="p-3.5 bg-primary text-white rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Overlay de Coordenadas y Estado */}
        <div className="absolute bottom-6 left-6 flex items-end gap-4 z-30">
          <div className="bg-[#0E1117]/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-[10px] font-mono text-muted-foreground shadow-2xl">
            <div className="flex gap-4 mb-1">
              <span>LAT: {viewCenter.lat.toFixed(6)}</span>
              <span>LNG: {viewCenter.lng.toFixed(6)}</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
               <span className="uppercase tracking-widest opacity-60">Engine Render OK | ZOOM: {mapZoom.toFixed(1)}x</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MapMarker({ point, onFocus, isPointOfInterest }: any) {
  // Simulación de posición lat/lng a coordenadas de pantalla relativa (%)
  // Bogotá (4.6, -74.0) Medellín (6.2, -75.5) Bello (6.3, -75.5)
  const latFactor = (point.lat || point.coordinates?.[0]?.lat || 4.6) - 4.6;
  const lngFactor = (point.lng || point.coordinates?.[0]?.lng || -74.0) + 74.0;
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="absolute"
      style={{ 
        left: `${50 + lngFactor * 500}%`, 
        top: `${50 - latFactor * 500}%` 
      }}
    >
      <div 
        className="relative flex flex-col items-center group pointer-events-auto cursor-pointer" 
        onClick={onFocus}
      >
        <div className="bg-background/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl mb-1 opacity-0 group-hover:opacity-100 transition-all shadow-2xl -translate-y-2">
           <p className="text-[9px] font-bold whitespace-nowrap">{point.name}</p>
           {isPointOfInterest && <p className="text-[7px] text-accent uppercase font-bold">Localización</p>}
        </div>
        <div 
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-125",
            isPointOfInterest ? "bg-accent animate-pulse" : "animate-bounce"
          )} 
          style={{ backgroundColor: !isPointOfInterest ? point.color : undefined }}
        >
          {isPointOfInterest ? <Navigation2 className="w-3 h-3 text-white fill-white" /> : <MapPin className="w-3 h-3 text-white" />}
        </div>
        <div 
          className="w-10 h-10 absolute -inset-2 rounded-full border border-white/10 animate-ping opacity-20" 
          style={{ borderColor: point.color || '#0EA5E9' }} 
        />
      </div>
    </motion.div>
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
