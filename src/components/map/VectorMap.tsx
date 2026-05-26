
"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface VectorMapProps {
  lat: number;
  lng: number;
  zoom: number;
  plannedPoints?: any[];
  zones?: any[];
  containerRef?: React.RefObject<HTMLDivElement>;
}

export function VectorMap({ lat, lng, zoom, plannedPoints = [], zones = [], containerRef }: VectorMapProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed&t=m`;

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

  // Función de proyección precisa basada en píxeles de pantalla
  const projectPoint = (pLat: number, pLng: number) => {
    const latRad = lat * Math.PI / 180;
    const worldSize = 256 * Math.pow(2, zoom);
    const lngScale = worldSize / 360;
    const latScale = lngScale / Math.cos(latRad);

    const xOffset = (pLng - lng) * lngScale;
    const yOffset = (lat - pLat) * latScale;

    return {
      x: dimensions.width / 2 + xOffset,
      y: dimensions.height / 2 + yOffset
    };
  };

  const pathPoints = useMemo(() => {
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

  return (
    <div className="relative w-full h-full overflow-hidden bg-white select-none pointer-events-none">
      <div className="absolute inset-0 grayscale-[0.2] contrast-[1.05] opacity-70">
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

      <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10 pointer-events-none z-10" />
      
      <div className="absolute inset-0 pointer-events-none z-20">
        <svg 
          className="w-full h-full" 
          width={dimensions.width} 
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#2563eb" strokeWidth="0.5" opacity="0.03" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Zonas Proyectadas con Escala Adaptativa */}
          {projectedZones.map((zone, i) => {
            const baseSize = Math.pow(2, zoom - 12) * 20;
            return (
              <motion.g 
                key={zone.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.25, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                {zone.type === 'circle' ? (
                  <circle cx={zone.x} cy={zone.y} r={baseSize * 5} fill={zone.color} stroke={zone.color} strokeWidth="2" strokeDasharray="4,2" />
                ) : zone.type === 'rect' ? (
                  <rect x={zone.x - baseSize * 5} y={zone.y - baseSize * 4} width={baseSize * 10} height={baseSize * 8} fill={zone.color} stroke={zone.color} strokeWidth="2" strokeDasharray="4,2" />
                ) : (
                  <path d={`M${zone.x},${zone.y - baseSize * 6} L${zone.x + baseSize * 7},${zone.y - baseSize} L${zone.x + baseSize * 4},${zone.y + baseSize * 6} L${zone.x - baseSize * 4},${zone.y + baseSize * 6} L${zone.x - baseSize * 7},${zone.y - baseSize} Z`} fill={zone.color} stroke={zone.color} strokeWidth="2" strokeDasharray="4,2" />
                )}
                <text x={zone.x} y={zone.y} textAnchor="middle" fill={zone.color} fontSize="12" fontWeight="800" opacity="1" className="uppercase tracking-widest drop-shadow-sm">{zone.name}</text>
              </motion.g>
            );
          })}

          {/* Rutas con Líneas de Alta Precisión */}
          {pathPoints.length > 1 && (
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "linear" }}
              d={`M ${pathPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeDasharray="8,4"
              opacity="0.6"
            />
          )}

          {/* Nodos Tácticos */}
          {pathPoints.map((point, i) => (
            <motion.g 
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <circle cx={point.x} cy={point.y} r="12" fill="#2563eb" opacity="0.1" />
              <circle cx={point.x} cy={point.y} r="4" fill="#2563eb" stroke="white" strokeWidth="2" />
              <text x={point.x + 8} y={point.y + 4} fill="#2563eb" fontSize="9" fontWeight="bold" className="drop-shadow-sm">N{i + 1}</text>
            </motion.g>
          ))}
        </svg>

        {/* Mira Central Táctica */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 opacity-15">
          <div className="w-32 h-32 border border-primary/30 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            <div className="absolute w-full h-[1px] bg-primary/20" />
            <div className="absolute h-full w-[1px] bg-primary/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
