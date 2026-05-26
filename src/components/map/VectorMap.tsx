
"use client"

import React from 'react';
import { motion } from 'framer-motion';

interface VectorMapProps {
  lat: number;
  lng: number;
  zoom: number;
  plannedPoints?: any[];
  zones?: any[];
}

export function VectorMap({ lat, lng, zoom, plannedPoints = [], zones = [] }: VectorMapProps) {
  // Construimos una URL de Google Maps dinámica
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed&t=m`;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0A0C10] select-none">
      {/* Contenedor del Mapa con filtros para estética dark profesional */}
      <div className="w-full h-full grayscale-[0.9] contrast-[1.3] invert-[0.92] opacity-40 transition-all duration-1000 ease-in-out scale-[1.05]">
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          className="pointer-events-auto"
          title="Google Maps Dynamic View"
        />
      </div>

      {/* Overlay de degradado para profundidad */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C10] via-transparent to-[#0A0C10]/40 pointer-events-none z-10" />
      
      {/* Capa de Visualización Estratégica (SVG) */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <svg className="w-full h-full" viewBox="0 0 1000 1000">
          {/* Rejilla de telemetría */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.05" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Visualización de Zonas (Simulada para el prototipo) */}
          {zones.map((zone, i) => (
            <motion.g 
              key={zone.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.2, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              {zone.type === 'circle' ? (
                <circle cx="500" cy="500" r="100" fill={zone.color} stroke={zone.color} strokeWidth="2" />
              ) : zone.type === 'rect' ? (
                <rect x="400" y="400" width="200" height="150" fill={zone.color} stroke={zone.color} strokeWidth="2" />
              ) : (
                <path d="M500,350 L650,450 L600,600 L400,600 L350,450 Z" fill={zone.color} stroke={zone.color} strokeWidth="2" />
              )}
            </motion.g>
          ))}

          {/* Nodos de Ruta Planeada */}
          {plannedPoints.map((point, i) => (
            <motion.g 
              key={point.id}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <circle cx="500" cy="500" r="4" fill="#0EA5E9" className="animate-pulse" />
              <circle cx="500" cy="500" r="12" stroke="#0EA5E9" strokeWidth="1" fill="transparent" opacity="0.5" />
            </motion.g>
          ))}
        </svg>

        {/* Marcadores flotantes de UI para análisis */}
        <div className="absolute top-[20%] left-[20%] border border-primary/20 bg-primary/5 rounded-2xl p-4 backdrop-blur-sm animate-pulse-subtle">
           <p className="text-[8px] font-bold text-primary uppercase tracking-[0.3em]">Sector de Análisis Activo</p>
           <p className="text-[10px] text-white/40 font-mono mt-1">LOCK ON: {lat.toFixed(3)}, {lng.toFixed(3)}</p>
        </div>
      </div>

      {/* Mira de Escaneo Central */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        <div className="w-32 h-32 border border-white/5 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_#387AF5]" />
          <div className="absolute w-full h-[1px] bg-white/5" />
          <div className="absolute h-full w-[1px] bg-white/5" />
        </div>
      </div>
    </div>
  );
}
