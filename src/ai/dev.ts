import { config } from 'dotenv';
config();

import '@/ai/flows/generate-sql-query-from-natural-language.ts';
import '@/ai/flows/generate-mock-data-from-sql-query.ts';
