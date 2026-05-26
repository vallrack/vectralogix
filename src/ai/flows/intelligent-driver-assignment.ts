'use server';
/**
 * @fileOverview Flujo de Genkit para asignación inteligente de conductores con redundancia de modelos.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const IntelligentDriverAssignmentInputSchema = z.object({
  routeDetails: z.object({
    origin: LocationSchema,
    requiredVehicleType: z.string(),
  }),
  availableDrivers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    vehicleType: z.string(),
    performance: z.number(),
  })),
});

const IntelligentDriverAssignmentOutputSchema = z.object({
  assignedDriverId: z.string().nullable(),
  reasoning: z.string(),
});

const assignDriverPrompt = ai.definePrompt({
  name: 'assignDriverPrompt',
  input: { schema: IntelligentDriverAssignmentInputSchema },
  output: { schema: IntelligentDriverAssignmentOutputSchema },
  prompt: `Eres el despachador inteligente de VectraLogix. Asigna el mejor conductor basándote en rendimiento y tipo de vehículo.
  
Requisitos: {{routeDetails.requiredVehicleType}}.
Conductores:
{{#each availableDrivers}}
- {{name}} ({{id}}): {{vehicleType}}, {{performance}}% rendimiento.
{{/each}}`,
});

export async function intelligentDriverAssignment(input: any): Promise<any> {
  const models = ['googleai/gemini-2.5-flash', 'googleai/gemini-1.5-flash', 'googleai/gemini-1.5-pro'];
  
  for (const model of models) {
    try {
      const { output } = await assignDriverPrompt(input, { model: model as any });
      if (output) return output;
    } catch (e) {
      console.warn(`Asignación falló en ${model}, reintentando...`);
    }
  }
  throw new Error('El ejército de IA no pudo procesar la asignación.');
}
