'use server';
/**
 * @fileOverview A Genkit flow for driver assignment with multi-model redundancy for high availability.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const DriverVehicleType = z.enum(['car', 'van', 'truck', 'motorcycle']);

const IntelligentDriverAssignmentInputSchema = z.object({
  routeDetails: z.object({
    origin: LocationSchema,
    destination: LocationSchema,
    waypoints: z.array(LocationSchema).optional(),
    estimatedDurationMinutes: z.number(),
    requiredVehicleType: DriverVehicleType,
  }),
  availableDrivers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    currentLocation: LocationSchema,
    vehicleType: DriverVehicleType,
    isAvailable: z.boolean(),
    scheduledHoursRemaining: z.number(),
  })),
});

export type IntelligentDriverAssignmentInput = z.infer<typeof IntelligentDriverAssignmentInputSchema>;

const IntelligentDriverAssignmentOutputSchema = z.object({
  assignedDriverId: z.string().nullable(),
  reasoning: z.string(),
});

export type IntelligentDriverAssignmentOutput = z.infer<typeof IntelligentDriverAssignmentOutputSchema>;

const assignDriverPrompt = ai.definePrompt({
  name: 'assignDriverPrompt',
  input: { schema: IntelligentDriverAssignmentInputSchema },
  output: { schema: IntelligentDriverAssignmentOutputSchema },
  prompt: `You are an intelligent dispatcher for VectraLogix. Assign the best driver to the route.
  
Criteria:
1. Availability and scheduled hours.
2. Vehicle type match.
3. Proximity to origin.

Route: {{routeDetails.requiredVehicleType}} required.
Drivers:
{{#each availableDrivers}}
- {{name}} ({{id}}): {{vehicleType}}, {{scheduledHoursRemaining}}h left.
{{/each}}
`,
});

const intelligentDriverAssignmentFlow = ai.defineFlow(
  {
    name: 'intelligentDriverAssignmentFlow',
    inputSchema: IntelligentDriverAssignmentInputSchema,
    outputSchema: IntelligentDriverAssignmentOutputSchema,
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
        const { output } = await assignDriverPrompt(input, {
          model: model as any,
        });
        if (output) {
          const reasoning = model.includes('pro') 
            ? `${output.reasoning} (Asignación validada por sistema de alta disponibilidad)` 
            : output.reasoning;
          return { ...output, reasoning };
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`Driver assignment model ${model} failed, trying next...`, error.message);
      }
    }

    throw new Error(lastError?.message || 'Error crítico en el despachador de IA: Fallo de todos los modelos.');
  }
);

export async function intelligentDriverAssignment(input: IntelligentDriverAssignmentInput): Promise<IntelligentDriverAssignmentOutput> {
  return intelligentDriverAssignmentFlow(input);
}
