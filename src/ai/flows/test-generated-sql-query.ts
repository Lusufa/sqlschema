'use server';

/**
 * @fileOverview Tests a generated SQL query against a database.
 *
 * - testGeneratedSqlQuery - A function that handles testing the generated SQL query.
 * - TestGeneratedSqlQueryInput - The input type for the testGeneratedSqlQuery function.
 * - TestGeneratedSqlQueryOutput - The return type for the testGeneratedSqlQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TestGeneratedSqlQueryInputSchema = z.object({
  dbUri: z.string().describe('The URI of the database to test against.'),
  query: z.string().describe('The SQL query to test.'),
});
export type TestGeneratedSqlQueryInput = z.infer<
  typeof TestGeneratedSqlQueryInputSchema
>;

const TestGeneratedSqlQueryOutputSchema = z.object({
  result: z.string().describe('The result of the query execution.'),
});
export type TestGeneratedSqlQueryOutput = z.infer<
  typeof TestGeneratedSqlQueryOutputSchema
>;

export async function testGeneratedSqlQuery(
  input: TestGeneratedSqlQueryInput
): Promise<TestGeneratedSqlQueryOutput> {
  return testGeneratedSqlQueryFlow(input);
}

const testGeneratedSqlQueryTool = ai.defineTool({
  name: 'executeSqlQuery',
  description: 'Executes an SQL query against a database and returns the result.',
  inputSchema: TestGeneratedSqlQueryInputSchema,
  outputSchema: TestGeneratedSqlQueryOutputSchema,
}, async (input) => {
  // This is a placeholder implementation.  A real implementation would
  // connect to the database specified by input.dbUri, execute the query,
  // and return the result as a string.
  return {result: `Successfully connected to ${input.dbUri} and executed ${input.query}.  However, this is just a placeholder, so no actual query was executed.`};
});

const testGeneratedSqlQueryPrompt = ai.definePrompt({
  name: 'testGeneratedSqlQueryPrompt',
  tools: [testGeneratedSqlQueryTool],
  input: {schema: TestGeneratedSqlQueryInputSchema},
  output: {schema: TestGeneratedSqlQueryOutputSchema},
  prompt: `Use the executeSqlQuery tool to test the following SQL query against the database. Return the query result. Database URI: {{{dbUri}}}, Query: {{{query}}}`,
});

const testGeneratedSqlQueryFlow = ai.defineFlow(
  {
    name: 'testGeneratedSqlQueryFlow',
    inputSchema: TestGeneratedSqlQueryInputSchema,
    outputSchema: TestGeneratedSqlQueryOutputSchema,
  },
  async input => {
    const {output} = await testGeneratedSqlQueryPrompt(input);
    return output!;
  }
);
