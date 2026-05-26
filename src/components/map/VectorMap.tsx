
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function VectorMap() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0A0C10] select-none">
      {/* Mapa de Google con filtros para modo oscuro */}
      <div className="w-full h-full grayscale-[0.8] contrast-[1.2] invert-[0.9] opacity-30">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000000!2d-74.0760!3d4.5981!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses-419!2sco!4v1620000000000!5m2!1ses-419!2sco"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          className="pointer-events-auto"
        />
      </div>

      {/* Overlay oscuro que no bloquea clics (usando z-index y pointer-events) */}
      <div className="absolute inset-0 bg-[#0A0C10]/60 pointer-events-none z-10" />
      
      {/* Layer de Etiquetas de Ciudad */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <div className="absolute top-[40%] left-[55%] text-[10px] font-bold text-white/40 tracking-widest">BOGOTÁ</div>
        <div className="absolute top-[45%] left-[60%] text-[10px] font-bold text-white/20 tracking-widest uppercase">COLOMBIA</div>
        <div className="absolute top-[35%] left-[45%] text-[8px] font-bold text-white/30 tracking-widest">MEDELLÍN</div>
        <div className="absolute top-[52%] left-[48%] text-[8px] font-bold text-white/30 tracking-widest uppercase">CALI</div>
        
        {/* Fronteras simplificadas */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1000 1000">
          <path d="M400,200 L500,150 L600,250 L650,400 L600,600 L500,800 L300,700 L250,500 Z" fill="none" stroke="white" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}
