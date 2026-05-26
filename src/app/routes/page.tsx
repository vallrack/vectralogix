
"use client";

import React, { useState } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { 
  BrainCircuit, 
  MapPin, 
  Plus, 
  Play, 
  Info, 
  Clock, 
  Route as RouteIcon,
  ChevronRight,
  Sparkles,
  Timer,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { generateOptimizedDeliveryRoute } from '@/ai/flows/optimized-delivery-route-generation';
import { MOCK_LOCATIONS, MOCK_DRIVERS } from '@/lib/mock-data';

export default function RoutePlanning() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      // Use the Genkit flow with mock data
      const data = await generateOptimizedDeliveryRoute({
        deliveryLocations: MOCK_LOCATIONS.slice(1).map(l => ({ lat: l.lat, lng: l.lng, address: l.address })),
        startLocation: { lat: MOCK_LOCATIONS[0].lat, lng: MOCK_LOCATIONS[0].lng, address: MOCK_LOCATIONS[0].address },
        vehicleCapacity: 50,
        averageVehicleSpeedKmh: 45,
      });
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AppSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-2">Auto-Route Intelligence</h1>
            <p className="text-muted-foreground">Autonomous pathfinding powered by neural logistics.</p>
          </div>
          <div className="flex gap-4">
            <button className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-white/5 transition-all font-bold text-sm">
              <Info className="w-4 h-4" />
              GUIDELINES
            </button>
            <button 
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="bg-primary px-8 py-3 rounded-2xl text-white font-bold text-sm shadow-xl shadow-primary/30 flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {isOptimizing ? <Sparkles className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
              {isOptimizing ? 'PROCESSING...' : 'RUN OPTIMIZER'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Stops Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-headline font-bold">Planned Stops</h3>
                <button className="p-2 bg-primary/20 rounded-xl hover:bg-primary/30 transition-colors">
                  <Plus className="w-5 h-5 text-primary" />
                </button>
              </div>

              <div className="space-y-4 relative">
                {/* Visual Line Connectors */}
                <div className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-white/5" />
                
                {MOCK_LOCATIONS.map((loc, i) => (
                  <div key={loc.id} className="flex items-center gap-4 relative">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center border border-white/10 z-10",
                      i === 0 ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
                    )}>
                      {i === 0 ? <Navigation className="w-5 h-5" /> : <span className="text-xs font-bold">{i}</span>}
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-primary/30 transition-colors cursor-pointer group">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{i === 0 ? 'Origin' : `Stop ${i}`}</p>
                      <p className="text-sm font-bold truncate group-hover:text-foreground transition-colors">{loc.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl bg-primary/5 border-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Timer className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Optimizer Engine</p>
                  <p className="text-sm font-bold">Latency: 42ms | Tokens: 1.2k</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Result View */}
          <div className="lg:col-span-2">
            {!result ? (
              <div className="h-full min-h-[500px] glass-panel border-dashed border-2 border-white/10 rounded-[40px] flex flex-col items-center justify-center p-12 text-center group">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <BrainCircuit className="w-12 h-12 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-2">Neural Link Ready</h3>
                <p className="text-muted-foreground max-w-xs">Initialize the optimizer to generate autonomous route sequences based on current fleet telemetry.</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Results Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-panel p-6 rounded-3xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Total Distance</p>
                    <p className="text-3xl font-headline font-bold text-primary">{result.totalDistanceKm.toFixed(1)} <span className="text-sm font-medium text-muted-foreground">KM</span></p>
                  </div>
                  <div className="glass-panel p-6 rounded-3xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Est. Travel Time</p>
                    <p className="text-3xl font-headline font-bold text-accent">{result.estimatedTravelTimeMinutes} <span className="text-sm font-medium text-muted-foreground">MIN</span></p>
                  </div>
                  <div className="glass-panel p-6 rounded-3xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Optimization Confidence</p>
                    <p className="text-3xl font-headline font-bold text-green-500">99.2%</p>
                  </div>
                </div>

                {/* Detailed Sequence */}
                <div className="glass-panel p-8 rounded-[40px]">
                  <h3 className="text-xl font-headline font-bold mb-8 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    Optimized Sequence
                  </h3>
                  
                  <div className="space-y-3">
                    {result.optimizedSequence.map((stop: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-default">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-background border border-white/10 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{stop.address}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {idx === 0 && <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase">Start</span>}
                          {idx === result.optimizedSequence.length - 1 && <span className="text-[10px] font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full uppercase">Terminal</span>}
                          <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5">
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">AI Log & Notes</h4>
                    <div className="bg-black/40 rounded-2xl p-6 font-mono text-xs text-primary/80 leading-relaxed border border-primary/10">
                      {result.optimizationNotes}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all">DISCARD</button>
                  <button className="flex-1 py-5 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/30 hover:translate-y-[-2px] transition-all">CONFIRM & DEPLOY ROUTE</button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
