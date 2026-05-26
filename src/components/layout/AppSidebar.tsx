"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Route, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  Package,
  Command,
  ChevronRight,
  ChevronLeft,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Visión General', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Spatial Hub', icon: MapIcon, href: '/map' },
  { label: 'Auto-Rutas', icon: Route, href: '/routes' },
  { label: 'Control de Flota', icon: Users, href: '/fleet' },
  { label: 'Pedidos', icon: Package, href: '/orders' },
  { label: 'Analíticas', icon: BarChart3, href: '/analytics' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "h-screen border-r border-slate-200 flex flex-col bg-white z-50 transition-all duration-300 relative shadow-sm",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 shadow-md z-[60] hover:text-primary transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={cn("p-6 flex items-center gap-3", isCollapsed ? "justify-center px-2" : "")}>
        <div className="w-10 h-10 min-w-[40px] rounded-xl bg-primary flex items-center justify-center text-white neon-glow">
          <Command className="w-6 h-6" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-lg font-headline font-bold tracking-tight text-slate-900">VECTRA</h1>
            <p className="text-[10px] text-primary font-bold tracking-[0.2em] -mt-1 uppercase">Logistics Hub</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                isCollapsed ? "justify-center px-0" : ""
              )}
              title={isCollapsed ? item.label : ""}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "")} />
                {!isCollapsed && <span className="text-sm font-semibold">{item.label}</span>}
              </div>
              {isActive && !isCollapsed && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        {!isCollapsed && (
          <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Estado Sistema</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase">Óptimo</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="w-[85%] h-full bg-primary rounded-full" />
            </div>
          </div>
        )}

        <div className={cn(
          "flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100",
          isCollapsed ? "justify-center" : ""
        )}>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <Settings className="w-4 h-4 text-slate-500" />
          </div>
          {!isCollapsed && <span className="text-sm font-semibold text-slate-600">Configuración</span>}
        </div>
      </div>
    </div>
  );
}
