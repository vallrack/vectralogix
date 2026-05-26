'use server';
/**
 * @fileOverview Un flujo de Genkit para geocodificar ubicaciones y direcciones en Colombia.
 * Utiliza redundancia de modelos (Flash 2.5, Flash 1.5, Pro 1.5) para alta disponibilidad.
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
  1. Identifica el lugar más probable en Colombia.
  2. Maneja direcciones (Calles, Carreras, Avenidas) y barrios (ej: 'La Gabriela' en Bello).
  3. Provee Latitud y Longitud precisas.
  4. Sugiere zoom: 19 para dirección exacta, 16 para barrios, 12 para ciudades.`,
});

export async function geocodeLocation(input: GeocodeInput): Promise<GeocodeResponse> {
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
      console.warn(`Modelo ${model} falló, intentando siguiente...`, error.message);
      
      if (error.message?.includes('leaked') || error.status === 403) {
        continue; // Intentar con el siguiente modelo incluso si la API Key está reportada (redundancia)
      }
    }
  }

  return { 
    success: false, 
    error: 'Incidencia técnica en el ejército de IA: Todos los modelos han agotado sus intentos o las credenciales están bloqueadas.',
    isApiKeyError: lastError?.status === 403 || lastError?.message?.includes('leaked')
  };
}
