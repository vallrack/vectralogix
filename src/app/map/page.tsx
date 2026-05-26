
"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { VectorMap } from '@/components/map/VectorMap';
import { 
  Square, 
  Circle, 
  Hexagon,
  Search,
  Save,
  Navigation,
  Trash2,
  Layers,
  Crosshair,
  List,
  MapPinned,
  Route as RouteIcon,
  Pencil,
  Eraser,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ToastAction } from '@/components/ui/toast';

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
];

export default function SpatialHub() {
  const [activeTab, setActiveTab] = useState('zonas');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [activeTool, setActiveTool] = useState('polygon');
  const [isSaving, setIsSaving] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newRouteName, setNewRouteName] = useState('');
  const [mapZoom, setMapZoom] = useState(14);
  const [viewCenter, setViewCenter] = useState({ lat: 4.6097, lng: -74.0817 });
  const [plannedPoints, setPlannedPoints] = useState<any[]>([]);
  const [zonePoints, setZonePoints] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const firestore = useFirestore();
  
  const zonesQuery = useMemo(() => firestore ? query(collection(firestore, 'zones'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const routesQuery = useMemo(() => firestore ? query(collection(firestore, 'routes'), orderBy('createdAt', 'desc')) : null, [firestore]);
  
  const { data: zones, loading: loadingZones } = useCollection(zonesQuery);
  const { data: savedRoutes, loading: loadingRoutes } = useCollection(routesQuery);

  const activeHexColor = useMemo(() => COLORS.find(c => c.id === selectedColor)?.hex || '#3b82f6', [selectedColor]);

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
    
    if (targetLat !== undefined && targetLng !== undefined) {
      setViewCenter({ lat: targetLat, lng: targetLng });
      setMapZoom(point.zoom || 15);
      if (point.name) {
        if (!point.stops) setNewZoneName(point.name);
        else setNewRouteName(point.name);
      }
    }
  };

  const handleGlobalSearch = (term: string) => {
    const queryTerm = term.toLowerCase().trim();
    if (!queryTerm) return;

    const matchedCity = COLOMBIA_DATABASE.find(c => c.name.toLowerCase().includes(queryTerm));
    if (matchedCity) {
      handleFocusPoint(matchedCity);
      setNewZoneName(matchedCity.name);
      toast({ title: "Localización Exitosa", description: `Enfocando en ${matchedCity.name}.` });
      return;
    }

    const matchedZone = zones?.find(z => z.name?.toLowerCase().includes(queryTerm));
    if (matchedZone) {
      handleFocusPoint(matchedZone);
      toast({ title: "Zona Detectada", description: `Centrando en ${matchedZone.name}.` });
      return;
    }
    
    toast({ title: "Sin Resultados", description: `No se encontró "${term}".` });
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!mapContainerRef.current || !isDrawing) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Cálculo inverso aproximado de coordenadas basado en el centro actual y zoom
    const worldSize = 256 * Math.pow(2, mapZoom);
    const lngScale = worldSize / 360;
    const latRad = viewCenter.lat * Math.PI / 180;
    const latScale = lngScale / Math.cos(latRad);

    const deltaX = x - rect.width / 2;
    const deltaY = y - rect.height / 2;

    const clickLng = viewCenter.lng + deltaX / lngScale;
    const clickLat = viewCenter.lat - deltaY / latScale;

    if (activeTab === 'rutas') {
      setPlannedPoints(prev => [...prev, { id: Date.now(), lat: clickLat, lng: clickLng }]);
    } else {
      setZonePoints(prev => [...prev, { id: Date.now(), lat: clickLat, lng: clickLng }]);
    }
  };

  const handleSaveZone = () => {
    if (!firestore) return;
    if (!newZoneName) {
      toast({ variant: "destructive", title: "Nombre requerido", description: "Por favor asigna un nombre a la zona." });
      return;
    }
    if (zonePoints.length === 0) {
      toast({ variant: "destructive", title: "Mapa vacío", description: "Dibuja al menos un punto en el mapa táctico." });
      return;
    }

    setIsSaving(true);
    const zoneData = {
      name: newZoneName,
      type: activeTool,
      color: activeHexColor,
      coordinates: zonePoints.map(p => ({ lat: p.lat, lng: p.lng })),
      zoom: mapZoom,
      createdAt: new Date().toISOString()
    };

    addDoc(collection(firestore, 'zones'), zoneData)
      .then(() => {
        toast({ 
          title: "Zona Registrada", 
          description: `"${newZoneName}" se guardó correctamente en la base de datos.`,
          action: (
            <ToastAction altText="Planear Ruta" onClick={() => { setActiveTab('rutas'); setNewRouteName(`Ruta ${newZoneName}`); setIsDrawing(true); }}>
              Planear Ruta
            </ToastAction>
          )
        });
        setNewZoneName('');
        setZonePoints([]);
        setIsDrawing(false);
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'zones',
          operation: 'create',
          requestResourceData: zoneData,
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleSaveRoute = () => {
    if (!firestore) return;
    if (!newRouteName) {
      toast({ variant: "destructive", title: "Nombre requerido", description: "Asigna un nombre a la planeación." });
      return;
    }
    if (plannedPoints.length < 2) {
      toast({ variant: "destructive", title: "Ruta incompleta", description: "Marca al menos 2 nodos para trazar una ruta." });
      return;
    }

    setIsSaving(true);
    const routeData = {
      name: newRouteName,
      stops: plannedPoints.map((p, i) => ({ lat: p.lat, lng: p.lng, order: i + 1 })),
      createdAt: new Date().toISOString()
    };

    addDoc(collection(firestore, 'routes'), routeData)
      .then(() => {
        toast({ title: "Ruta Guardada", description: "La planeación logística ha sido registrada exitosamente." });
        setNewRouteName('');
        setPlannedPoints([]);
        setIsDrawing(false);
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'routes',
          operation: 'create',
          requestResourceData: routeData,
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleDelete = async (coll: string, id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, coll, id));
      toast({ title: "Registro Eliminado", description: "El elemento ha sido removido del sistema." });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-body">
      <AppSidebar />
      
      <aside className="w-[420px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-primary/20">V</div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">Centro de Mando</h2>
              <p className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase">VectraLogix Hub</p>
            </div>
          </div>

          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            {ZONES_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setIsDrawing(false); }}
                className={cn(
                  "flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2",
                  (activeTab === tab.id) ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {activeTab === 'zonas' ? (
            <div className="space-y-8">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <Pencil className="w-3 h-3" /> Delimitar Cobertura
                  </h3>
                  <button 
                    onClick={() => setIsDrawing(!isDrawing)}
                    className={cn(
                      "text-[9px] font-bold px-3 py-1.5 rounded-full transition-all border",
                      isDrawing ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-200"
                    )}
                  >
                    {isDrawing ? 'MODO DIBUJO ACTIVO' : 'ACTIVAR DIBUJO'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Buscar Ciudad / Nombre</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ej: Bello (Enter para buscar)"
                        className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm font-medium"
                        value={newZoneName}
                        onChange={(e) => setNewZoneName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch(newZoneName)}
                      />
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 cursor-pointer" onClick={() => handleGlobalSearch(newZoneName)} />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-between bg-white p-3 rounded-xl border border-slate-200">
                    {COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.id)}
                        className={cn("w-7 h-7 rounded-full transition-all", color.class, selectedColor === color.id ? "ring-2 ring-primary scale-110 shadow-md" : "opacity-40 hover:opacity-100")}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <ToolButton active={activeTool === 'polygon'} onClick={() => setActiveTool('polygon')} icon={Hexagon} label="POLÍGONO" />
                    <ToolButton active={activeTool === 'rect'} onClick={() => setActiveTool('rect')} icon={Square} label="ÁREA" />
                    <ToolButton active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} icon={Circle} label="RADIO" />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Puntos: {zonePoints.length}</span>
                    <button 
                      onClick={() => setZonePoints([])} 
                      className="text-[9px] font-bold text-rose-500 uppercase flex items-center gap-1.5 hover:bg-rose-50 px-2 py-1 rounded-md transition-all"
                    >
                      <Eraser className="w-3.5 h-3.5" /> Limpiar
                    </button>
                  </div>

                  <button 
                    onClick={handleSaveZone}
                    disabled={isSaving || !newZoneName || zonePoints.length === 0}
                    className="w-full text-white py-4.5 rounded-xl text-xs font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all hover:brightness-110 active:scale-95"
                    style={{ backgroundColor: activeHexColor }}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'GUARDANDO...' : 'REGISTRAR ÁREA'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                  <List className="w-3 h-3" /> Zonas de Acción ({zones?.length || 0})
                </h3>
                <div className="space-y-2.5">
                  {loadingZones ? (
                    <div className="flex flex-col items-center py-10 gap-3 text-slate-300">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sincronizando...</p>
                    </div>
                  ) : zones && zones.length > 0 ? (
                    zones.map((zone) => (
                      <div key={zone.id} onClick={() => handleFocusPoint(zone)} className="flex items-center justify-between p-4.5 bg-white border border-slate-200 rounded-2xl hover:border-primary/40 transition-all group cursor-pointer shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: zone.color }} />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{zone.name}</p>
                            <p className="text-[9px] text-slate-400 uppercase">{zone.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={(e) => { e.stopPropagation(); setActiveTab('rutas'); setNewRouteName(`Ruta ${zone.name}`); setIsDrawing(true); }} className="p-2 hover:bg-primary/10 rounded-lg text-primary" title="Planificar Ruta"><RouteIcon className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete('zones', zone.id); }} className="p-2 hover:bg-red-50 rounded-lg text-red-500" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center py-12 gap-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl opacity-50">
                      <AlertCircle className="w-6 h-6 text-slate-300" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sin zonas registradas</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <Navigation className="w-3 h-3" /> Planeación Logística
                  </h3>
                  <button 
                    onClick={() => setIsDrawing(!isDrawing)}
                    className={cn(
                      "text-[9px] font-bold px-3 py-1.5 rounded-full transition-all border",
                      isDrawing ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-200"
                    )}
                  >
                    {isDrawing ? 'MODO DIBUJO ACTIVO' : 'ACTIVAR DIBUJO'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Nombre de la Ruta</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Entrega Norte 01..." 
                      className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm font-medium"
                      value={newRouteName} 
                      onChange={(e) => setNewRouteName(e.target.value)} 
                    />
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Nodos: {plannedPoints.length}</span>
                    <button 
                      onClick={() => setPlannedPoints([])} 
                      className="text-[9px] font-bold text-rose-500 uppercase flex items-center gap-1.5 hover:bg-rose-50 px-2 py-1 rounded-md transition-all"
                    >
                      <Eraser className="w-3.5 h-3.5" /> Limpiar
                    </button>
                  </div>
                  <button 
                    onClick={handleSaveRoute} 
                    disabled={isSaving || !newRouteName || plannedPoints.length < 2} 
                    className="w-full bg-primary text-white py-4.5 rounded-xl text-xs font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'GUARDANDO...' : 'GUARDAR PLANEACIÓN'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                  <RouteIcon className="w-3 h-3" /> Rutas del Sistema ({savedRoutes?.length || 0})
                </h3>
                <div className="space-y-2.5">
                  {loadingRoutes ? (
                    <div className="flex flex-col items-center py-10 gap-3 text-slate-300">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sincronizando...</p>
                    </div>
                  ) : savedRoutes && savedRoutes.length > 0 ? (
                    savedRoutes.map((route) => (
                      <div key={route.id} onClick={() => handleFocusPoint(route)} className="flex items-center justify-between p-4.5 bg-white border border-slate-200 rounded-2xl hover:border-primary/40 transition-all group cursor-pointer shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><RouteIcon className="w-5 h-5" /></div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{route.name}</p>
                            <p className="text-[9px] text-slate-400 uppercase">{route.stops?.length || 0} Paradas</p>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete('routes', route.id); }} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg text-red-500 transition-all" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center py-12 gap-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl opacity-50">
                      <AlertCircle className="w-6 h-6 text-slate-300" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sin rutas registradas</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
      
      <main ref={mapContainerRef} className="flex-1 relative bg-slate-100 overflow-hidden">
        {/* Capa táctica activa solo en modo dibujo para capturar clics */}
        {isDrawing && (
          <div 
            className="absolute inset-0 z-40 cursor-crosshair bg-transparent" 
            onClick={handleMapClick} 
          />
        )}
        
        <VectorMap 
          lat={viewCenter.lat} 
          lng={viewCenter.lng} 
          zoom={mapZoom} 
          plannedPoints={plannedPoints}
          zonePoints={zonePoints}
          zones={zones}
          savedRoutes={savedRoutes}
          containerRef={mapContainerRef}
          activeColor={activeHexColor}
        />
        
        <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-50">
          <button onClick={() => setMapZoom(prev => Math.min(prev + 1, 21))} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 hover:bg-slate-50 shadow-xl font-bold text-lg transition-all active:scale-90">+</button>
          <button onClick={() => setMapZoom(prev => Math.max(prev - 1, 5))} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 hover:bg-slate-50 shadow-xl font-bold text-lg transition-all active:scale-90">-</button>
          <button onClick={() => { setViewCenter({ lat: 4.6097, lng: -74.0817 }); setMapZoom(12); }} className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 hover:scale-105 transition-all active:scale-90"><Crosshair className="w-5 h-5" /></button>
        </div>

        <div className="absolute top-10 right-10 z-50">
          <AnimatePresence>
            {isDrawing && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-[10px] uppercase tracking-widest" style={{ backgroundColor: activeHexColor }}>
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                CAPA TÁCTICA: {activeTab === 'rutas' ? 'PLANEACIÓN' : 'DELIMITACIÓN'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function ToolButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center justify-center py-4 rounded-2xl border transition-all gap-2 group", active ? "bg-primary/5 border-primary text-primary shadow-sm" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50")}>
      <Icon className={cn("w-4.5 h-4.5 transition-transform group-hover:scale-110", active && "scale-110")} />
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
