
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit instance configured with Google AI.
 * Usamos Gemini 2.5 Flash como modelo primario por su velocidad.
 * Gemini 1.5 Pro se utiliza como fallback en los flujos para alta disponibilidad.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-2.5-flash',
});
