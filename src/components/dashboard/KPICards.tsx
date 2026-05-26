
import React from 'react';
import { TrendingUp, TrendingDown, Clock, Package, MapPin, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPIProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}

const KPIData: KPIProps[] = [
  { label: 'Active Deliveries', value: '1,284', change: '+12.5%', trend: 'up', icon: Package, color: 'text-primary' },
  { label: 'Avg. Fulfillment', value: '24.2m', change: '-2.1%', trend: 'down', icon: Clock, color: 'text-accent' },
  { label: 'Fleet Utilization', value: '94.2%', change: '+0.4%', trend: 'up', icon: Truck, color: 'text-green-500' },
  { label: 'Zone Coverage', value: '86%', change: '+3.2%', trend: 'up', icon: MapPin, color: 'text-orange-500' },
];

export function KPICards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {KPIData.map((kpi, i) => (
        <div key={i} className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className={cn("p-3 rounded-2xl bg-white/5", kpi.color)}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
              kpi.trend === 'up' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            )}>
              {kpi.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {kpi.change}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-headline font-bold tracking-tight">{kpi.value}</h3>
          </div>
          <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <kpi.icon className="w-24 h-24 rotate-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
