'use server';
/**
 * @fileOverview A Genkit flow for intelligently assigning the most suitable driver to an optimal route.
 *
 * - intelligentDriverAssignment - A function that handles the driver assignment process.
 * - IntelligentDriverAssignmentInput - The input type for the intelligentDriverAssignment function.
 * - IntelligentDriverAssignmentOutput - The return type for the intelligentDriverAssignment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LocationSchema = z.object({
  latitude: z.number().describe('The latitude coordinate.'),
  longitude: z.number().describe('The longitude coordinate.'),
});

const DriverVehicleType = z.enum(['car', 'van', 'truck', 'motorcycle']);

const IntelligentDriverAssignmentInputSchema = z.object({
  routeDetails: z.object({
    origin: LocationSchema.describe('The starting point of the route.'),
    destination: LocationSchema.describe('The final destination of the route.'),
    waypoints: z.array(LocationSchema).optional().describe('Intermediate stops along the route.'),
    estimatedDurationMinutes: z.number().describe('Estimated duration of the route in minutes.'),
    requiredVehicleType: DriverVehicleType.describe('The type of vehicle required for this route.'),
  }).describe('Details of the optimal route to be assigned.'),
  availableDrivers: z.array(z.object({
    id: z.string().describe('Unique identifier for the driver.'),
    name: z.string().describe('Name of the driver.'),
    currentLocation: LocationSchema.describe('The current geographic location of the driver.'),
    vehicleType: DriverVehicleType.describe('The type of vehicle the driver operates.'),
    isAvailable: z.boolean().describe('Whether the driver is currently available for a new assignment.'),
    scheduledHoursRemaining: z.number().describe('Number of hours the driver is scheduled to work today.'),
  })).describe('A list of available drivers with their current status and capabilities.'),
}).describe('Input for the Intelligent Driver Assignment flow.');

export type IntelligentDriverAssignmentInput = z.infer<typeof IntelligentDriverAssignmentInputSchema>;

const IntelligentDriverAssignmentOutputSchema = z.object({
  assignedDriverId: z.string().nullable().describe('The ID of the most suitable driver assigned to the route, or null if no suitable driver was found.'),
  reasoning: z.string().describe('An explanation of why this driver was chosen, or why no driver was found.'),
}).describe('Output of the Intelligent Driver Assignment flow.');

export type IntelligentDriverAssignmentOutput = z.infer<typeof IntelligentDriverAssignmentOutputSchema>;

export async function intelligentDriverAssignment(input: IntelligentDriverAssignmentInput): Promise<IntelligentDriverAssignmentOutput> {
  return intelligentDriverAssignmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assignDriverPrompt',
  input: { schema: IntelligentDriverAssignmentInputSchema },
  output: { schema: IntelligentDriverAssignmentOutputSchema },
  prompt: `You are an intelligent dispatcher assistant. Your goal is to assign the most suitable driver from a list of available drivers to a given optimal route.\n\nConsider the following criteria for suitability:\n1.  **Availability**: The driver must be marked as 'isAvailable' and have sufficient 'scheduledHoursRemaining' to complete the estimated route duration.\n2.  **Vehicle Type**: The driver's 'vehicleType' must match the 'requiredVehicleType' for the route.\n3.  **Proximity**: The driver's 'currentLocation' should be as close as possible to the 'routeDetails.origin'.\n4.  **Route Fit**: Consider the estimated route duration in relation to the driver's remaining scheduled hours.\n\nHere are the details for the route:\nOrigin: Latitude {{{routeDetails.origin.latitude}}}, Longitude {{{routeDetails.origin.longitude}}}\nDestination: Latitude {{{routeDetails.destination.latitude}}}, Longitude {{{routeDetails.destination.longitude}}}\nEstimated Duration: {{{routeDetails.estimatedDurationMinutes}}} minutes\nRequired Vehicle Type: {{{routeDetails.requiredVehicleType}}}\n{{#if routeDetails.waypoints}}\nWaypoints:\n{{#each routeDetails.waypoints}}\n  - Latitude {{{latitude}}}, Longitude {{{longitude}}}\n{{/each}}\n{{/if}}\n\nHere is the list of available drivers:\n{{#each availableDrivers}}\n- Driver ID: {{{id}}}\n  Name: {{{name}}}\n  Current Location: Latitude {{{currentLocation.latitude}}}, Longitude {{{currentLocation.longitude}}}\n  Vehicle Type: {{{vehicleType}}}\n  Is Available: {{{isAvailable}}}\n  Scheduled Hours Remaining: {{{scheduledHoursRemaining}}} hours\n{{/each}}\n\nBased on these criteria, determine the most suitable driver. If no suitable driver is found, set 'assignedDriverId' to null. Provide a clear reasoning for your decision.`,
});

const intelligentDriverAssignmentFlow = ai.defineFlow(
  {
    name: 'intelligentDriverAssignmentFlow',
    inputSchema: IntelligentDriverAssignmentInputSchema,
    outputSchema: IntelligentDriverAssignmentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
