
"use client"

import React from 'react';

interface VectorMapProps {
  lat: number;
  lng: number;
  zoom: number;
}

export function VectorMap({ lat, lng, zoom }: VectorMapProps) {
  // Construimos una URL de Google Maps dinámica basada en las coordenadas y el zoom
  // Usamos el parámetro q para centrar y z para el nivel de zoom
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed&t=m`;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0A0C10] select-none">
      {/* Contenedor del Mapa con filtros para estética dark profesional */}
      <div className="w-full h-full grayscale-[0.8] contrast-[1.2] invert-[0.9] opacity-40 transition-all duration-700 ease-in-out">
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

      {/* Overlay oscuro que no bloquea clics para mantener la estética de la app */}
      <div className="absolute inset-0 bg-[#0A0C10]/40 pointer-events-none z-10" />
      
      {/* Capa de telemetría visual opcional (líneas de rejilla o fronteras) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <div className="absolute top-[10%] left-[10%] text-[8px] font-bold text-white/10 tracking-[0.5em] uppercase">Sector de Análisis Activo</div>
        
        {/* Fronteras decorativas simplificadas */}
        <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 1000 1000">
          <path d="M400,200 L500,150 L600,250 L650,400 L600,600 L500,800 L300,700 L250,500 Z" fill="none" stroke="white" strokeWidth="0.5" />
        </svg>
      </div>
    </div>
  );
}
