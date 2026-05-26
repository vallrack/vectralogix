
"use client";

import React from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { MOCK_STATS } from '@/lib/mock-data';
import { TrendingUp, Download, Calendar } from 'lucide-react';

const COLORS = ['#387AF5', '#0EA5E9', '#10B981', '#F59E0B'];

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold">Fleet Intelligence</h1>
            <p className="text-muted-foreground">Análisis predictivo y métricas de rendimiento logístico.</p>
          </div>
          <div className="flex gap-3">
            <button className="glass-panel px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold hover:bg-white/5">
              <Calendar className="w-4 h-4" />
              ÚLTIMOS 30 DÍAS
            </button>
            <button className="bg-primary px-4 py-2.5 rounded-xl flex items-center gap-2 text-white text-xs font-bold">
              <Download className="w-4 h-4" />
              EXPORTAR REPORTE
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="glass-panel p-8 rounded-3xl">
            <h3 className="text-lg font-headline font-bold mb-6">Tendencias de Eficiencia</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_STATS}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
                  <Tooltip contentStyle={{backgroundColor: '#0E1014', border: 'none', borderRadius: '12px'}} />
                  <Line type="monotone" dataKey="completed" stroke="#387AF5" strokeWidth={3} dot={{fill: '#387AF5'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl">
            <h3 className="text-lg font-headline font-bold mb-6">Distribución de Flota</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Vans', value: 400 },
                      { name: 'Camiones', value: 300 },
                      { name: 'Carros', value: 300 },
                      { name: 'Motos', value: 200 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-headline font-bold">Pronóstico de Carga Activa</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_STATS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="active" fill="#387AF5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
