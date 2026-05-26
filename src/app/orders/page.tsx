
"use client";

import React, { useState, useMemo } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { 
  Package, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Loader2,
  MapPin,
  User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { geocodeLocation } from '@/ai/flows/geocode-location';

export default function OrdersPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const firestore = useFirestore();
  const ordersQuery = useMemo(() => firestore ? query(collection(firestore, 'orders')) : null, [firestore]);
  const { data: orders, loading } = useCollection(ordersQuery);

  const filteredOrders = (orders || []).filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => {
    const list = orders || [];
    return {
      pending: list.filter(o => o.status === 'pending').length,
      transit: list.filter(o => o.status === 'in-transit').length,
      delivered: list.filter(o => o.status === 'delivered').length,
    };
  }, [orders]);

  const handleAddOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const address = formData.get('address') as string;
    
    // Georeferenciar antes de guardar
    let lat = 0, lng = 0;
    try {
      const geo = await geocodeLocation({ query: address });
      if (geo.success && geo.data) {
        lat = geo.data.lat;
        lng = geo.data.lng;
      }
    } catch (e) {
      console.warn("Geocodificación fallida para el pedido, se guardará sin coordenadas exactas.");
    }

    const orderData = {
      customerName: formData.get('customerName') as string,
      address,
      status: 'pending',
      lat,
      lng,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(firestore, 'orders'), orderData);
      toast({ title: "Pedido Registrado", description: "Envío programado en la cola logística." });
      setOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear el pedido." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold text-slate-900">Operational Hub</h1>
            <p className="text-muted-foreground font-medium">Gestión del ciclo de vida de pedidos y logística.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-12 px-6 gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5" />
                NUEVO PEDIDO
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem]">
              <DialogHeader>
                <DialogTitle>Registrar Envío</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddOrder} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nombre del Cliente</Label>
                  <Input id="customerName" name="customerName" placeholder="Ej: Distribuidora Norte" required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección de Entrega</Label>
                  <Input id="address" name="address" placeholder="Ej: Calle 50 # 20-30, Bello" required className="rounded-xl" />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSaving} className="w-full rounded-xl h-12">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                    PROCESAR PEDIDO
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard label="Pendientes" value={stats.pending} icon={Clock} color="primary" />
          <StatCard label="En Proceso" value={stats.transit} icon={AlertCircle} color="accent" />
          <StatCard label="Entregados" value={stats.delivered} icon={CheckCircle2} color="green-500" />
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="Filtrar por cliente o dirección..." 
                className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm w-full outline-none focus:ring-1 focus:ring-primary font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-6 py-5">Identificador</th>
                  <th className="px-6 py-5">Cliente</th>
                  <th className="px-6 py-5">Destino</th>
                  <th className="px-6 py-5">Estado</th>
                  <th className="px-6 py-5">Fecha Registro</th>
                  <th className="px-6 py-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-5">
                        <span className="font-mono text-[11px] font-bold text-primary">#{order.id.slice(0, 8).toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-sm text-slate-800">{order.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">{order.address}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5",
                          order.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-200" :
                          order.status === 'in-transit' ? "bg-primary/5 text-primary border-primary/20" :
                          "bg-green-50 text-green-600 border-green-200"
                        )}>
                          {order.status === 'pending' ? 'PENDIENTE' : order.status === 'in-transit' ? 'EN TRÁNSITO' : 'ENTREGADO'}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-xs text-slate-400 font-bold">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="p-2 hover:bg-primary/10 rounded-lg text-slate-300 group-hover:text-primary transition-all">
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                      Sin pedidos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className={cn("glass-panel p-6 rounded-3xl border-l-4 bg-white", `border-l-${color}`)}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className={cn("w-5 h-5", `text-${color}`)} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <h2 className="text-3xl font-headline font-bold text-slate-900">{value}</h2>
    </div>
  );
}
