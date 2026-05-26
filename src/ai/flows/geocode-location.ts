
'use server';
/**
 * @fileOverview A Genkit flow for geocoding locations and landmarks in Colombia.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeocodeInputSchema = z.object({
  query: z.string().describe('The address, landmark or location name to find in Colombia.'),
});

export type GeocodeInput = z.infer<typeof GeocodeInputSchema>;

const GeocodeOutputSchema = z.object({
  lat: z.number().describe('Latitude of the found location.'),
  lng: z.number().describe('Longitude of the found location.'),
  displayName: z.string().describe('Formatted name of the location.'),
  zoom: z.number().describe('Suggested zoom level for this location (12-18).'),
});

export type GeocodeOutput = z.infer<typeof GeocodeOutputSchema>;

const geocodePrompt = ai.definePrompt({
  name: 'geocodePrompt',
  input: { schema: GeocodeInputSchema },
  output: { schema: GeocodeOutputSchema },
  prompt: `You are a geographic intelligence expert for VectraLogix, specialized in the territory of Colombia.
  
  Your task is to convert the user's search query into precise GPS coordinates.
  
  Search Query: {{{query}}}
  
  Instructions:
  1. Identify the most likely location in Colombia.
  2. Provide accurate Latitude and Longitude.
  3. If it's a neighborhood or specific landmark, suggest a zoom level of 16-17.
  4. If it's a city or large area, suggest 12-13.
  5. Return a clean display name.`,
});

const geocodeLocationFlow = ai.defineFlow(
  {
    name: 'geocodeLocationFlow',
    inputSchema: GeocodeInputSchema,
    outputSchema: GeocodeOutputSchema,
  },
  async (input) => {
    const { output } = await geocodePrompt(input);
    return output!;
  }
);

export async function geocodeLocation(input: GeocodeInput): Promise<GeocodeOutput> {
  return geocodeLocationFlow(input);
}
