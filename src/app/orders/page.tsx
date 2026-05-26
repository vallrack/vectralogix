
"use client";

import React from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Package, Search, Filter, ArrowUpRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OrdersPage() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold">Operational Hub</h1>
            <p className="text-muted-foreground">Gestión del ciclo de vida de pedidos y procesamiento de entregas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-primary">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <p className="text-sm font-bold text-muted-foreground uppercase">Pendientes</p>
            </div>
            <h2 className="text-3xl font-headline font-bold">142</h2>
          </div>
          <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-accent">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-accent" />
              <p className="text-sm font-bold text-muted-foreground uppercase">En Proceso</p>
            </div>
            <h2 className="text-3xl font-headline font-bold">64</h2>
          </div>
          <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-green-500">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-sm font-bold text-muted-foreground uppercase">Entregados</p>
            </div>
            <h2 className="text-3xl font-headline font-bold">892</h2>
          </div>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Filtrar pedidos..." className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm w-full outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="px-6 py-4">ID Pedido</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Destino</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 font-mono text-xs text-primary">#VX-COL-{i}00{i}</td>
                    <td className="px-6 py-4 font-bold text-sm">Distribuidor Regional {i}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">Bogotá, Sector {i}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">EN TRÁNSITO</Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">Oct 26, 2023</td>
                    <td className="px-6 py-4">
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
