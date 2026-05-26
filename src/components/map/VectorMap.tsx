"use client"

import React, { useMemo } from 'react';
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

  // Simulación de coordenadas de ruta en el lienzo SVG (Normalizadas a 1000x1000)
  const pathPoints = useMemo(() => {
    return plannedPoints.map((_, i) => ({
      x: 500 + (Math.sin(i * 1.5) * 100 * (i / (plannedPoints.length || 1))),
      y: 500 + (Math.cos(i * 1.5) * 100 * (i / (plannedPoints.length || 1)))
    }));
  }, [plannedPoints]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-white select-none">
      {/* Contenedor del Mapa con filtros suaves y modernos */}
      <div className="w-full h-full grayscale-[0.3] contrast-[1.1] opacity-60 transition-all duration-700 ease-in-out">
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

      {/* Overlay de degradado sutil */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-100/40 via-transparent to-slate-100/20 pointer-events-none z-10" />
      
      {/* Capa de Visualización SVG */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <svg className="w-full h-full" viewBox="0 0 1000 1000">
          {/* Rejilla suave */}
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#2563eb" strokeWidth="0.5" opacity="0.05" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Zonas Guardadas */}
          {zones.map((zone, i) => (
            <motion.g 
              key={zone.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.3, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 1 }}
            >
              {zone.type === 'circle' ? (
                <circle cx="500" cy="500" r="140" fill={zone.color} stroke={zone.color} strokeWidth="3" strokeDasharray="6,4" />
              ) : zone.type === 'rect' ? (
                <rect x="350" y="380" width="300" height="240" fill={zone.color} stroke={zone.color} strokeWidth="3" strokeDasharray="6,4" />
              ) : (
                <path d="M500,320 L720,480 L620,680 L380,680 L280,480 Z" fill={zone.color} stroke={zone.color} strokeWidth="3" strokeDasharray="6,4" />
              )}
              <text x="500" y="500" textAnchor="middle" fill={zone.color} fontSize="14" fontWeight="bold" opacity="0.9" className="uppercase tracking-widest">{zone.name}</text>
            </motion.g>
          ))}

          {/* Rutas (Líneas) */}
          {plannedPoints.length > 1 && (
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              d={`M ${pathPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              strokeDasharray="10,5"
              opacity="0.5"
            />
          )}

          {/* Nodos */}
          {pathPoints.map((point, i) => (
            <motion.g 
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <circle cx={point.x} cy={point.y} r="20" fill="#2563eb" opacity="0.1" />
              <circle cx={point.x} cy={point.y} r="6" fill="#2563eb" stroke="white" strokeWidth="2" />
              <text x={point.x + 15} y={point.y + 5} fill="#2563eb" fontSize="11" fontWeight="bold">NODO {i + 1}</text>
            </motion.g>
          ))}
        </svg>

        {/* Mira central limpia */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 opacity-30">
          <div className="w-56 h-56 border border-primary/20 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-sm" />
            <div className="absolute w-full h-[0.5px] bg-primary/10" />
            <div className="absolute h-full w-[0.5px] bg-primary/10" />
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/30 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/30 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary/30 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/30 rounded-br-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}