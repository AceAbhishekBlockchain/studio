
import { config } from 'dotenv';
config(); // Load .env file

import '@/ai/flows/select-analysis-tools.ts';
import '@/ai/flows/generate-vulnerability-report.ts';
import '@/ai/flows/analyze-technology-usage.ts'; // Added new flow
