
"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface VectorMapProps {
  lat: number;
  lng: number;
  zoom: number;
  plannedPoints?: any[];
  zonePoints?: any[];
  zones?: any[];
  savedRoutes?: any[];
  containerRef?: React.RefObject<HTMLDivElement>;
  activeColor?: string;
}

export function VectorMap({ 
  lat, 
  lng, 
  zoom, 
  plannedPoints = [], 
  zonePoints = [], 
  zones = [], 
  savedRoutes = [], 
  containerRef,
  activeColor = "#3b82f6"
}: VectorMapProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const displayZoom = Math.round(zoom);
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=${displayZoom}&hl=es&output=embed&iwloc=near`;

  useEffect(() => {
    if (!containerRef?.current) return;
    const updateSize = () => {
      setDimensions({
        width: containerRef.current?.offsetWidth || 0,
        height: containerRef.current?.offsetHeight || 0
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [containerRef]);

  // Proyectar coordenadas geográficas a píxeles de pantalla relativo al centro (lat, lng)
  const projectPoint = (pLat: number, pLng: number) => {
    if (dimensions.width === 0) return { x: 0, y: 0 };
    
    // El tamaño del mundo en píxeles para este nivel de zoom
    const worldSize = 256 * Math.pow(2, zoom);
    
    // Escala de píxeles por grado
    const lngScale = worldSize / 360;
    
    // Ajustar latitud (Proyección Mercator simplificada para pequeñas distancias)
    const latRad = lat * Math.PI / 180;
    const latScale = lngScale / Math.cos(latRad);

    const xOffset = (pLng - lng) * lngScale;
    const yOffset = (lat - pLat) * latScale;

    return {
      x: dimensions.width / 2 + xOffset,
      y: dimensions.height / 2 + yOffset
    };
  };

  const currentRoutePath = useMemo(() => plannedPoints.map(p => projectPoint(p.lat, p.lng)), [plannedPoints, lat, lng, zoom, dimensions]);
  const currentZonePath = useMemo(() => zonePoints.map(p => projectPoint(p.lat, p.lng)), [zonePoints, lat, lng, zoom, dimensions]);

  const projectedZones = useMemo(() => (zones || []).map(zone => ({
    ...zone,
    points: (zone.coordinates || []).map((c: any) => projectPoint(c.lat, c.lng))
  })), [zones, lat, lng, zoom, dimensions]);

  const projectedSavedRoutes = useMemo(() => (savedRoutes || []).map(route => ({
    ...route,
    points: (route.stops || []).map((s: any) => projectPoint(s.lat, s.lng))
  })), [savedRoutes, lat, lng, zoom, dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-200 select-none transition-opacity duration-300">
      <div className="absolute inset-0 grayscale-[0.1] contrast-[1.05] brightness-[0.98] pointer-events-none">
        <iframe
          key={`${lat}-${lng}-${displayZoom}`}
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          title="Google Maps Tactical Console"
          className="pointer-events-none"
        />
      </div>

      <div className="absolute inset-0 pointer-events-none z-20">
        <svg 
          className="w-full h-full" 
          width={dimensions.width} 
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          {/* Zonas Guardadas (Capa de Fondo) */}
          {projectedZones.map((zone) => {
            const points = zone.points;
            if (!points || points.length === 0) return null;
            return (
              <motion.g key={zone.id} initial={{ opacity: 0 }} animate={{ opacity: 0.35 }}>
                {zone.type === 'polygon' && points.length > 2 ? (
                  <path d={`M ${points.map((p: any) => `${p.x},${p.y}`).join(' L ')} Z`} fill={zone.color} stroke={zone.color} strokeWidth="3" strokeDasharray="8,4" className="opacity-30" />
                ) : zone.type === 'rect' ? (
                  <rect x={points[0].x - 60} y={points[0].y - 45} width={120} height={90} fill={zone.color} stroke={zone.color} strokeWidth="3" strokeDasharray="8,4" className="opacity-30" />
                ) : (
                  <circle cx={points[0].x} cy={points[0].y} r={80} fill={zone.color} stroke={zone.color} strokeWidth="3" strokeDasharray="8,4" className="opacity-30" />
                )}
                <text x={points[0].x} y={points[0].y - 30} textAnchor="middle" fill={zone.color} fontSize="11" fontWeight="900" className="uppercase tracking-widest drop-shadow-[0_2px_2px_rgba(255,255,255,1)]">
                  {zone.name}
                </text>
              </motion.g>
            );
          })}

          {/* Zona en Edición */}
          {currentZonePath.length > 0 && (
            <g>
              {currentZonePath.length > 2 ? (
                <path d={`M ${currentZonePath.map(p => `${p.x},${p.y}`).join(' L ')} Z`} fill={activeColor} stroke={activeColor} strokeWidth="3" strokeDasharray="5,5" className="opacity-40" />
              ) : currentZonePath.length > 1 ? (
                <line x1={currentZonePath[0].x} y1={currentZonePath[0].y} x2={currentZonePath[1].x} y2={currentZonePath[1].y} stroke={activeColor} strokeWidth="3" strokeDasharray="5,5" />
              ) : null}
              {currentZonePath.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="8" fill={activeColor} stroke="white" strokeWidth="3" className="shadow-xl" />
              ))}
            </g>
          )}

          {/* Rutas Guardadas */}
          {projectedSavedRoutes.map((route) => (
            <g key={route.id} className="opacity-60">
              <path d={`M ${route.points.map((p: any) => `${p.x},${p.y}`).join(' L ')}`} fill="none" stroke="#2563eb" strokeWidth="4" strokeDasharray="10,5" />
              {route.points.map((p: any, i: number) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2563eb" stroke="white" strokeWidth="2" />
              ))}
            </g>
          ))}

          {/* Ruta en Edición */}
          {currentRoutePath.length > 0 && (
            <g>
              {currentRoutePath.length > 1 && (
                <path d={`M ${currentRoutePath.map(p => `${p.x},${p.y}`).join(' L ')}`} fill="none" stroke="#2563eb" strokeWidth="6" strokeDasharray="15,8" />
              )}
              {currentRoutePath.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="9" fill="#2563eb" stroke="white" strokeWidth="3" />
                  <text x={p.x + 14} y={p.y + 5} fill="#2563eb" fontSize="11" fontWeight="900" className="drop-shadow-md">P{i + 1}</text>
                </g>
              ))}
            </g>
          )}
        </svg>

        {/* Mira Telescópica Central */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 opacity-10">
          <div className="w-40 h-40 border border-primary/20 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_15px_rgba(37,99,235,1)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
