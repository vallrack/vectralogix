
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
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed&t=m`;

  // Función para proyectar coordenadas relativas al visor central
  const projectPoint = (pLat: number, pLng: number) => {
    // Escala simplificada basada en el nivel de zoom
    const scale = Math.pow(2, mapZoomLevel - 18) * 100000;
    return {
      x: 500 + (pLng - lng) * scale,
      y: 500 - (pLat - lat) * scale
    };
  };

  const mapZoomLevel = zoom;

  const pathPoints = useMemo(() => {
    return plannedPoints.map(p => projectPoint(p.lat, p.lng));
  }, [plannedPoints, lat, lng, zoom]);

  const projectedZones = useMemo(() => {
    return (zones || []).map(zone => {
      const center = zone.coordinates?.[0] || { lat, lng };
      return {
        ...zone,
        ...projectPoint(center.lat, center.lng)
      };
    });
  }, [zones, lat, lng, zoom]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-white select-none pointer-events-none">
      <div className="absolute inset-0 grayscale-[0.3] contrast-[1.1] opacity-60">
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          title="Google Maps Dynamic View"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-slate-100/40 via-transparent to-slate-100/20 pointer-events-none z-10" />
      
      <div className="absolute inset-0 pointer-events-none z-20">
        <svg className="w-full h-full" viewBox="0 0 1000 1000">
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#2563eb" strokeWidth="0.5" opacity="0.05" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Zonas Proyectadas */}
          {projectedZones.map((zone, i) => (
            <motion.g 
              key={zone.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.3, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 1 }}
            >
              {zone.type === 'circle' ? (
                <circle cx={zone.x} cy={zone.y} r="140" fill={zone.color} stroke={zone.color} strokeWidth="3" strokeDasharray="6,4" />
              ) : zone.type === 'rect' ? (
                <rect x={zone.x - 150} y={zone.y - 120} width="300" height="240" fill={zone.color} stroke={zone.color} strokeWidth="3" strokeDasharray="6,4" />
              ) : (
                <path d={`M${zone.x},${zone.y - 180} L${zone.x + 220},${zone.y - 20} L${zone.x + 120},${zone.y + 180} L${zone.x - 120},${zone.y + 180} L${zone.x - 220},${zone.y - 20} Z`} fill={zone.color} stroke={zone.color} strokeWidth="3" strokeDasharray="6,4" />
              )}
              <text x={zone.x} y={zone.y} textAnchor="middle" fill={zone.color} fontSize="14" fontWeight="bold" opacity="0.9" className="uppercase tracking-widest">{zone.name}</text>
            </motion.g>
          ))}

          {/* Rutas (Líneas Conectadas) */}
          {pathPoints.length > 1 && (
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

          {/* Nodos Tácticos */}
          {pathPoints.map((point, i) => (
            <motion.g 
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <circle cx={point.x} cy={point.y} r="16" fill="#2563eb" opacity="0.1" />
              <circle cx={point.x} cy={point.y} r="5" fill="#2563eb" stroke="white" strokeWidth="2" />
              <text x={point.x + 10} y={point.y + 5} fill="#2563eb" fontSize="10" fontWeight="bold" className="drop-shadow-sm">N{i + 1}</text>
            </motion.g>
          ))}
        </svg>

        {/* Mira Central */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 opacity-20">
          <div className="w-48 h-48 border border-primary/20 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-primary rounded-full" />
            <div className="absolute w-full h-[0.5px] bg-primary/10" />
            <div className="absolute h-full w-[0.5px] bg-primary/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
