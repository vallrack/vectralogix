'use server';
/**
 * @fileOverview A Genkit flow for generating optimized delivery routes.
 *
 * - generateOptimizedDeliveryRoute - A function that orchestrates the route optimization process.
 * - OptimizedDeliveryRouteGenerationInput - The input type for the route optimization function.
 * - OptimizedDeliveryRouteGenerationOutput - The return type for the route optimization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Schema for a geographical location with address details.
 */
const LocationSchema = z.object({
  lat: z.number().describe('Latitude of the location.'),
  lng: z.number().describe('Longitude of the location.'),
  address: z.string().describe('Full address of the location.'),
});

/**
 * Input schema for the optimized delivery route generation flow.
 */
const OptimizedDeliveryRouteGenerationInputSchema = z.object({
  deliveryLocations: z.array(LocationSchema).describe('A list of delivery locations to be visited.'),
  startLocation: LocationSchema.describe('The starting point for the delivery route, which also serves as the end point for a round trip.'),
  vehicleCapacity: z.number().int().positive().describe('The maximum capacity of the delivery vehicle (e.g., number of packages or weight units).'),
  averageVehicleSpeedKmh: z.number().positive().describe('The average speed of the vehicle in kilometers per hour for estimation purposes.'),
  currentTime: z.string().datetime().describe('The current timestamp in ISO 8601 format, used by the AI for simulating real-time traffic conditions.').default(new Date().toISOString()),
});

export type OptimizedDeliveryRouteGenerationInput = z.infer<typeof OptimizedDeliveryRouteGenerationInputSchema>;

/**
 * Schema for an optimized stop in the delivery route.
 */
const OptimizedStopSchema = z.object({
  lat: z.number().describe('Latitude of the optimized stop.'),
  lng: z.number().describe('Longitude of the optimized stop.'),
  address: z.string().describe('Full address of the optimized stop.'),
  stopOrder: z.number().int().positive().describe('The sequential order of this stop in the optimized route, starting from 1.'),
});

/**
 * Output schema for the optimized delivery route generation flow.
 */
const OptimizedDeliveryRouteGenerationOutputSchema = z.object({
  optimizedSequence: z.array(OptimizedStopSchema).describe('The optimized sequence of delivery stops, starting and ending with the startLocation.'),
  totalDistanceKm: z.number().describe('The total estimated distance of the optimized route in kilometers.'),
  estimatedTravelTimeMinutes: z.number().describe('The total estimated travel time for the optimized route in minutes, considering average speed and simulated traffic.'),
  optimizationNotes: z.string().describe('A detailed explanation of the logic and considerations used to generate the optimized route, including simulated traffic effects and capacity handling.'),
});

export type OptimizedDeliveryRouteGenerationOutput = z.infer<typeof OptimizedDeliveryRouteGenerationOutputSchema>;

/**
 * Generates an optimized delivery route based on provided locations and vehicle constraints.
 * @param input - The input containing delivery locations, vehicle capacity, and other parameters.
 * @returns A promise that resolves to the optimized route details.
 */
export async function generateOptimizedDeliveryRoute(
  input: OptimizedDeliveryRouteGenerationInput
): Promise<OptimizedDeliveryRouteGenerationOutput> {
  return optimizedDeliveryRouteGenerationFlow(input);
}

/**
 * Defines the prompt for the route optimization AI.
 */
const optimizeRoutePrompt = ai.definePrompt({
  name: 'optimizeDeliveryRoutePrompt',
  input: { schema: OptimizedDeliveryRouteGenerationInputSchema },
  output: { schema: OptimizedDeliveryRouteGenerationOutputSchema },
  prompt: `You are an expert logistics planner specializing in route optimization for delivery services. Your goal is to minimize fuel consumption and maximize successful deliveries by creating the most efficient route sequence.

Given the following information, generate an optimized delivery route. Assume you have access to real-time traffic data for the given 'currentTime' and incorporate its effects into your route planning and time estimations. Also, consider vehicle capacity.

Input Details:
- Current Time: {{{currentTime}}}
- Start Location: Address: {{{startLocation.address}}} (Lat: {{{startLocation.lat}}}, Lng: {{{startLocation.lng}}})
- Delivery Locations ({{deliveryLocations.length}} total):
{{#each deliveryLocations}}
  - Address: {{{address}}} (Lat: {{{lat}}}, Lng: {{{lng}}})
{{/each}}
- Vehicle Capacity: {{vehicleCapacity}} units
- Average Vehicle Speed: {{averageVehicleSpeedKmh}} km/h

Your response MUST be a JSON object conforming to the OptimizedDeliveryRouteGenerationOutputSchema.
The 'optimizedSequence' should start with the 'startLocation', then list the delivery locations in their optimal visiting order, and finally end back at the 'startLocation' to complete a round trip.
Provide 'optimizationNotes' explaining your reasoning, including how you simulated traffic, handled vehicle capacity (if applicable), and calculated distances/times based on the average speed.
`
});

/**
 * Defines the Genkit flow for generating optimized delivery routes.
 */
const optimizedDeliveryRouteGenerationFlow = ai.defineFlow(
  {
    name: 'optimizedDeliveryRouteGenerationFlow',
    inputSchema: OptimizedDeliveryRouteGenerationInputSchema,
    outputSchema: OptimizedDeliveryRouteGenerationOutputSchema,
  },
  async (input) => {
    const {output} = await optimizeRoutePrompt(input);
    return output!;
  }
);
