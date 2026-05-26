'use server';
/**
 * @fileOverview Generación de rutas optimizadas con redundancia de modelos para VectraLogix.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string(),
});

const OptimizedDeliveryRouteGenerationInputSchema = z.object({
  deliveryLocations: z.array(LocationSchema),
  startLocation: LocationSchema,
});

const OptimizedDeliveryRouteGenerationOutputSchema = z.object({
  optimizedSequence: z.array(z.any()),
  totalDistanceKm: z.number(),
  estimatedTravelTimeMinutes: z.number(),
  optimizationNotes: z.string(),
});

const optimizeRoutePrompt = ai.definePrompt({
  name: 'optimizeDeliveryRoutePrompt',
  input: { schema: OptimizedDeliveryRouteGenerationInputSchema },
  output: { schema: OptimizedDeliveryRouteGenerationOutputSchema },
  prompt: `Eres el planificador maestro de VectraLogix. Optimiza esta ruta de entrega.
  
Origen: {{{startLocation.address}}}
Destinos:
{{#each deliveryLocations}}
  - {{{address}}}
{{/each}}

Devuelve la secuencia lógica de paradas para minimizar el tiempo y distancia.`,
});

export async function generateOptimizedDeliveryRoute(input: any): Promise<any> {
  const models = ['googleai/gemini-2.5-flash', 'googleai/gemini-1.5-flash', 'googleai/gemini-1.5-pro'];
  
  for (const model of models) {
    try {
      const { output } = await optimizeRoutePrompt(input, { model: model as any });
      if (output) return output;
    } catch (e) {
      console.warn(`Optimización falló en ${model}, conmutando...`);
    }
  }
  throw new Error('Optimización fallida tras agotar el ejército de IA.');
}
