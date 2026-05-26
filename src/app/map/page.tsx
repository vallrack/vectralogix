
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
  ChevronRight,
  Save,
  Navigation,
  ZoomIn,
  MapPin,
  Trash2,
  Filter,
  Maximize2,
  Navigation2,
  Layers,
  Crosshair
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
  { id: 'capas', label: 'Capas' },
];

const COLORS = [
  { id: 'blue', class: 'bg-blue-500', hex: '#3b82f6' },
  { id: 'green', class: 'bg-emerald-500', hex: '#10b981' },
  { id: 'red', class: 'bg-rose-500', hex: '#f43f5e' },
  { id: 'orange', class: 'bg-amber-500', hex: '#f59e0b' },
  { id: 'purple', class: 'bg-violet-500', hex: '#8b5cf6' },
  { id: 'pink', class: 'bg-pink-500', hex: '#ec4899' },
];

const MOCK_COLOMBIA_LOCATIONS = [
  { id: 'c1', name: 'Bello', lat: 6.3373, lng: -75.5579, type: 'Ciudad', color: '#3b82f6' },
  { id: 'c2', name: 'Medellín', lat: 6.2442, lng: -75.5812, type: 'Ciudad', color: '#10b981' },
  { id: 'c3', name: 'Bogotá', lat: 4.6097, lng: -74.0817, type: 'Capital', color: '#f43f5e' },
  { id: 'c4', name: 'Cali', lat: 3.4516, lng: -76.5320, type: 'Ciudad', color: '#f59e0b' },
  { id: 'c5', name: 'Barranquilla', lat: 10.9639, lng: -74.7964, type: 'Ciudad', color: '#8b5cf6' },
  { id: 'c6', name: 'Cartagena', lat: 10.3910, lng: -75.4794, type: 'Ciudad', color: '#ec4899' },
  { id: 'c7', name: 'Pereira', lat: 4.8133, lng: -75.6961, type: 'Ciudad', color: '#3b82f6' },
  { id: 'c8', name: 'Bucaramanga', lat: 7.1193, lng: -73.1227, type: 'Ciudad', color: '#10b981' },
];

export default function SpatialHub() {
  const [activeTab, setActiveTab] = useState('zonas');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [activeTool, setActiveTool] = useState('polygon');
  const [isSaving, setIsSaving] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapZoom, setMapZoom] = useState(12);
  const [viewCenter, setViewCenter] = useState({ lat: 4.6097, lng: -74.0817 });

  const firestore = useFirestore();
  const zonesQuery = useMemo(() => firestore ? collection(firestore, 'zones') : null, [firestore]);
  const { data: zones, loading: zonesLoading } = useCollection(zonesQuery);

  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return { saved: [], mapPoints: [] };
    const saved = (zones || []).filter(z => z.name.toLowerCase().includes(query));
    const mapPoints = MOCK_COLOMBIA_LOCATIONS.filter(l => l.name.toLowerCase().includes(query));
    return { saved, mapPoints };
  }, [zones, searchQuery]);

  // Si hay una búsqueda activa y hay un resultado exacto o único, geolocalizamos automáticamente
  useEffect(() => {
    if (searchQuery.length > 2 && searchResults.mapPoints.length === 1) {
      const point = searchResults.mapPoints[0];
      setViewCenter({ lat: point.lat, lng: point.lng });
      setMapZoom(14);
    }
  }, [searchQuery, searchResults.mapPoints]);

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
      coordinates: [{ lat: viewCenter.lat, lng: viewCenter.lng }],
      createdAt: serverTimestamp()
    };

    addDoc(collection(firestore, 'zones'), zoneData)
      .then(() => {
        toast({ title: "Zona Creada", description: `${newZoneName} se ha guardado en la cartografía.` });
        setNewZoneName('');
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'zones',
          operation: 'create',
          requestResourceData: zoneData,
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleFocusPoint = (point: any) => {
    const lat = point.lat || point.coordinates?.[0]?.lat;
    const lng = point.lng || point.coordinates?.[0]?.lng;
    
    if (lat && lng) {
      setViewCenter({ lat, lng });
      setMapZoom(15);
      toast({ 
        title: `Geolocalizando: ${point.name}`, 
        description: `Enfocando coordenadas ${lat.toFixed(4)}, ${lng.toFixed(4)}` 
      });
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0C10] text-foreground overflow-hidden font-body">
      <AppSidebar />
      
      <aside className="w-[400px] min-w-[400px] bg-[#0E1117] border-r border-white/5 flex flex-col z-20 shadow-2xl relative">
        <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-bold text-lg shadow-xl shadow-primary/20">
              V
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">CARTOGRAFÍA VECTRA</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">Control Espacial Colombia</p>
            </div>
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl">
            {ZONES_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg",
                  activeTab === tab.id 
                    ? "bg-primary text-white shadow-md shadow-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'zonas' && (
              <motion.div 
                key="zonas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="glass-panel rounded-3xl p-6 space-y-6 bg-[#161B22]/80">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">NUEVA DELIMITACIÓN</h3>
                    <Layers className="w-4 h-4 text-muted-foreground/30" />
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">ETIQUETA DE ZONA</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Norte de Medellín"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 text-white"
                        value={newZoneName}
                        onChange={(e) => setNewZoneName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">IDENTIFICADOR VISUAL</label>
                      <div className="flex gap-3 justify-between">
                        {COLORS.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => setSelectedColor(color.id)}
                            className={cn(
                              "w-7 h-7 rounded-full transition-all ring-offset-2 ring-offset-[#0E1117]",
                              color.class,
                              selectedColor === color.id ? "ring-2 ring-white scale-110" : "opacity-40 hover:opacity-100"
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <ToolButton active={activeTool === 'polygon'} onClick={() => setActiveTool('polygon')} icon={Hexagon} label="POLÍGONO" />
                      <ToolButton active={activeTool === 'rect'} onClick={() => setActiveTool('rect')} icon={Square} label="RECTÁNGULO" />
                      <ToolButton active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} icon={Circle} label="RADIO" />
                    </div>

                    <button 
                      onClick={handleSaveZone}
                      disabled={isSaving || !newZoneName}
                      className="w-full bg-primary text-white py-4 rounded-2xl text-[10px] font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 group"
                    >
                      <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      {isSaving ? 'PROCESANDO...' : 'FIJAR EN CARTOGRAFÍA'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">REGISTRO DE ZONAS ({zones?.length || 0})</h3>
                    <Filter className="w-3.5 h-3.5 text-muted-foreground hover:text-primary cursor-pointer" />
                  </div>
                  
                  <div className="space-y-2">
                    {zonesLoading ? (
                      <div className="py-12 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-primary/50" /></div>
                    ) : zones?.length === 0 ? (
                      <div className="py-16 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-center px-8">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                          <MapPin className="w-5 h-5 text-white/10" />
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">No hay perímetros trazados. Usa las herramientas superiores para comenzar.</p>
                      </div>
                    ) : (
                      zones?.map((zone) => (
                        <div 
                          key={zone.id} 
                          onClick={() => handleFocusPoint(zone)}
                          className="flex items-center justify-between p-4 bg-[#161B22]/40 border border-white/5 rounded-2xl hover:bg-white/5 hover:border-primary/20 transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: zone.color }} />
                            <div>
                              <p className="text-xs font-bold text-white/90">{zone.name}</p>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{zone.type}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteDoc(doc(firestore!, 'zones', zone.id));
                              }} 
                              className="p-2 hover:bg-rose-500/20 rounded-lg text-rose-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground">
                              <ChevronRight className="w-4 h-4" />
                            </div>
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
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Escribre una ubicación (Bello, Medellín...)" 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs focus:ring-1 focus:ring-primary outline-none transition-all text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-6">
                  {searchResults.mapPoints.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                        <Navigation2 className="w-3 h-3" />
                        NODOS GEOGRÁFICOS
                      </h3>
                      {searchResults.mapPoints.map((point) => (
                        <div 
                          key={point.id}
                          onClick={() => handleFocusPoint(point)}
                          className="flex items-center justify-between p-4 bg-accent/5 border border-accent/10 rounded-2xl hover:bg-accent/10 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-black/60 flex items-center justify-center">
                              <Crosshair className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white/90">{point.name}</p>
                              <p className="text-[9px] text-muted-foreground uppercase">{point.type}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">ZONAS ALMACENADAS</h3>
                    {searchQuery && searchResults.saved.length === 0 && searchResults.mapPoints.length === 0 ? (
                      <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/2">
                        <Search className="w-10 h-10 text-white/5 mx-auto mb-4" />
                        <p className="text-xs text-muted-foreground">Sin coincidencias para "{searchQuery}"</p>
                      </div>
                    ) : (
                      searchResults.saved.map((zone) => (
                        <div key={zone.id} 
                          onClick={() => handleFocusPoint(zone)}
                          className="flex items-center justify-between p-5 bg-[#161B22]/40 border border-white/5 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-black/60 flex items-center justify-center border border-white/5">
                              <MapPin className="w-5 h-5" style={{ color: zone.color }} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white/90">{zone.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{zone.type}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="p-6 border-t border-white/5 bg-black/20">
           <div className="flex items-center justify-between text-[10px] font-bold">
             <span className="text-muted-foreground">SPATIAL HUB v3.1</span>
             <span className="text-emerald-500 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               GEO-ENGINE ACTIVE
             </span>
           </div>
        </div>
      </aside>
      
      <main className="flex-1 relative bg-black overflow-hidden group/map">
        {/* Mapa Dinámico que responde a viewCenter y mapZoom */}
        <VectorMap lat={viewCenter.lat} lng={viewCenter.lng} zoom={mapZoom} />
        
        {/* Buscador Flotante sobre el Mapa */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
           <div className="bg-[#0E1117]/80 backdrop-blur-2xl border border-white/10 rounded-[28px] p-1.5 shadow-2xl flex items-center gap-3 group/search focus-within:ring-2 focus-within:ring-primary/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Search className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                placeholder="Buscar ubicación (Bello, Medellín, Cali...)"
                className="bg-transparent border-none outline-none text-sm flex-1 text-white placeholder:text-muted-foreground/60 py-3 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flex items-center gap-1 pr-2">
                <button className="p-3 hover:bg-white/5 rounded-2xl text-muted-foreground transition-colors">
                  <Layers className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button className="p-3 hover:bg-white/5 rounded-2xl text-muted-foreground transition-colors">
                  <Crosshair className="w-5 h-5" />
                </button>
              </div>
           </div>
        </div>
        
        {/* Controles del Mapa */}
        <div className="absolute top-8 right-8 flex flex-col gap-4 z-30">
          <div className="bg-[#0E1117]/90 backdrop-blur-xl border border-white/10 rounded-[24px] overflow-hidden flex flex-col shadow-2xl">
            <button 
              onClick={() => setMapZoom(prev => Math.min(prev + 1, 18))}
              className="p-4 hover:bg-white/5 border-b border-white/5 text-lg font-bold transition-colors text-white/80"
            >+</button>
            <button 
              onClick={() => setMapZoom(prev => Math.max(prev - 1, 5))}
              className="p-4 hover:bg-white/5 text-lg font-bold transition-colors text-white/80"
            >−</button>
          </div>
          <button className="w-14 h-14 bg-primary text-white rounded-[24px] shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-110 transition-all active:scale-95 group">
            <Maximize2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        {/* Telemetría Dinámica en Pantalla */}
        <div className="absolute bottom-8 left-8 flex items-end gap-4 z-30">
          <div className="bg-[#0E1117]/90 backdrop-blur-2xl border border-white/10 rounded-[28px] px-8 py-5 shadow-2xl border-l-4 border-l-primary">
            <div className="flex gap-10 items-center">
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Coordenadas Actuales</p>
                <p className="text-xs font-mono font-bold text-white/90">{viewCenter.lat.toFixed(6)}, {viewCenter.lng.toFixed(6)}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Nivel de Análisis</p>
                <p className="text-xs font-mono font-bold text-white/90">{mapZoom.toFixed(1)}x</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">Stream Geolocalizado</span>
              </div>
            </div>
          </div>
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
        "flex flex-col items-center justify-center py-5 rounded-[24px] border transition-all text-[9px] font-bold gap-3",
        active 
          ? "bg-primary/15 border-primary text-primary shadow-lg shadow-primary/10" 
          : "bg-black/30 border-white/5 text-muted-foreground hover:bg-white/5"
      )}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}
