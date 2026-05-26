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
  Hand
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, query, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ToastAction } from '@/components/ui/toast';
import { geocodeLocation } from '@/ai/flows/geocode-location';

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

export default function SpatialHub() {
  const [activeTab, setActiveTab] = useState('zonas');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [activeTool, setActiveTool] = useState('navigate');
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newRouteName, setNewRouteName] = useState('');
  const [mapZoom, setMapZoom] = useState(14);
  const [viewCenter, setViewCenter] = useState({ lat: 4.6097, lng: -74.0817 });
  const [plannedPoints, setPlannedPoints] = useState<any[]>([]);
  const [zonePoints, setZonePoints] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number, y: number, centerLat: number, centerLng: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const firestore = useFirestore();
  
  const zonesQuery = useMemo(() => firestore ? query(collection(firestore, 'zones')) : null, [firestore]);
  const routesQuery = useMemo(() => firestore ? query(collection(firestore, 'routes')) : null, [firestore]);
  
  const { data: zones, loading: loadingZones } = useCollection(zonesQuery);
  const { data: savedRoutes, loading: loadingRoutes } = useCollection(routesQuery);

  const activeHexColor = useMemo(() => COLORS.find(c => c.id === selectedColor)?.hex || '#3b82f6', [selectedColor]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'navigate') {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        centerLat: viewCenter.lat,
        centerLng: viewCenter.lng
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStartRef.current && mapContainerRef.current) {
      const deltaX = e.clientX - panStartRef.current.x;
      const deltaY = e.clientY - panStartRef.current.y;

      const worldSize = 256 * Math.pow(2, mapZoom);
      const lngScale = worldSize / 360;
      const latRad = panStartRef.current.centerLat * Math.PI / 180;
      const latScale = lngScale / Math.cos(latRad);

      const newLng = panStartRef.current.centerLng - (deltaX / lngScale);
      const newLat = panStartRef.current.centerLat + (deltaY / latScale);

      setViewCenter({ lat: newLat, lng: newLng });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };

  const handleGlobalSearch = async (term: string) => {
    const queryTerm = term.toLowerCase().trim();
    if (!queryTerm) return;

    setIsSearching(true);
    try {
      const response = await geocodeLocation({ query: queryTerm });
      if (response.success && response.data) {
        setViewCenter({ lat: response.data.lat, lng: response.data.lng });
        setMapZoom(response.data.zoom);
        
        if (activeTab === 'zonas') {
          setNewZoneName(response.data.displayName);
        } else {
          setNewRouteName(`Ruta ${response.data.displayName}`);
        }
        
        toast({ 
          title: "Ubicación Localizada", 
          description: `Mapa posicionado en ${response.data.displayName}.` 
        });
      } else {
        toast({ 
          variant: "destructive", 
          title: response.isApiKeyError ? "Error de Seguridad" : "Error de Localización", 
          description: response.error || "No se pudo encontrar la ubicación solicitada." 
        });
      }
    } catch (error) {
      console.error(error);
      toast({ 
        variant: "destructive", 
        title: "Error de Sistema", 
        description: "El servicio de geocodificación no respondió. Intente de nuevo." 
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!mapContainerRef.current || !isDrawing) return;

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

    if (activeTab === 'rutas') {
      setPlannedPoints(prev => [...prev, { id: Date.now(), lat: clickLat, lng: clickLng }]);
    } else {
      setZonePoints(prev => [...prev, { id: Date.now(), lat: clickLat, lng: clickLng }]);
    }
  };

  const handleSaveZone = () => {
    if (!firestore || isSaving) return;
    
    if (!newZoneName) {
      toast({ variant: "destructive", title: "Falta Identificador", description: "Asigna un nombre a la zona." });
      return;
    }
    if (zonePoints.length === 0) {
      toast({ variant: "destructive", title: "Sin Perímetro", description: "Marca al menos un punto en el mapa." });
      return;
    }

    setIsSaving(true);
    const zoneData = {
      name: newZoneName,
      type: 'polygon',
      color: activeHexColor,
      coordinates: zonePoints.map(p => ({ lat: p.lat, lng: p.lng })),
      zoom: mapZoom,
      createdAt: new Date().toISOString()
    };

    addDoc(collection(firestore, 'zones'), zoneData)
      .then(() => {
        toast({ 
          title: "Zona Registrada", 
          description: `"${newZoneName}" guardada. Zoom táctico activo.`,
          action: (
            <ToastAction altText="Trazar Ruta" onClick={() => { 
              setActiveTab('rutas'); 
              setNewRouteName(`Ruta ${newZoneName}`); 
              setIsDrawing(true); 
              setActiveTool('polygon');
              setPlannedPoints([]);
            }}>
              Trazar Ruta
            </ToastAction>
          )
        });
        
        // Auto Zoom to the first point of the saved zone
        if (zonePoints.length > 0) {
          setMapZoom(16);
          setViewCenter({ lat: zonePoints[0].lat, lng: zonePoints[0].lng });
        }
        
        setNewZoneName('');
        setZonePoints([]);
        setIsDrawing(false);
        setActiveTool('navigate');
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'zones',
          operation: 'create',
          requestResourceData: zoneData,
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleSaveRoute = () => {
    if (!firestore || isSaving) return;

    if (!newRouteName) {
      toast({ variant: "destructive", title: "Falta Nombre", description: "Asigna un nombre a la ruta." });
      return;
    }
    if (plannedPoints.length < 2) {
      toast({ variant: "destructive", title: "Ruta Insuficiente", description: "Marca al menos 2 paradas." });
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
        toast({ title: "Ruta Guardada", description: "Trayectoria logística registrada exitosamente." });
        setNewRouteName('');
        setPlannedPoints([]);
        setIsDrawing(false);
        setActiveTool('navigate');
      })
      .catch(async (error) => {
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

  const handleFocus = (item: any) => {
    let lat, lng;
    if (item.coordinates && item.coordinates.length > 0) {
      lat = item.coordinates[0].lat;
      lng = item.coordinates[0].lng;
    } else if (item.stops && item.stops.length > 0) {
      lat = item.stops[0].lat;
      lng = item.stops[0].lng;
    }
    if (lat && lng) {
      setViewCenter({ lat, lng });
      setMapZoom(16);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-body">
      <AppSidebar />
      
      <aside className="w-[420px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-2xl relative">
        <div className="p-6 border-b border-slate-100 bg-slate-50/80 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-bold text-xl text-white shadow-xl shadow-primary/20">V</div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">Spatial Hub</h2>
              <p className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase">Control Territorial</p>
            </div>
          </div>

          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            {ZONES_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setIsDrawing(false); setActiveTool('navigate'); }}
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
                    <Pencil className="w-3 h-3" /> Registrar Cobertura
                  </h3>
                  <button 
                    onClick={() => { 
                      const newDrawing = !isDrawing;
                      setIsDrawing(newDrawing);
                      setActiveTool(newDrawing ? 'polygon' : 'navigate');
                    }}
                    className={cn(
                      "text-[9px] font-bold px-3 py-1.5 rounded-full transition-all border",
                      isDrawing ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {isDrawing ? 'MODO DIBUJO ACTIVO' : 'ACTIVAR DIBUJO'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Buscar Dirección / Punto Referencia</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ej: La Gabriela, Bello"
                        className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm font-bold"
                        value={newZoneName}
                        onChange={(e) => setNewZoneName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleGlobalSearch(newZoneName);
                        }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        {isSearching ? (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 text-slate-300 cursor-pointer hover:text-primary" onClick={() => handleGlobalSearch(newZoneName)} />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-inner">
                    {COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.id)}
                        className={cn("w-7 h-7 rounded-full transition-all transform hover:scale-110", color.class, selectedColor === color.id ? "ring-4 ring-primary/30 ring-offset-2 scale-110 shadow-md" : "opacity-40 hover:opacity-100")}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <ToolButton active={activeTool === 'navigate'} onClick={() => { setActiveTool('navigate'); setIsDrawing(false); }} icon={Hand} label="NAVEGAR" />
                    <ToolButton active={activeTool === 'polygon'} onClick={() => { setActiveTool('polygon'); setIsDrawing(true); }} icon={Hexagon} label="DIBUJAR" />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Puntos: <span className="text-primary font-black">{zonePoints.length}</span></span>
                    <button 
                      onClick={() => setZonePoints([])} 
                      className="text-[9px] font-bold text-rose-500 uppercase flex items-center gap-1.5 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Eraser className="w-3.5 h-3.5" /> Limpiar
                    </button>
                  </div>

                  <button 
                    onClick={handleSaveZone}
                    disabled={isSaving || !newZoneName || zonePoints.length === 0}
                    className="w-full text-white py-4.5 rounded-xl text-xs font-bold flex items-center justify-center gap-3 shadow-xl transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-primary"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'REGISTRANDO...' : 'REGISTRAR ÁREA'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                  <List className="w-3 h-3" /> Zonas de Acción ({zones?.length || 0})
                </h3>
                <div className="space-y-2.5 pb-20">
                  {loadingZones ? (
                    <div className="flex flex-col items-center py-10 gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : zones && zones.length > 0 ? (
                    zones.map((zone) => (
                      <div key={zone.id} onClick={() => handleFocus(zone)} className="flex items-center justify-between p-4.5 bg-white border border-slate-200 rounded-2xl hover:border-primary/40 transition-all group cursor-pointer shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: zone.color }} />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{zone.name}</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider">{zone.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={(e) => { e.stopPropagation(); setActiveTab('rutas'); setNewRouteName(`Ruta ${zone.name}`); setIsDrawing(true); setActiveTool('polygon'); setPlannedPoints([]); handleFocus(zone); }} title="Planear Ruta" className="p-2 hover:bg-primary/10 rounded-lg text-primary"><RouteIcon className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete('zones', zone.id); }} title="Eliminar" className="p-2 hover:bg-rose-50 rounded-lg text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem]">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Sin Coberturas</p>
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
                    <Navigation className="w-3 h-3" /> Planeación de Ruta
                  </h3>
                  <button 
                    onClick={() => {
                      const newDrawing = !isDrawing;
                      setIsDrawing(newDrawing);
                      setActiveTool(newDrawing ? 'polygon' : 'navigate');
                    }}
                    className={cn(
                      "text-[9px] font-bold px-3 py-1.5 rounded-full transition-all border",
                      isDrawing ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {isDrawing ? 'MODO DIBUJO ACTIVO' : 'ACTIVAR DIBUJO'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Nombre de Trayectoria</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ej: Ruta Bello Sur" 
                        className="w-full bg-white border border-slate-200 rounded-xl py-4 px-4 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm font-bold"
                        value={newRouteName} 
                        onChange={(e) => setNewRouteName(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <ToolButton active={activeTool === 'navigate'} onClick={() => { setActiveTool('navigate'); setIsDrawing(false); }} icon={Hand} label="NAVEGAR" />
                    <ToolButton active={activeTool === 'polygon'} onClick={() => { setActiveTool('polygon'); setIsDrawing(true); }} icon={Hexagon} label="DIBUJAR" />
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Paradas: <span className="text-primary font-black">{plannedPoints.length}</span></span>
                    <button 
                      onClick={() => setPlannedPoints([])} 
                      className="text-[9px] font-bold text-rose-500 uppercase flex items-center gap-1.5 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Eraser className="w-3.5 h-3.5" /> Limpiar
                    </button>
                  </div>
                  <button 
                    onClick={handleSaveRoute} 
                    disabled={isSaving || !newRouteName || plannedPoints.length < 2} 
                    className="w-full bg-primary text-white py-4.5 rounded-xl text-xs font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'GUARDANDO...' : 'GUARDAR RUTA'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                  <RouteIcon className="w-3 h-3" /> Rutas en Sistema ({savedRoutes?.length || 0})
                </h3>
                <div className="space-y-2.5 pb-20">
                  {loadingRoutes ? (
                    <div className="flex flex-col items-center py-10 gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : savedRoutes && savedRoutes.length > 0 ? (
                    savedRoutes.map((route) => (
                      <div key={route.id} onClick={() => handleFocus(route)} className="flex items-center justify-between p-4.5 bg-white border border-slate-200 rounded-2xl hover:border-primary/40 transition-all group cursor-pointer shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><RouteIcon className="w-5 h-5" /></div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{route.name}</p>
                            <p className="text-[9px] text-slate-400 uppercase">{route.stops?.length || 0} Paradas</p>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete('routes', route.id); }} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-50 rounded-lg text-rose-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem]">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Sin Rutas Planeadas</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
      
      <main 
        ref={mapContainerRef} 
        className={cn(
          "flex-1 relative bg-slate-200 overflow-hidden",
          activeTool === 'navigate' ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {isDrawing && (
          <div 
            className="absolute inset-0 z-40 bg-transparent" 
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
          <button onClick={() => setMapZoom(prev => Math.min(prev + 1, 21))} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 hover:bg-slate-50 shadow-2xl font-bold text-lg transition-all active:scale-90">+</button>
          <button onClick={() => setMapZoom(prev => Math.max(prev - 1, 5))} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 hover:bg-slate-50 shadow-2xl font-bold text-lg transition-all active:scale-90">-</button>
          <button onClick={() => { setViewCenter({ lat: 4.6097, lng: -74.0817 }); setMapZoom(12); }} className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 hover:scale-105 transition-all active:scale-90"><Crosshair className="w-5 h-5" /></button>
        </div>

        <div className="absolute top-10 right-10 z-50">
          <AnimatePresence>
            {isDrawing && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-[10px] uppercase tracking-widest bg-primary">
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                DIBUJO TÁCTICO ACTIVO
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
    <button onClick={onClick} className={cn("flex flex-col items-center justify-center py-3 rounded-2xl border transition-all gap-1 group", active ? "bg-primary/5 border-primary text-primary shadow-sm" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50")}>
      <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", active && "scale-110 text-primary")} />
      <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}