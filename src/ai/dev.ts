
import { config } from 'dotenv';
config(); // Load .env file

import '@/ai/flows/select-analysis-tools.ts';
import '@/ai/flows/generate-vulnerability-report.ts';
// The analyze-technology-usage.ts flow has been removed as the feature changed.
