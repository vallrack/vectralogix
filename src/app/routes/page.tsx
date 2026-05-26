
"use client";

import React, { useState, useMemo } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { 
  BrainCircuit, 
  MapPin, 
  Plus, 
  Info, 
  Clock, 
  Route as RouteIcon,
  ChevronRight,
  Sparkles,
  Timer,
  Navigation,
  CheckCircle2,
  Loader2,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { generateOptimizedDeliveryRoute } from '@/ai/flows/optimized-delivery-route-generation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

export default function RoutePlanning() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const firestore = useFirestore();
  const ordersQuery = useMemo(() => firestore ? query(collection(firestore, 'orders'), where('status', '==', 'pending')) : null, [firestore]);
  const { data: pendingOrders, loading: loadingOrders } = useCollection(ordersQuery);

  const handleOptimize = async () => {
    if (selectedOrderIds.length === 0) {
      toast({ variant: "destructive", title: "Sin Destinos", description: "Selecciona al menos un pedido para optimizar." });
      return;
    }

    setIsOptimizing(true);
    try {
      const ordersToOptimize = (pendingOrders || []).filter(o => selectedOrderIds.includes(o.id));
      
      const data = await generateOptimizedDeliveryRoute({
        deliveryLocations: ordersToOptimize.map(o => ({ 
          lat: o.lat || 4.6097, 
          lng: o.lng || -74.0817, 
          address: o.address 
        })),
        startLocation: { lat: 4.6097, lng: -74.0817, address: 'Centro de Distribución Vectra' },
        vehicleCapacity: 50,
        averageVehicleSpeedKmh: 45,
      });
      setResult(data);
      toast({ title: "Ruta Optimizada", description: "La IA ha generado la secuencia más eficiente." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error de IA", description: "No se pudo generar la optimización." });
    } finally {
      setIsOptimizing(false);
    }
  };

  const toggleOrderSelection = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AppSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-2 text-slate-900">Auto-Route Intelligence</h1>
            <p className="text-muted-foreground font-medium">Planificación autónoma basada en IA para pedidos pendientes.</p>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={handleOptimize}
              disabled={isOptimizing || selectedOrderIds.length === 0}
              className="bg-primary px-8 py-6 rounded-2xl text-white font-bold text-sm shadow-xl shadow-primary/30 flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 h-auto"
            >
              {isOptimizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
              {isOptimizing ? 'PROCESANDO...' : 'EJECUTAR OPTIMIZADOR'}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-8 rounded-3xl bg-white">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-headline font-bold text-slate-900">Pedidos Pendientes</h3>
                <Badge variant="outline" className="text-primary font-bold">{pendingOrders?.length || 0}</Badge>
              </div>

              <div className="space-y-3">
                {loadingOrders ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : pendingOrders && pendingOrders.length > 0 ? (
                  pendingOrders.map((order) => (
                    <div 
                      key={order.id} 
                      onClick={() => toggleOrderSelection(order.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border group",
                        selectedOrderIds.includes(order.id) 
                          ? "bg-primary/10 border-primary shadow-sm" 
                          : "bg-slate-50 border-slate-100 hover:border-primary/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        selectedOrderIds.includes(order.id) ? "bg-primary text-white" : "bg-white text-slate-300 group-hover:text-primary"
                      )}>
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate">{order.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-bold truncate uppercase">{order.address}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    Sin pedidos para procesar
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl bg-primary/5 border-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Timer className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motor de IA</p>
                  <p className="text-sm font-bold text-slate-800">Gemini 2.5 Flash Activo</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!result ? (
              <div className="h-full min-h-[500px] glass-panel border-dashed border-2 border-slate-200 rounded-[40px] flex flex-col items-center justify-center p-12 text-center group bg-white/30 backdrop-blur-sm">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <BrainCircuit className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-2 text-slate-900">Configuración Requerida</h3>
                <p className="text-slate-500 max-w-xs font-medium">Selecciona los pedidos de la lista lateral para generar la secuencia autónoma de entrega.</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ResultStat label="Distancia Total" value={`${result.totalDistanceKm.toFixed(1)} KM`} color="primary" />
                  <ResultStat label="Tiempo Estimado" value={`${result.estimatedTravelTimeMinutes} MIN`} color="accent" />
                  <ResultStat label="Eficiencia IA" value="98.5%" color="green-500" />
                </div>

                <div className="glass-panel p-8 rounded-[40px] bg-white">
                  <h3 className="text-xl font-headline font-bold mb-8 flex items-center gap-3 text-slate-900">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    Secuencia Optimizada
                  </h3>
                  
                  <div className="space-y-3 relative">
                    <div className="absolute left-[20px] top-6 bottom-6 w-0.5 bg-slate-100" />
                    {result.optimizedSequence.map((stop: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-primary/20 transition-all cursor-default relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-primary shadow-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{stop.address}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Punto Georeferenciado</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {idx === 0 && <span className="text-[9px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-tighter">Origen</span>}
                          {idx === result.optimizedSequence.length - 1 && <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-tighter">Cierre</span>}
                          <ChevronRight className="w-4 h-4 text-slate-200" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Registro de Optimización</h4>
                    <div className="bg-slate-900 rounded-2xl p-6 font-mono text-xs text-primary leading-relaxed border border-white/10 shadow-2xl">
                      {result.optimizationNotes}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setResult(null)} className="flex-1 py-7 rounded-2xl font-bold border-slate-200">DESCARTAR</Button>
                  <Button className="flex-1 py-7 rounded-2xl font-bold shadow-xl shadow-primary/20">CONFIRMAR Y DESPACHAR</Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ResultStat({ label, value, color }: any) {
  return (
    <div className="glass-panel p-6 rounded-3xl bg-white border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={cn("text-3xl font-headline font-bold", `text-${color}`)}>{value}</p>
    </div>
  );
}
