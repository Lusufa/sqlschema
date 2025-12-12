'use server';
/**
 * @fileOverview Generates mock data from a SQL query and database schema.
 *
 * - generateMockData - A function that generates mock data based on a SQL query and schema.
 * - GenerateMockDataInput - The input type for the generateMockData function.
 * - GenerateMockDataOutput - The return type for the generateMockData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMockDataInputSchema = z.object({
  schemaDefinition: z
    .string()
    .describe('The database schema definition.'),
  sqlQuery: z.string().describe('The SQL query to generate mock data for.'),
});
export type GenerateMockDataInput = z.infer<typeof GenerateMockDataInputSchema>;


const GenerateMockDataOutputSchema = z.object({
  mockData: z
    .string()
    .describe('A JSON array of objects representing the mock data for the query results. The structure of the objects should match the columns returned by the SQL query.'),
});
export type GenerateMockDataOutput = z.infer<typeof GenerateMockDataOutputSchema>;


export async function generateMockData(
  input: GenerateMockDataInput
): Promise<GenerateMockDataOutput> {
  return generateMockDataFlow(input);
}


const generateMockDataPrompt = ai.definePrompt({
  name: 'generateMockDataPrompt',
  input: {schema: GenerateMockDataInputSchema},
  output: {schema: GenerateMockDataOutputSchema},
  prompt: `You are an expert data generator. Given the database schema and a SQL query, you will generate a realistic set of mock data that would be the result of running that query. Return the data as a JSON array of objects.

Database Schema:
{{schemaDefinition}}

SQL Query:
{{sqlQuery}}

Return between 3 and 7 rows of mock data.

JSON Mock Data:`,
});


const generateMockDataFlow = ai.defineFlow(
  {
    name: 'generateMockDataFlow',
    inputSchema: GenerateMockDataInputSchema,
    outputSchema: GenerateMockDataOutputSchema,
  },
  async input => {
    const {output} = await generateMockDataPrompt(input);
    return output!;
  }
);
