
"use client";

import React, { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MOCK_DRIVERS } from '@/lib/mock-data';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Phone, 
  Mail, 
  MapPin, 
  Truck,
  Star,
  Activity,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FleetControl() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter based on the stable mock data
  const filteredDrivers = MOCK_DRIVERS.filter(driver => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold">Fleet Control</h1>
            <p className="text-muted-foreground">Monitoreo y gestión de unidades móviles en el territorio colombiano.</p>
          </div>
          <Button className="rounded-2xl h-12 px-6 gap-2">
            <Plus className="w-5 h-5" />
            REGISTRAR UNIDAD
          </Button>
        </header>

        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, ID o vehículo..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="rounded-xl h-12 gap-2">
            <Filter className="w-4 h-4" />
            FILTROS
          </Button>
        </div>

        {/* Prevent hydration mismatch by ensuring content is only shown after mount */}
        {isMounted ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDrivers.map((driver) => (
              <div key={driver.id} className="glass-panel p-6 rounded-3xl group hover:border-primary/40 transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="relative">
                      <img src={driver.avatar} alt={driver.name} className="w-16 h-16 rounded-2xl object-cover" />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${driver.isAvailable ? 'bg-green-500' : 'bg-orange-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{driver.name}</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {driver.vehicleType}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 p-3 rounded-2xl">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Rendimiento</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-bold">{driver.performance}%</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Estado</p>
                    <p className={`text-sm font-bold ${driver.isAvailable ? 'text-green-500' : 'text-orange-500'}`}>
                      {driver.isAvailable ? 'Disponible' : 'En Ruta'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">Lat: {driver.currentLocation.latitude.toFixed(4)}, Lng: {driver.currentLocation.longitude.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Activity className="w-4 h-4" />
                    <span>{driver.scheduledHoursRemaining}h restantes hoy</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button variant="outline" className="flex-1 rounded-xl h-10 gap-2">
                    <Phone className="w-4 h-4" />
                    Llamar
                  </Button>
                  <Button className="flex-1 rounded-xl h-10 gap-2">
                    <Mail className="w-4 h-4" />
                    Mensaje
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </main>
    </div>
  );
}
