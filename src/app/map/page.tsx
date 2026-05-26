
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
  MapPin,
  Trash2,
  Layers,
  Crosshair,
  Map as MapIcon,
  MousePointer2,
  List,
  MapPinned,
  LocateFixed,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const ZONES_TABS = [
  { id: 'zonas', label: 'Zonas', icon: Layers },
  { id: 'rutas', label: 'Planeación', icon: MapPinned },
  { id: 'buscar', label: 'Explorar', icon: Search },
];

const COLORS = [
  { id: 'blue', class: 'bg-blue-500', hex: '#3b82f6' },
  { id: 'green', class: 'bg-emerald-500', hex: '#10b981' },
  { id: 'red', class: 'bg-rose-500', hex: '#f43f5e' },
  { id: 'orange', class: 'bg-amber-500', hex: '#f59e0b' },
  { id: 'purple', class: 'bg-violet-500', hex: '#8b5cf6' },
];

const COLOMBIA_DATABASE = [
  { id: 'c1', name: 'Bello', lat: 6.3373, lng: -75.5579, type: 'Ciudad', color: '#3b82f6' },
  { id: 'c2', name: 'Medellín', lat: 6.2442, lng: -75.5812, type: 'Ciudad', color: '#10b981' },
  { id: 'c3', name: 'Bogotá', lat: 4.6097, lng: -74.0817, type: 'Capital', color: '#f43f5e' },
  { id: 'c4', name: 'Cali', lat: 3.4516, lng: -76.5320, type: 'Ciudad', color: '#f59e0b' },
  { id: 'c5', name: 'Barranquilla', lat: 10.9639, lng: -74.7964, type: 'Ciudad', color: '#8b5cf6' },
  { id: 'c6', name: 'Cartagena', lat: 10.4236, lng: -75.5251, type: 'Ciudad', color: '#0ea5e9' },
  { id: 'c7', name: 'Bucaramanga', lat: 7.1193, lng: -73.1227, type: 'Ciudad', color: '#10b981' },
  { id: 'c8', name: 'Pereira', lat: 4.8133, lng: -75.6961, type: 'Ciudad', color: '#f59e0b' },
];

export default function SpatialHub() {
  const [activeTab, setActiveTab] = useState('zonas');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [activeTool, setActiveTool] = useState('polygon');
  const [isSaving, setIsSaving] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapZoom, setMapZoom] = useState(12);
  const [viewCenter, setViewCenter] = useState({ lat: 4.6097, lng: -74.0817 });
  const [plannedPoints, setPlannedPoints] = useState<any[]>([]);

  const firestore = useFirestore();
  const zonesQuery = useMemo(() => firestore ? collection(firestore, 'zones') : null, [firestore]);
  const { data: zones, loading: zonesLoading } = useCollection(zonesQuery);

  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return { saved: [], mapPoints: [] };
    const saved = (zones || []).filter(z => z.name.toLowerCase().includes(query));
    const mapPoints = COLOMBIA_DATABASE.filter(l => l.name.toLowerCase().includes(query));
    return { saved, mapPoints };
  }, [zones, searchQuery]);

  const handleFocusPoint = (point: any) => {
    const lat = point.lat || point.coordinates?.[0]?.lat;
    const lng = point.lng || point.coordinates?.[0]?.lng;
    
    if (lat && lng) {
      setViewCenter({ lat, lng });
      setMapZoom(16);
      setShowSearchResults(false);
      setSearchQuery(point.name);
      toast({ 
        title: `Geo-Lock: ${point.name}`, 
        description: `Posicionando cámara en coordenadas de análisis táctico.` 
      });
    }
  };

  const handleEditorSearch = () => {
    const match = COLOMBIA_DATABASE.find(c => c.name.toLowerCase().includes(newZoneName.toLowerCase()));
    if (match) {
      handleFocusPoint(match);
    } else {
      toast({ 
        variant: "destructive",
        title: "Ubicación no encontrada", 
        description: "Intente con ciudades principales de Colombia para geolocalización." 
      });
    }
  };

  const handleSaveZone = () => {
    if (!firestore || !newZoneName) return;
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
        toast({ title: "Zona Estratégica Guardada", description: "Perímetro registrado. Iniciando zoom de exploración." });
        setNewZoneName('');
        // Efecto de zoom automático para explorar la zona creada
        setMapZoom(17); 
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

  const addPlanningPoint = () => {
    const newPoint = {
      id: Date.now(),
      name: `Nodo ${plannedPoints.length + 1}`,
      lat: viewCenter.lat,
      lng: viewCenter.lng
    };
    setPlannedPoints([...plannedPoints, newPoint]);
    toast({ 
      title: "Punto de Ruta Fijado", 
      description: "Añadido a la planeación estratégica. Trazando vector de ruta." 
    });
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    const delta = e.deltaY;
    if (delta > 0) {
      setMapZoom(prev => Math.max(prev - 0.5, 5));
    } else {
      setMapZoom(prev => Math.min(prev + 0.5, 18));
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0C10] text-foreground overflow-hidden font-body">
      <AppSidebar />
      
      <aside className="w-[420px] min-w-[420px] bg-[#0E1117] border-r border-white/5 flex flex-col z-20 shadow-2xl relative">
        <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-bold text-xl shadow-xl shadow-primary/30 rotate-3 transition-transform hover:rotate-0">
              V
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white uppercase">Vectra Control Room</h2>
              <p className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase">Cartografía Táctica</p>
            </div>
          </div>

          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
            {ZONES_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2",
                  activeTab === tab.id 
                    ? "bg-primary text-white shadow-lg" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
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
                <div className="glass-panel rounded-[32px] p-7 space-y-7 bg-[#161B22]/60 border-primary/10">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <MousePointer2 className="w-3 h-3" />
                    Editor de Perímetros
                  </h3>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">Geolocalizar Lugar</label>
                      <div className="relative group">
                        <input 
                          type="text" 
                          placeholder="Buscar ciudad (ej: Medellín)..."
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-xs focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/30 text-white"
                          value={newZoneName}
                          onChange={(e) => setNewZoneName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleEditorSearch()}
                        />
                        <button 
                          onClick={handleEditorSearch}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-xl text-primary transition-all"
                        >
                          <LocateFixed className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">Color de Identificación</label>
                      <div className="flex gap-4 justify-between bg-black/20 p-3 rounded-2xl border border-white/5">
                        {COLORS.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => setSelectedColor(color.id)}
                            className={cn(
                              "w-8 h-8 rounded-full transition-all ring-offset-4 ring-offset-[#0E1117]",
                              color.class,
                              selectedColor === color.id ? "ring-2 ring-white scale-110 shadow-lg shadow-white/10" : "opacity-40 hover:opacity-100"
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <ToolButton active={activeTool === 'polygon'} onClick={() => { setActiveTool('polygon'); }} icon={Hexagon} label="POLÍGONO" />
                      <ToolButton active={activeTool === 'rect'} onClick={() => { setActiveTool('rect'); }} icon={Square} label="ÁREA" />
                      <ToolButton active={activeTool === 'circle'} onClick={() => { setActiveTool('circle'); }} icon={RADIO} label="RADIO" />
                    </div>

                    <button 
                      onClick={handleSaveZone}
                      disabled={isSaving || !newZoneName}
                      className="w-full bg-primary text-white py-5 rounded-[24px] text-xs font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/20 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'REGISTRANDO...' : 'REGISTRAR Y EXPLORAR'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-2">
                    <List className="w-3 h-3" />
                    Zonas Estratégicas ({zones?.length || 0})
                  </h3>
                  
                  <div className="space-y-3">
                    {zonesLoading ? (
                      <div className="py-12 flex justify-center"><RefreshCw className="w-8 h-8 animate-spin text-primary/30" /></div>
                    ) : (
                      zones?.map((zone) => (
                        <div 
                          key={zone.id} 
                          onClick={() => handleFocusPoint(zone)}
                          className="flex items-center justify-between p-5 bg-[#161B22]/40 border border-white/5 rounded-[24px] hover:bg-white/5 hover:border-primary/30 transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-12 rounded-full shadow-lg" style={{ backgroundColor: zone.color }} />
                            <div>
                              <p className="text-xs font-bold text-white/90">{zone.name}</p>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{zone.type} • Análisis Activo</p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDoc(doc(firestore!, 'zones', zone.id));
                            }} 
                            className="p-3 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 rounded-xl text-rose-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="glass-panel p-6 rounded-[32px] border-accent/20 bg-accent/5">
                  <h3 className="text-xs font-bold text-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Trazado de Nodos
                  </h3>
                  <p className="text-[11px] text-muted-foreground mb-6 leading-relaxed">Posicione el centro del mapa sobre el punto deseado y fije un nodo para trazar el vector de ruta.</p>
                  
                  <button 
                    onClick={addPlanningPoint}
                    className="w-full bg-accent text-white py-4 rounded-2xl text-[10px] font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-accent/20"
                  >
                    <MapPin className="w-4 h-4" />
                    FIJAR NODO ESTRATÉGICO
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-2">PLANES DE RUTA ({plannedPoints.length})</h3>
                  {plannedPoints.length === 0 ? (
                    <div className="py-20 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center text-center px-8">
                       <Navigation className="w-10 h-10 text-white/5 mb-4" />
                       <p className="text-[11px] text-muted-foreground">Inicie el trazado fijando nodos dentro de su perímetro operativo.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {plannedPoints.map((point, idx) => (
                        <div key={point.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-accent/40 transition-all cursor-pointer" onClick={() => handleFocusPoint(point)}>
                          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-white/90">{point.name}</p>
                            <p className="text-[9px] text-muted-foreground font-mono">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setPlannedPoints(plannedPoints.filter(p => p.id !== point.id)); }} className="text-muted-foreground hover:text-rose-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'buscar' && (
              <motion.div 
                key="buscar"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Explorar territorio colombiano..." 
                    className="w-full bg-black/40 border border-white/10 rounded-[20px] py-4 pl-12 pr-4 text-xs focus:ring-1 focus:ring-primary outline-none transition-all text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-2">LOCALIZACIONES ENCONTRADAS</h3>
                  {searchResults.mapPoints.length === 0 && searchResults.saved.length === 0 && searchQuery ? (
                    <p className="text-xs text-muted-foreground text-center py-10 italic">Sin resultados para esta geolocalización.</p>
                  ) : (
                    <div className="space-y-3">
                      {searchResults.mapPoints.map((point) => (
                        <SearchItem key={point.id} point={point} onClick={() => handleFocusPoint(point)} />
                      ))}
                      {searchResults.saved.map((point) => (
                        <SearchItem key={point.id} point={point} onClick={() => handleFocusPoint(point)} isSaved />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="p-6 border-t border-white/5 bg-black/40">
           <div className="flex items-center justify-between text-[9px] font-bold tracking-widest">
             <span className="text-muted-foreground uppercase tracking-widest">System Core v5.0</span>
             <span className="text-emerald-500 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               MAP INTERACTIVE
             </span>
           </div>
        </div>
      </aside>
      
      <main 
        className="flex-1 relative bg-[#05070A] overflow-hidden"
        onWheel={handleWheelZoom}
      >
        <VectorMap 
          lat={viewCenter.lat} 
          lng={viewCenter.lng} 
          zoom={mapZoom} 
          plannedPoints={plannedPoints}
          zones={zones}
        />
        
        {/* Buscador Flotante Estilo Google Maps */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
           <div className="relative group">
              <div className="bg-[#0E1117]/90 backdrop-blur-3xl border border-white/10 rounded-[32px] p-2 shadow-2xl flex items-center gap-4 focus-within:ring-2 focus-within:ring-primary/40 transition-all hover:bg-[#161B22]/95">
                <div className="w-12 h-12 rounded-[22px] bg-primary/10 flex items-center justify-center text-primary group-focus-within:bg-primary group-focus-within:text-white transition-all">
                  <Search className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  placeholder="Geolocalizar en el territorio..."
                  className="bg-transparent border-none outline-none text-sm flex-1 text-white placeholder:text-muted-foreground/40 font-medium"
                  value={searchQuery}
                  onFocus={() => setShowSearchResults(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                />
                <div className="flex items-center gap-2 pr-2">
                  <button className="w-10 h-10 hover:bg-white/5 rounded-2xl text-muted-foreground flex items-center justify-center transition-all" onClick={() => { setViewCenter({ lat: 4.6097, lng: -74.0817 }); setMapZoom(12); }}>
                    <Crosshair className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showSearchResults && searchQuery && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-[calc(100%+12px)] left-0 w-full bg-[#0E1117]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl max-h-[400px] overflow-y-auto z-40 custom-scrollbar"
                  >
                    <div className="p-4 space-y-1">
                      {searchResults.mapPoints.map(point => (
                        <SearchItemMini key={point.id} point={point} onClick={() => handleFocusPoint(point)} />
                      ))}
                      {searchResults.saved.map(point => (
                        <SearchItemMini key={point.id} point={point} onClick={() => handleFocusPoint(point)} isSaved />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
        
        {/* Controles de Zoom Manual */}
        <div className="absolute bottom-8 right-8 flex flex-col gap-4 z-30">
          <div className="bg-[#0E1117]/90 backdrop-blur-xl border border-white/10 rounded-[28px] p-1 flex flex-col shadow-2xl overflow-hidden">
            <button 
              onClick={() => setMapZoom(prev => Math.min(prev + 0.5, 18))}
              className="w-14 h-14 hover:bg-white/10 text-lg font-bold transition-all text-white/60 hover:text-white"
            >+</button>
            <div className="h-[1px] bg-white/5 mx-2" />
            <button 
              onClick={() => setMapZoom(prev => Math.max(prev - 0.5, 5))}
              className="w-14 h-14 hover:bg-white/10 text-lg font-bold transition-all text-white/60 hover:text-white"
            >−</button>
          </div>
        </div>

        {/* Telemetría Dinámica */}
        <div className="absolute bottom-8 left-8 z-30 pointer-events-none">
          <div className="bg-[#0E1117]/90 backdrop-blur-3xl border border-white/10 rounded-[32px] px-10 py-6 shadow-2xl border-l-8 border-l-primary flex gap-12 items-center">
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">COORDENADAS ACTUALES</p>
              <p className="text-xs font-mono font-bold text-white tracking-widest">{viewCenter.lat.toFixed(6)}, {viewCenter.lng.toFixed(6)}</p>
            </div>
            <div className="w-[1px] h-10 bg-white/10" />
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">RADIO DE ANÁLISIS</p>
              <p className="text-xs font-mono font-bold text-white uppercase tracking-widest">{(20 - mapZoom) * 0.4} KM TÁCTICOS</p>
            </div>
          </div>
        </div>
      </main>

      {showSearchResults && <div className="fixed inset-0 z-20" onClick={() => setShowSearchResults(false)} />}
    </div>
  );
}

function ToolButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center py-5 rounded-[28px] border transition-all gap-3",
        active 
          ? "bg-primary/20 border-primary text-primary shadow-xl shadow-primary/10" 
          : "bg-black/30 border-white/5 text-muted-foreground hover:bg-white/5 hover:border-white/10"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function SearchItem({ point, onClick, isSaved = false }: any) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-5 border rounded-[28px] transition-all cursor-pointer group",
        isSaved ? "bg-primary/5 border-primary/20 hover:bg-primary/10" : "bg-accent/5 border-accent/10 hover:bg-accent/10"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-2xl bg-black/60 flex items-center justify-center border", isSaved ? "border-primary/20" : "border-accent/20")}>
          {isSaved ? <MapIcon className="w-5 h-5 text-primary" /> : <MapPin className="w-5 h-5 text-accent" />}
        </div>
        <div>
          <p className="text-sm font-bold text-white/90">{point.name}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{isSaved ? 'Zona Estratégica' : point.type}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
    </div>
  );
}

function SearchItemMini({ point, onClick, isSaved = false }: any) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 p-4 hover:bg-white/5 transition-all cursor-pointer rounded-2xl group"
    >
      <div className={cn("w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5", isSaved ? "text-primary" : "text-accent")}>
        {isSaved ? <MapIcon className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-white/90 group-hover:text-primary transition-colors">{point.name}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{isSaved ? 'Perímetro Registrado' : point.type}</p>
      </div>
      <div className="text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        {point.lat.toFixed(3)}, {point.lng.toFixed(3)}
      </div>
    </div>
  );
}
