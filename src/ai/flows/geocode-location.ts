
'use server';
/**
 * @fileOverview Motor de geocodificación resiliente con el 'Ejército de IA'.
 * Implementa una cascada de modelos (Flash 2.5 -> Flash 1.5 -> Pro) para asegurar la localización.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeocodeInputSchema = z.object({
  query: z.string().describe('La dirección o punto de referencia a buscar en Colombia.'),
});

export type GeocodeInput = z.infer<typeof GeocodeInputSchema>;

const GeocodeOutputSchema = z.object({
  lat: z.number().describe('Latitud de la ubicación.'),
  lng: z.number().describe('Longitud de la ubicación.'),
  displayName: z.string().describe('Nombre formateado del lugar.'),
  zoom: z.number().describe('Nivel de zoom sugerido (12-19).'),
});

export type GeocodeOutput = z.infer<typeof GeocodeOutputSchema>;

export type GeocodeResponse = {
  success: boolean;
  data?: GeocodeOutput;
  error?: string;
  isApiKeyError?: boolean;
};

const geocodePrompt = ai.definePrompt({
  name: 'geocodePrompt',
  input: { schema: GeocodeInputSchema },
  output: { schema: GeocodeOutputSchema },
  prompt: `Eres un experto en geografía colombiana para VectraLogix.
  
  Convierte la consulta del usuario en coordenadas GPS precisas.
  Consulta: {{{query}}}
  
  Instrucciones:
  1. Identifica el lugar más probable en Colombia (especialmente en el área de Bello, Antioquia).
  2. Maneja direcciones exactas y barrios.
  3. Provee Latitud y Longitud precisas.
  4. Sugiere zoom: 19 para dirección exacta, 16 para barrios, 12 para ciudades.`,
});

export async function geocodeLocation(input: GeocodeInput): Promise<GeocodeResponse> {
  // Ejército de IA: Intentamos con múltiples modelos para garantizar la respuesta
  const models = [
    'googleai/gemini-2.5-flash',
    'googleai/gemini-1.5-flash',
    'googleai/gemini-1.5-pro'
  ];

  let lastError: any = null;

  for (const model of models) {
    try {
      const { output } = await geocodePrompt(input, {
        model: model as any,
      });
      if (output) return { success: true, data: output };
    } catch (error: any) {
      lastError = error;
      console.warn(`Ejército de IA: Modelo ${model} no disponible, reintentando con reserva...`);
      
      // Si es un error de API Key (leaked/403), continuamos al siguiente modelo
      if (error.message?.includes('leaked') || error.status === 403 || error.message?.includes('403')) {
        continue;
      }
    }
  }

  return { 
    success: false, 
    error: 'El ejército de IA ha agotado sus reservas de potencia o las llaves están bloqueadas.',
    isApiKeyError: lastError?.status === 403 || lastError?.message?.includes('leaked') || lastError?.message?.includes('403')
  };
}
