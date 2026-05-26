
"use client";

import React from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { KPICards } from '@/components/dashboard/KPICards';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { MOCK_STATS, MOCK_DRIVERS } from '@/lib/mock-data';
import { Bell, Search, MoreHorizontal, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
  // Fix: Create a shallow copy before sorting to avoid mutating the shared MOCK_DRIVERS array
  const sortedDrivers = [...MOCK_DRIVERS].sort((a, b) => b.performance - a.performance);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AppSidebar />
      
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-headline font-bold">Operational Command</h2>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search fleet, routes, or zones..." 
                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 relative transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-sm font-bold">Commander J. Vance</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Fleet General</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent p-0.5">
                <div className="w-full h-full rounded-[10px] bg-background flex items-center justify-center overflow-hidden">
                  <img src="https://picsum.photos/seed/admin/100/100" alt="Avatar" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <KPICards />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart */}
            <div className="lg:col-span-2 glass-panel p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-headline font-bold">Volume Intelligence</h3>
                  <p className="text-sm text-muted-foreground">Historical delivery metrics and predictive load.</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-1.5 rounded-lg border border-white/10 text-xs font-bold hover:bg-white/5">WEEKLY</button>
                  <button className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20">MONTHLY</button>
                </div>
              </div>
              
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_STATS}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#387AF5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#387AF5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}}
                    />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#0E1014', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                      itemStyle={{color: '#387AF5'}}
                    />
                    <Area type="monotone" dataKey="completed" stroke="#387AF5" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Ranking */}
            <div className="glass-panel p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-headline font-bold">Elite Fleet</h3>
                <MoreHorizontal className="w-5 h-5 text-muted-foreground cursor-pointer" />
              </div>
              
              <div className="space-y-6">
                {sortedDrivers.map((driver, i) => (
                  <div key={driver.id} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={driver.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-background border-2 border-primary rounded-full flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold group-hover:text-primary transition-colors">{driver.name}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{driver.vehicleType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent">{driver.performance}%</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Rating</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                VIEW ALL FLEET
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
