'use server';
/**
 * @fileOverview A Genkit flow for generating optimized delivery routes with high-availability redundancy.
 * Iterates through multiple Gemini models to ensure service continuity.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LocationSchema = z.object({
  lat: z.number().describe('Latitude of the location.'),
  lng: z.number().describe('Longitude of the location.'),
  address: z.string().describe('Full address of the location.'),
});

const OptimizedDeliveryRouteGenerationInputSchema = z.object({
  deliveryLocations: z.array(LocationSchema).describe('A list of delivery locations to be visited.'),
  startLocation: LocationSchema.describe('The starting point for the delivery route.'),
  vehicleCapacity: z.number().int().positive().describe('Maximum capacity.'),
  averageVehicleSpeedKmh: z.number().positive().describe('Average speed in km/h.'),
  currentTime: z.string().datetime().describe('Current timestamp.').default(new Date().toISOString()),
});

export type OptimizedDeliveryRouteGenerationInput = z.infer<typeof OptimizedDeliveryRouteGenerationInputSchema>;

const OptimizedStopSchema = z.object({
  lat: z.number().describe('Latitude.'),
  lng: z.number().describe('Longitude.'),
  address: z.string().describe('Address.'),
  stopOrder: z.number().int().positive().describe('Sequence order.'),
});

const OptimizedDeliveryRouteGenerationOutputSchema = z.object({
  optimizedSequence: z.array(OptimizedStopSchema).describe('The optimized sequence.'),
  totalDistanceKm: z.number().describe('Total estimated distance.'),
  estimatedTravelTimeMinutes: z.number().describe('Total estimated travel time.'),
  optimizationNotes: z.string().describe('Detailed explanation of logic.'),
});

export type OptimizedDeliveryRouteGenerationOutput = z.infer<typeof OptimizedDeliveryRouteGenerationOutputSchema>;

const optimizeRoutePrompt = ai.definePrompt({
  name: 'optimizeDeliveryRoutePrompt',
  input: { schema: OptimizedDeliveryRouteGenerationInputSchema },
  output: { schema: OptimizedDeliveryRouteGenerationOutputSchema },
  prompt: `You are an expert logistics planner for VectraLogix. Optimize the delivery route for efficiency.
  
Input Details:
- Current Time: {{{currentTime}}}
- Start Location: {{{startLocation.address}}}
- Delivery Locations:
{{#each deliveryLocations}}
  - {{{address}}}
{{/each}}
- Vehicle Capacity: {{vehicleCapacity}} units
- Average Speed: {{averageVehicleSpeedKmh}} km/h

The sequence must start and end at the start location. Ensure the output is a valid sequence of stops.`,
});

const optimizedDeliveryRouteGenerationFlow = ai.defineFlow(
  {
    name: 'optimizedDeliveryRouteGenerationFlow',
    inputSchema: OptimizedDeliveryRouteGenerationInputSchema,
    outputSchema: OptimizedDeliveryRouteGenerationOutputSchema,
  },
  async (input) => {
    const models = [
      'googleai/gemini-2.5-flash',
      'googleai/gemini-1.5-flash',
      'googleai/gemini-1.5-pro'
    ];

    let lastError: any = null;

    for (const model of models) {
      try {
        const { output } = await optimizeRoutePrompt(input, {
          model: model as any,
        });
        if (output) {
          const notes = model.includes('pro') 
            ? `${output.optimizationNotes}\n\n(Optimizado vía sistema de redundancia de alta capacidad)` 
            : output.optimizationNotes;
          return { ...output, optimizationNotes: notes };
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`Route optimization model ${model} failed, trying next...`, error.message);
      }
    }

    throw new Error(lastError?.message || 'Sistema de optimización de rutas no disponible tras agotar modelos de respaldo.');
  }
);

export async function generateOptimizedDeliveryRoute(
  input: OptimizedDeliveryRouteGenerationInput
): Promise<OptimizedDeliveryRouteGenerationOutput> {
  return optimizedDeliveryRouteGenerationFlow(input);
}
