
'use server';
/**
 * @fileOverview A Genkit flow for generating optimized delivery routes with resilience.
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

The sequence must start and end at the start location.
`,
});

const optimizedDeliveryRouteGenerationFlow = ai.defineFlow(
  {
    name: 'optimizedDeliveryRouteGenerationFlow',
    inputSchema: OptimizedDeliveryRouteGenerationInputSchema,
    outputSchema: OptimizedDeliveryRouteGenerationOutputSchema,
  },
  async (input) => {
    try {
      // Intentamos con Gemini 2.5 Flash
      const { output } = await optimizeRoutePrompt(input, {
        model: 'googleai/gemini-2.5-flash',
      });
      return output!;
    } catch (error) {
      console.error('Gemini primary route optimization failed, falling back to Pro model...', error);
      try {
        // Fallback a Gemini 1.5 Pro
        const { output } = await optimizeRoutePrompt(input, {
          model: 'googleai/gemini-1.5-pro',
        });
        return {
          ...output!,
          optimizationNotes: output!.optimizationNotes + "\n\n(Generado vía sistema de respaldo por alta demanda)",
        };
      } catch (fallbackError) {
        console.error('All AI models failed for route optimization', fallbackError);
        throw new Error('El sistema de optimización de rutas no está disponible. Inténtalo de nuevo más tarde.');
      }
    }
  }
);

export async function generateOptimizedDeliveryRoute(
  input: OptimizedDeliveryRouteGenerationInput
): Promise<OptimizedDeliveryRouteGenerationOutput> {
  return optimizedDeliveryRouteGenerationFlow(input);
}
