
'use server';
/**
 * @fileOverview A Genkit flow for geocoding locations and landmarks in Colombia.
 * Handles AI-based coordinate lookup with multi-model redundancy for high availability.
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
    try {
      // Intento Primario: Gemini 2.5 Flash
      const { output } = await geocodePrompt(input, {
        model: 'googleai/gemini-2.5-flash',
      });
      if (!output) throw new Error('Empty output from primary model');
      return output;
    } catch (error) {
      console.warn('Primary geocode model failed, scaling to redundant model...', error);
      try {
        // Intento de Respaldo: Gemini 1.5 Pro
        const { output } = await geocodePrompt(input, {
          model: 'googleai/gemini-1.5-pro',
        });
        if (!output) throw new Error('Empty output from redundant model');
        return output;
      } catch (fallbackError) {
        throw new Error('La inteligencia geográfica no está disponible en este momento por fallos en los modelos de lenguaje de Google.');
      }
    }
  }
);

export async function geocodeLocation(input: GeocodeInput): Promise<GeocodeResponse> {
  try {
    const result = await geocodeLocationFlow(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('All geocode models failed:', error);
    
    // Capturamos específicamente fallos de API Key o seguridad
    if (error.message?.includes('leaked') || error.message?.includes('API key') || error.status === 403) {
      return { 
        success: false, 
        error: 'Incidencia de seguridad detectada en la API Key de Google. El servicio está en modo degradado. Contacte a soporte técnico.' 
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'No se pudo localizar el punto exacto. Prueba con una dirección más completa.' 
    };
  }
}
