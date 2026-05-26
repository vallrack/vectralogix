'use server';
/**
 * @fileOverview A Genkit flow for geocoding locations and landmarks in Colombia.
 * Handles AI-based coordinate lookup with multi-model redundancy (2.5 Flash -> 1.5 Flash -> 1.5 Pro).
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
  prompt: `You are a geographic intelligence expert for VectraLogix, specialized in the territory of Colombia.
  
  Your task is to convert the user's search query into precise GPS coordinates.
  
  Search Query: {{{query}}}
  
  Instructions:
  1. Identify the most likely location in Colombia.
  2. Provide accurate Latitude and Longitude.
  3. If it's a neighborhood or specific landmark (like 'La Gabriela' in Bello), suggest a zoom level of 16-17.
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
        if (output) return output;
      } catch (error: any) {
        lastError = error;
        console.warn(`Model ${model} failed, trying next...`, error.message);
        
        // Si es un error de API Key filtrada, el resto de modelos de Google probablemente también fallen,
        // pero intentamos por si el usuario tiene diferentes cuotas o configuraciones.
        if (error.message?.includes('leaked') || error.status === 403) {
          continue;
        }
      }
    }

    if (lastError?.message?.includes('leaked') || lastError?.status === 403) {
      throw new Error('API_KEY_LEAKED');
    }

    throw new Error('SERVICE_UNAVAILABLE');
  }
);

export async function geocodeLocation(input: GeocodeInput): Promise<GeocodeResponse> {
  try {
    const result = await geocodeLocationFlow(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('All geocode models failed:', error);
    
    if (error.message === 'API_KEY_LEAKED') {
      return { 
        success: false, 
        isApiKeyError: true,
        error: 'Incidencia de seguridad: La API Key de Google ha sido revocada por filtración. El servicio de IA está suspendido hasta actualizar la credencial.' 
      };
    }
    
    return { 
      success: false, 
      error: 'La inteligencia geográfica no está disponible en este momento por fallos en los modelos de lenguaje de Google.' 
    };
  }
}
