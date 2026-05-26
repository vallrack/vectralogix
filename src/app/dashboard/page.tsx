
"use client";

import React, { useMemo } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { KPICards } from '@/components/dashboard/KPICards';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { MOCK_STATS } from '@/lib/mock-data';
import { Bell, Search, MoreHorizontal, ArrowUpRight, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const firestore = useFirestore();
  const driversQuery = useMemo(() => firestore ? query(collection(firestore, 'drivers')) : null, [firestore]);
  const { data: drivers, loading: loadingDrivers } = useCollection(driversQuery);

  const sortedDrivers = useMemo(() => 
    (drivers || []).sort((a, b) => (b.performance || 0) - (a.performance || 0)).slice(0, 5),
    [drivers]
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-body">
      <AppSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 border-b border-slate-200/60 px-8 flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-headline font-bold text-slate-900">Mando Operativo</h2>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar flota, rutas o zonas..." 
                className="bg-background border border-slate-200/60 rounded-xl py-2 pl-10 pr-4 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 rounded-xl border border-slate-200/60 hover:bg-slate-200/50 relative transition-colors text-slate-500">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-card" />
            </button>
            <div className="h-8 w-px bg-slate-200/60" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">Cmdte. J. Vance</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">General de Flota</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-200/60 overflow-hidden ring-2 ring-card shadow-sm">
                <img src="https://picsum.photos/seed/admin/100/100" alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <KPICards />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-panel p-8 rounded-3xl bg-white shadow-sm border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-headline font-bold text-slate-900">Inteligencia de Volumen</h3>
                  <p className="text-sm text-slate-500 font-medium">Métricas históricas y carga predictiva.</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-1.5 rounded-lg border border-slate-200/60 text-[10px] font-black hover:bg-slate-200/50 text-slate-400 transition-colors">SEMANAL</button>
                  <button className="px-4 py-1.5 rounded-lg bg-primary text-white text-[10px] font-black shadow-lg shadow-primary/20">MENSUAL</button>
                </div>
              </div>
              
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_STATS}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 11, fontWeight: '600'}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 11, fontWeight: '600'}}
                    />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                    />
                    <Area type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorActive)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl bg-white shadow-sm border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-headline font-bold text-slate-900 uppercase tracking-tight">Flota Élite</h3>
                <MoreHorizontal className="w-5 h-5 text-slate-400 cursor-pointer" />
              </div>
              
              <div className="space-y-6">
                {loadingDrivers ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : sortedDrivers.length > 0 ? (
                  sortedDrivers.map((driver, i) => (
                    <div key={driver.id} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-2xl transition-all">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                            <img src={`https://picsum.photos/seed/${driver.id}/100/100`} className="w-full h-full object-cover rounded-2xl" alt="" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-white border-2 border-primary rounded-full flex items-center justify-center text-[10px] font-black text-primary">
                            {i + 1}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate max-w-[120px]">{driver.name}</p>
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{driver.vehicleType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary">{driver.performance}%</p>
                        <p className="text-[9px] text-slate-400 uppercase font-black">Rating</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-300 text-xs font-bold uppercase tracking-widest">Sin flota registrada</div>
                )}
              </div>

              <button className="w-full mt-8 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                VER TODA LA FLOTA
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
