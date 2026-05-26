
"use client";

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Clock, Package, MapPin, Truck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';

export function KPICards() {
  const firestore = useFirestore();
  
  const ordersQuery = useMemo(() => firestore ? query(collection(firestore, 'orders')) : null, [firestore]);
  const driversQuery = useMemo(() => firestore ? query(collection(firestore, 'drivers')) : null, [firestore]);
  const zonesQuery = useMemo(() => firestore ? query(collection(firestore, 'zones')) : null, [firestore]);

  const { data: orders, loading: loadingOrders } = useCollection(ordersQuery);
  const { data: drivers, loading: loadingDrivers } = useCollection(driversQuery);
  const { data: zones, loading: loadingZones } = useCollection(zonesQuery);

  const KPIData = useMemo(() => [
    { 
      label: 'Pedidos Activos', 
      value: (orders?.length || 0).toLocaleString(), 
      change: '+12.5%', 
      trend: 'up', 
      icon: Package, 
      color: 'text-primary',
      loading: loadingOrders 
    },
    { 
      label: 'Tiempo Fulfillment', 
      value: '24.2m', 
      change: '-2.1%', 
      trend: 'down', 
      icon: Clock, 
      color: 'text-accent',
      loading: false 
    },
    { 
      label: 'Uso de Flota', 
      value: (drivers?.length || 0).toString(), 
      change: '+0.4%', 
      trend: 'up', 
      icon: Truck, 
      color: 'text-green-500',
      loading: loadingDrivers 
    },
    { 
      label: 'Cobertura Táctica', 
      value: (zones?.length || 0).toString(), 
      change: '+3.2%', 
      trend: 'up', 
      icon: MapPin, 
      color: 'text-orange-500',
      loading: loadingZones 
    },
  ], [orders, drivers, zones, loadingOrders, loadingDrivers, loadingZones]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {KPIData.map((kpi, i) => (
        <div key={i} className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-primary/50 transition-colors bg-white border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className={cn("p-3 rounded-2xl bg-slate-50 border border-slate-100", kpi.color)}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
              kpi.trend === 'up' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            )}>
              {kpi.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {kpi.change}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{kpi.label}</p>
            {kpi.loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-200" />
            ) : (
              <h3 className="text-2xl font-headline font-bold tracking-tight text-slate-900">{kpi.value}</h3>
            )}
          </div>
          <div className="absolute -right-2 -bottom-2 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
            <kpi.icon className="w-24 h-24 rotate-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
