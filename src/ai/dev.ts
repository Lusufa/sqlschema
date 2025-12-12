import { config } from 'dotenv';
config();

import '@/ai/flows/generate-sql-query-from-natural-language.ts';
import '@/ai/flows/test-generated-sql-query.ts';