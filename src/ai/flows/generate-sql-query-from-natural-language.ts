'use server';
/**
 * @fileOverview Generates SQL queries from natural language questions based on a provided database schema.
 *
 * - generateSqlQuery - A function that generates an SQL query from a natural language question and database schema.
 * - GenerateSqlQueryInput - The input type for the generateSqlQuery function.
 * - GenerateSqlQueryOutput - The return type for the generateSqlQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSqlQueryInputSchema = z.object({
  schemaDefinition: z
    .string()
    .describe('The database schema definition.'),
  naturalLanguageQuestion: z
    .string()
    .describe('The natural language question to convert to SQL.'),
});
export type GenerateSqlQueryInput = z.infer<typeof GenerateSqlQueryInputSchema>;

const GenerateSqlQueryOutputSchema = z.object({
  sqlQuery: z
    .string()
    .describe('The generated SQL query that answers the natural language question.'),
});
export type GenerateSqlQueryOutput = z.infer<typeof GenerateSqlQueryOutputSchema>;

export async function generateSqlQuery(
  input: GenerateSqlQueryInput
): Promise<GenerateSqlQueryOutput> {
  return generateSqlQueryFlow(input);
}

const generateSqlQueryPrompt = ai.definePrompt({
  name: 'generateSqlQueryPrompt',
  input: {schema: GenerateSqlQueryInputSchema},
  output: {schema: GenerateSqlQueryOutputSchema},
  prompt: `You are an expert SQL query generator. Given the database schema and a natural language question, you will generate the corresponding SQL query to answer the question.

Database Schema:
{{schemaDefinition}}

Natural Language Question:
{{naturalLanguageQuestion}}

SQL Query:`,
});

const generateSqlQueryFlow = ai.defineFlow(
  {
    name: 'generateSqlQueryFlow',
    inputSchema: GenerateSqlQueryInputSchema,
    outputSchema: GenerateSqlQueryOutputSchema,
  },
  async input => {
    const {output} = await generateSqlQueryPrompt(input);
    return output!;
  }
);
