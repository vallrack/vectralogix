
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
      x: 500 + (Math.sin(i * 1.5) * 100 * (i / plannedPoints.length)),
      y: 500 + (Math.cos(i * 1.5) * 100 * (i / plannedPoints.length))
    }));
  }, [plannedPoints]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#05070A] select-none">
      {/* Contenedor del Mapa con filtros para estética dark profesional */}
      <div className="w-full h-full grayscale-[1] contrast-[1.2] invert-[0.93] opacity-30 transition-all duration-700 ease-in-out">
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
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-transparent to-[#05070A]/60 pointer-events-none z-10" />
      
      {/* Capa de Visualización Estratégica (SVG) */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <svg className="w-full h-full" viewBox="0 0 1000 1000">
          {/* Rejilla de telemetría */}
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" opacity="0.03" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Visualización de Zonas Guardadas */}
          {zones.map((zone, i) => (
            <motion.g 
              key={zone.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.25, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 1 }}
            >
              {zone.type === 'circle' ? (
                <circle cx="500" cy="500" r="120" fill={zone.color} stroke={zone.color} strokeWidth="2" strokeDasharray="5,5" />
              ) : zone.type === 'rect' ? (
                <rect x="350" y="400" width="300" height="200" fill={zone.color} stroke={zone.color} strokeWidth="2" strokeDasharray="5,5" />
              ) : (
                <path d="M500,300 L700,450 L600,650 L400,650 L300,450 Z" fill={zone.color} stroke={zone.color} strokeWidth="2" strokeDasharray="5,5" />
              )}
              {/* Etiqueta de Zona */}
              <text x="500" y="480" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" opacity="0.8" style={{ textTransform: 'uppercase' }}>{zone.name}</text>
            </motion.g>
          ))}

          {/* Trazado de Vectores de Ruta (Líneas Conectadas) */}
          {plannedPoints.length > 1 && (
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              d={`M ${pathPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
              fill="none"
              stroke="#0EA5E9"
              strokeWidth="2"
              strokeDasharray="8,4"
              opacity="0.6"
            />
          )}

          {/* Nodos de Ruta Dinámicos */}
          {pathPoints.map((point, i) => (
            <motion.g 
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              {/* Efecto de pulso en el nodo */}
              <circle cx={point.x} cy={point.y} r="15" fill="#0EA5E9" opacity="0.1" className="animate-pulse" />
              <circle cx={point.x} cy={point.y} r="5" fill="#0EA5E9" stroke="white" strokeWidth="1.5" />
              <text x={point.x + 12} y={point.y + 4} fill="#0EA5E9" fontSize="10" fontWeight="bold" opacity="0.9">NODO {i + 1}</text>
            </motion.g>
          ))}
        </svg>

        {/* Indicador de Mira de Análisis */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 opacity-40">
          <div className="w-48 h-48 border-[0.5px] border-white/10 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-primary rounded-full" />
            <div className="absolute w-full h-[0.5px] bg-white/5" />
            <div className="absolute h-full w-[0.5px] bg-white/5" />
            {/* Esquinas de la mira */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-primary/40 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-primary/40 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-primary/40 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-primary/40 rounded-br-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
