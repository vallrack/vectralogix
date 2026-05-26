
"use client";

import React, { useState, useMemo, useRef } from 'react';
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
  MousePointer2,
  List,
  MapPinned,
  Route as RouteIcon,
  X,
  Target
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
  { id: 'c6', name: 'Cartagena', lat: 10.3910, lng: -75.4794, type: 'Ciudad', color: '#3b82f6' },
  { id: 'c7', name: 'Bucaramanga', lat: 7.1193, lng: -73.1227, type: 'Ciudad', color: '#10b981' },
];

export default function SpatialHub() {
  const [activeTab, setActiveTab] = useState('zonas');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [activeTool, setActiveTool] = useState('polygon');
  const [isSaving, setIsSaving] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newRouteName, setNewRouteName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapZoom, setMapZoom] = useState(14);
  const [viewCenter, setViewCenter] = useState({ lat: 4.6097, lng: -74.0817 });
  const [plannedPoints, setPlannedPoints] = useState<any[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const firestore = useFirestore();
  
  const zonesQuery = useMemo(() => firestore ? collection(firestore, 'zones') : null, [firestore]);
  const routesQuery = useMemo(() => firestore ? collection(firestore, 'routes') : null, [firestore]);
  
  const { data: zones, loading: zonesLoading } = useCollection(zonesQuery);
  const { data: savedRoutes, loading: routesLoading } = useCollection(routesQuery);

  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return null;
    
    const matchedZones = (zones || []).filter(z => z.name.toLowerCase().includes(query));
    const matchedRoutes = (savedRoutes || []).filter(r => r.name.toLowerCase().includes(query));
    const matchedMapPoints = COLOMBIA_DATABASE.filter(l => l.name.toLowerCase().includes(query));
    
    return { 
      savedZones: matchedZones, 
      savedRoutes: matchedRoutes, 
      mapPoints: matchedMapPoints 
    };
  }, [zones, savedRoutes, searchQuery]);

  const handleFocusPoint = (point: any) => {
    let targetLat = point.lat;
    let targetLng = point.lng;

    if (point.coordinates && point.coordinates.length > 0) {
      targetLat = point.coordinates[0].lat;
      targetLng = point.coordinates[0].lng;
    } else if (point.stops && point.stops.length > 0) {
      targetLat = point.stops[0].lat;
      targetLng = point.stops[0].lng;
    }
    
    const targetZoom = point.zoom || 15; 
    
    if (targetLat !== undefined && targetLng !== undefined) {
      setViewCenter({ lat: targetLat, lng: targetLng });
      setMapZoom(targetZoom);
      toast({
        title: "Enfoque Táctico",
        description: `Visualizando: ${point.name}`,
      });
      setSearchQuery('');
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (activeTab !== 'rutas' || !mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const worldSize = 256 * Math.pow(2, mapZoom);
    const lngScale = worldSize / 360;
    const latRad = viewCenter.lat * Math.PI / 180;
    const latScale = lngScale / Math.cos(latRad);

    const deltaX = x - rect.width / 2;
    const deltaY = y - rect.height / 2;

    const clickLng = viewCenter.lng + deltaX / lngScale;
    const clickLat = viewCenter.lat - deltaY / latScale;

    const newPoint = {
      id: Date.now(),
      name: `Nodo ${plannedPoints.length + 1}`,
      lat: clickLat,
      lng: clickLng
    };

    setPlannedPoints([...plannedPoints, newPoint]);
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
      zoom: mapZoom,
      createdAt: serverTimestamp()
    };

    addDoc(collection(firestore, 'zones'), zoneData)
      .then(() => {
        toast({ title: "Zona Guardada", description: "Perímetro registrado exitosamente." });
        setNewZoneName('');
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

  const handleSaveRoute = () => {
    if (!firestore || !newRouteName || plannedPoints.length < 2) {
      toast({ 
        variant: "destructive", 
        title: "Validación Fallida", 
        description: "Nombre y al menos 2 nodos requeridos." 
      });
      return;
    }
    setIsSaving(true);
    
    const routeData = {
      name: newRouteName,
      stops: plannedPoints.map((p, i) => ({ lat: p.lat, lng: p.lng, order: i + 1 })),
      createdAt: serverTimestamp()
    };

    addDoc(collection(firestore, 'routes'), routeData)
      .then(() => {
        toast({ title: "Ruta Guardada", description: "Secuencia logística almacenada." });
        setNewRouteName('');
        setPlannedPoints([]);
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'routes',
          operation: 'create',
          requestResourceData: routeData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-body">
      <AppSidebar />
      
      <aside className="w-[420px] min-w-[420px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl relative">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-primary/20">
              V
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">Cartografía Táctica</h2>
              <p className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase">VectraLogix Hub</p>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar zonas, rutas o ciudades..." 
              className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-10 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            {ZONES_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery('');
                }}
                className={cn(
                  "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2",
                  (activeTab === tab.id && !searchQuery)
                    ? "bg-white text-primary shadow-sm" 
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-white">
          <AnimatePresence mode="wait">
            {searchQuery ? (
              <motion.div 
                key="search-results"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2 px-2">
                  Resultados de Búsqueda
                </h3>

                <div className="space-y-6">
                  {searchResults?.mapPoints.length === 0 && 
                   searchResults?.savedZones.length === 0 && 
                   searchResults?.savedRoutes.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-dashed border-slate-200">
                        <Search className="w-6 h-6 text-slate-200" />
                      </div>
                      <p className="text-xs text-slate-400">No se encontraron objetivos tácticos.</p>
                    </div>
                  ) : (
                    <>
                      {searchResults?.mapPoints.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2">Ubicaciones del Territorio</h4>
                          {searchResults.mapPoints.map((point) => (
                            <SearchItem key={point.id} point={point} onClick={() => handleFocusPoint(point)} />
                          ))}
                        </div>
                      )}

                      {searchResults?.savedZones.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest px-2">Zonas Registradas</h4>
                          {searchResults.savedZones.map((point) => (
                            <SearchItem key={point.id} point={point} onClick={() => handleFocusPoint(point)} isSaved />
                          ))}
                        </div>
                      )}

                      {searchResults?.savedRoutes.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[9px] font-bold text-accent uppercase tracking-widest px-2">Planeaciones Guardadas</h4>
                          {searchResults.savedRoutes.map((point) => (
                            <SearchItem key={point.id} point={point} onClick={() => handleFocusPoint(point)} isSaved />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <>
                {activeTab === 'zonas' && (
                  <motion.div 
                    key="zonas"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                        <MousePointer2 className="w-3 h-3" />
                        Delimitar Área
                      </h3>

                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Nombre de la Zona</label>
                          <input 
                            type="text" 
                            placeholder="Ej: Sector Norte A..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Color de Referencia</label>
                          <div className="flex gap-3 justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            {COLORS.map((color) => (
                              <button
                                key={color.id}
                                onClick={() => setSelectedColor(color.id)}
                                className={cn(
                                  "w-7 h-7 rounded-full transition-all ring-offset-2 ring-offset-card",
                                  color.class,
                                  selectedColor === color.id ? "ring-2 ring-primary scale-110 shadow-md" : "opacity-40 hover:opacity-100"
                                )}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <ToolButton active={activeTool === 'polygon'} onClick={() => setActiveTool('polygon')} icon={Hexagon} label="POLÍGONO" />
                          <ToolButton active={activeTool === 'rect'} onClick={() => setActiveTool('rect')} icon={Square} label="ÁREA" />
                          <ToolButton active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} icon={Circle} label="RADIO" />
                        </div>

                        <button 
                          onClick={handleSaveZone}
                          disabled={isSaving || !newZoneName}
                          className="w-full bg-primary text-white py-4 rounded-xl text-xs font-bold flex items-center justify-center gap-3 hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? 'GUARDANDO...' : 'REGISTRAR ZONA'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                        <List className="w-3 h-3" />
                        Zonas Activas ({zones?.length || 0})
                      </h3>
                      
                      <div className="space-y-2">
                        {zonesLoading ? (
                          <div className="py-12 flex justify-center"><RefreshCw className="w-8 h-8 animate-spin text-primary/30" /></div>
                        ) : (
                          zones?.map((zone) => (
                            <div 
                              key={zone.id} 
                              onClick={() => handleFocusPoint(zone)}
                              className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-primary/30 hover:bg-slate-50 transition-all group cursor-pointer shadow-sm"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: zone.color }} />
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{zone.name}</p>
                                  <p className="text-[9px] text-slate-400 uppercase tracking-widest">{zone.type}</p>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (firestore) deleteDoc(doc(firestore, 'zones', zone.id));
                                }} 
                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg text-red-500 transition-all"
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
                    className="space-y-8"
                  >
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                        <Navigation className="w-3 h-3" />
                        Trazar Nueva Ruta
                      </h3>
                      
                      <div className="space-y-4">
                        <p className="text-[10px] text-slate-500 italic mb-2">Haz clic directamente sobre el mapa para añadir nodos logísticos.</p>
                        <input 
                          type="text" 
                          placeholder="Nombre de la ruta estratégica..."
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                          value={newRouteName}
                          onChange={(e) => setNewRouteName(e.target.value)}
                        />
                        
                        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Nodos Marcados: {plannedPoints.length}</span>
                          <button 
                            onClick={() => setPlannedPoints([])}
                            className="text-[9px] font-bold text-red-500 uppercase hover:underline"
                          >
                            Limpiar Mapa
                          </button>
                        </div>

                        <button 
                          onClick={handleSaveRoute}
                          disabled={isSaving || !newRouteName || plannedPoints.length < 2}
                          className="w-full bg-primary text-white py-4 rounded-xl text-xs font-bold flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? 'GUARDANDO...' : 'GUARDAR PLANEACIÓN'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                        <RouteIcon className="w-3 h-3" />
                        Planeaciones Activas ({savedRoutes?.length || 0})
                      </h3>
                      
                      <div className="space-y-2">
                        {routesLoading ? (
                          <div className="py-12 flex justify-center"><RefreshCw className="w-8 h-8 animate-spin text-primary/30" /></div>
                        ) : (
                          savedRoutes?.map((route) => (
                            <div 
                              key={route.id} 
                              onClick={() => handleFocusPoint(route)}
                              className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-primary/30 hover:bg-slate-50 transition-all group cursor-pointer shadow-sm"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                  <RouteIcon className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{route.name}</p>
                                  <p className="text-[9px] text-slate-400 uppercase tracking-widest">{route.stops?.length || 0} Nodos</p>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (firestore) deleteDoc(doc(firestore, 'routes', route.id));
                                }} 
                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg text-red-500 transition-all"
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
              </>
            )}
          </AnimatePresence>
        </div>
      </aside>
      
      <main 
        ref={mapContainerRef}
        className={cn(
          "flex-1 relative bg-slate-100 overflow-hidden transition-all duration-500",
          activeTab === 'rutas' ? "cursor-crosshair ring-inset ring-4 ring-primary/10" : "cursor-default"
        )}
        onClick={handleMapClick}
      >
        <VectorMap 
          lat={viewCenter.lat} 
          lng={viewCenter.lng} 
          zoom={mapZoom} 
          plannedPoints={plannedPoints}
          zones={zones}
          savedRoutes={savedRoutes}
          containerRef={mapContainerRef}
        />
        
        <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-30">
          <button 
            onClick={() => setMapZoom(prev => Math.min(prev + 1, 21))}
            className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-xl transition-all font-bold text-lg"
          >
            +
          </button>
          <button 
            onClick={() => setMapZoom(prev => Math.max(prev - 1, 5))}
            className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-xl transition-all font-bold text-lg"
          >
            -
          </button>
          <button 
            onClick={() => { setViewCenter({ lat: 4.6097, lng: -74.0817 }); setMapZoom(12); }}
            className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 hover:scale-105 transition-all"
          >
            <Crosshair className="w-5 h-5" />
          </button>
        </div>

        {activeTab === 'rutas' && (
          <div className="absolute top-10 right-10 z-30 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-primary text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-xs"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              MODO PLANEACIÓN ACTIVO
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

function ToolButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center justify-center py-4 rounded-2xl border transition-all gap-2", active ? "bg-primary/5 border-primary text-primary shadow-sm" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50")}>
      <Icon className="w-4 h-4" />
      <span className="text-[8px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function SearchItem({ point, onClick, isSaved = false }: any) {
  return (
    <div onClick={onClick} className={cn("flex items-center justify-between p-4 border rounded-2xl transition-all cursor-pointer group", isSaved ? "bg-primary/5 border-primary/20 hover:bg-primary/10" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm")}>
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", isSaved ? "bg-primary/10 border-primary/20 text-primary" : "bg-slate-50 border-slate-200 text-slate-400")}>
          {isSaved ? (point.stops ? <Target className="w-4 h-4" /> : <Layers className="w-4 h-4" />) : <MapPin className="w-4 h-4" />}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">{point.name}</p>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest">
            {isSaved ? (point.stops ? 'Planeación' : 'Zona Táctica') : (point.type || 'Ubicación')}
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
    </div>
  );
}
