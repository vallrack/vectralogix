
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
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Spatial Hub', icon: MapIcon, href: '/map' },
  { label: 'Auto-Routes', icon: Route, href: '/routes' },
  { label: 'Fleet Control', icon: Users, href: '/fleet' },
  { label: 'Operational Hub', icon: Package, href: '/orders' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "h-screen border-r border-white/5 flex flex-col bg-background/95 backdrop-blur-md z-50 transition-all duration-300 relative",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-lg z-[60] hover:scale-110 transition-transform"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Brand Header */}
      <div className={cn("p-6 flex items-center gap-3 transition-all", isCollapsed ? "justify-center px-2" : "")}>
        <div className="w-10 h-10 min-w-[40px] rounded-xl bg-primary flex items-center justify-center neon-glow">
          <Command className="w-6 h-6 text-white" />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-lg font-headline font-bold tracking-tight text-foreground">VECTRA</h1>
            <p className="text-[10px] text-primary font-bold tracking-[0.2em] -mt-1 uppercase">Logix Engine</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-hidden">
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
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                isCollapsed ? "justify-center px-0" : ""
              )}
              title={isCollapsed ? item.label : ""}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "")} />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </div>
              {isActive && !isCollapsed && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer Tools */}
      {!isCollapsed && (
        <div className="p-4 mt-auto">
          <div className="glass-panel p-4 rounded-2xl mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">System Load</span>
              <span className="text-[10px] font-bold text-green-500 uppercase">Stable</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-primary" />
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Admin Mode</span>
            <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/50" />
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="p-4 mt-auto flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}
