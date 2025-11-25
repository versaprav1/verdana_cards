import {genkit, type GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

let googleApiKey: string | undefined = process.env.GEMINI_API_KEY;
let provider: string = 'googleai';
let model: string = 'googleai/gemini-2.5-flash';

if (typeof window !== 'undefined') {
  provider = localStorage.getItem('aiProvider') || provider;
  googleApiKey = localStorage.getItem('googleApiKey') ?? googleApiKey;
}

const plugins: GenkitPlugin[] = [];
if (provider === 'googleai') {
  plugins.push(googleAI({apiKey: googleApiKey}));
}


export const ai = genkit({
  plugins,
  model,
});
