
"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface VectorMapProps {
  lat: number;
  lng: number;
  zoom: number;
  plannedPoints?: any[];
  zones?: any[];
  savedRoutes?: any[];
  containerRef?: React.RefObject<HTMLDivElement>;
}

export function VectorMap({ lat, lng, zoom, plannedPoints = [], zones = [], savedRoutes = [], containerRef }: VectorMapProps) {
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

  const projectPoint = (pLat: number, pLng: number) => {
    const worldSize = 256 * Math.pow(2, zoom);
    const lngScale = worldSize / 360;
    const latRad = lat * Math.PI / 180;
    const latScale = lngScale / Math.cos(latRad);

    const xOffset = (pLng - lng) * lngScale;
    const yOffset = (lat - pLat) * latScale;

    return {
      x: dimensions.width / 2 + xOffset,
      y: dimensions.height / 2 + yOffset
    };
  };

  const currentPathPoints = useMemo(() => {
    if (dimensions.width === 0) return [];
    return plannedPoints.map(p => projectPoint(p.lat, p.lng));
  }, [plannedPoints, lat, lng, zoom, dimensions]);

  const projectedZones = useMemo(() => {
    if (dimensions.width === 0) return [];
    return (zones || []).map(zone => {
      const center = zone.coordinates?.[0] || { lat, lng };
      return {
        ...zone,
        ...projectPoint(center.lat, center.lng)
      };
    });
  }, [zones, lat, lng, zoom, dimensions]);

  const projectedSavedRoutes = useMemo(() => {
    if (dimensions.width === 0) return [];
    return (savedRoutes || []).map(route => ({
      ...route,
      points: (route.stops || []).map((s: any) => projectPoint(s.lat, s.lng))
    }));
  }, [savedRoutes, lat, lng, zoom, dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-white select-none pointer-events-none">
      <div className="absolute inset-0 grayscale-[0.1] contrast-[1.05] opacity-80">
        <iframe
          key={`${lat}-${lng}-${displayZoom}`}
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          title="Google Maps Tactical Console"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-slate-200/20 via-transparent to-white/10 pointer-events-none z-10" />
      
      <div className="absolute inset-0 pointer-events-none z-20">
        <svg 
          className="w-full h-full" 
          width={dimensions.width} 
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          {/* Zonas Proyectadas */}
          {projectedZones.map((zone) => {
            const baseSize = Math.pow(2, zoom - 12) * 20;
            return (
              <motion.g key={zone.id} initial={{ opacity: 0 }} animate={{ opacity: 0.25 }}>
                {zone.type === 'circle' ? (
                  <circle cx={zone.x} cy={zone.y} r={baseSize * 5} fill={zone.color} stroke={zone.color} strokeWidth="2" strokeDasharray="4,2" />
                ) : zone.type === 'rect' ? (
                  <rect x={zone.x - baseSize * 5} y={zone.y - baseSize * 4} width={baseSize * 10} height={baseSize * 8} fill={zone.color} stroke={zone.color} strokeWidth="2" strokeDasharray="4,2" />
                ) : (
                  <path d={`M${zone.x},${zone.y - baseSize * 6} L${zone.x + baseSize * 7},${zone.y - baseSize} L${zone.x + baseSize * 4},${zone.y + baseSize * 6} L${zone.x - baseSize * 4},${zone.y + baseSize * 6} L${zone.x - baseSize * 7},${zone.y - baseSize} Z`} fill={zone.color} stroke={zone.color} strokeWidth="2" strokeDasharray="4,2" />
                )}
                <text x={zone.x} y={zone.y - (baseSize * 7)} textAnchor="middle" fill={zone.color} fontSize="11" fontWeight="800" className="uppercase tracking-widest drop-shadow-md">{zone.name}</text>
              </motion.g>
            );
          })}

          {/* Rutas Guardadas */}
          {projectedSavedRoutes.map((route) => (
            <g key={route.id} className="opacity-40">
              <path
                d={`M ${route.points.map((p: any) => `${p.x},${p.y}`).join(' L ')}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
              {route.points.map((p: any, i: number) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#94a3b8" />
              ))}
            </g>
          ))}

          {/* Ruta Actual en Trazado */}
          {currentPathPoints.length > 1 && (
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              d={`M ${currentPathPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              strokeDasharray="8,4"
            />
          )}

          {/* Nodos de la Ruta Actual */}
          {currentPathPoints.map((point, i) => (
            <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <circle cx={point.x} cy={point.y} r="5" fill="#2563eb" stroke="white" strokeWidth="2" />
              <text x={point.x + 8} y={point.y + 4} fill="#2563eb" fontSize="10" fontWeight="bold" className="drop-shadow-sm">N{i + 1}</text>
            </motion.g>
          ))}
        </svg>

        {/* Mira Central */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 opacity-20">
          <div className="w-20 h-20 border border-primary/40 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-lg" />
            <div className="absolute w-full h-[1px] bg-primary/30" />
            <div className="absolute h-full w-[1px] bg-primary/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
