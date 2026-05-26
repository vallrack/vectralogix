
"use client";

import React, { useState, useMemo } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, query } from 'firebase/firestore';
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
  Plus,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function FleetControl() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  
  const firestore = useFirestore();
  const driversQuery = useMemo(() => firestore ? query(collection(firestore, 'drivers')) : null, [firestore]);
  const { data: drivers, loading } = useCollection(driversQuery);

  const filteredDrivers = (drivers || []).filter(driver => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDriver = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const driverData = {
      name: formData.get('name') as string,
      vehicleType: formData.get('vehicleType') as string,
      isAvailable: true,
      performance: 100,
      createdAt: new Date().toISOString()
    };

    addDoc(collection(firestore, 'drivers'), driverData)
      .then(() => {
        toast({ title: "Unidad Registrada", description: "El conductor ha sido añadido a la flota." });
        setOpen(false);
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'drivers',
          operation: 'create',
          requestResourceData: driverData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold text-slate-900">Fleet Control</h1>
            <p className="text-muted-foreground font-medium">Gestión de unidades móviles en tiempo real.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-12 px-6 gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5" />
                REGISTRAR UNIDAD
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem]">
              <DialogHeader>
                <DialogTitle>Nueva Unidad de Flota</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDriver} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" name="name" placeholder="Ej: Carlos Rodriguez" required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Tipo de Vehículo</Label>
                  <Select name="vehicleType" defaultValue="van">
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Carro</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="truck">Camión</SelectItem>
                      <SelectItem value="motorcycle">Motocicleta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSaving} className="w-full rounded-xl h-12">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    DAR DE ALTA
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, vehículo o ID..." 
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="rounded-xl h-12 gap-2 border-slate-200">
            <Filter className="w-4 h-4" />
            FILTROS
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredDrivers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDrivers.map((driver) => (
              <div key={driver.id} className="glass-panel p-6 rounded-3xl group hover:border-primary/40 transition-all bg-white">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Truck className="w-8 h-8" />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${driver.isAvailable ? 'bg-green-500' : 'bg-orange-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{driver.name}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1 font-bold">
                        <Truck className="w-3 h-3 text-primary" />
                        {driver.vehicleType}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-tighter">Rendimiento</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-bold text-slate-700">{driver.performance}%</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-tighter">Estado</p>
                    <p className={`text-sm font-bold ${driver.isAvailable ? 'text-green-600' : 'text-orange-600'}`}>
                      {driver.isAvailable ? 'Disponible' : 'En Ruta'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>Registro: {new Date(driver.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                    <span>Unidad de Campo Activa</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button variant="outline" className="flex-1 rounded-xl h-10 gap-2 border-slate-200 text-xs font-bold">
                    <Phone className="w-3.5 h-3.5" />
                    Llamar
                  </Button>
                  <Button className="flex-1 rounded-xl h-10 gap-2 text-xs font-bold shadow-md shadow-primary/10">
                    <Mail className="w-3.5 h-3.5" />
                    Mensaje
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No se encontraron unidades</p>
          </div>
        )}
      </main>
    </div>
  );
}
