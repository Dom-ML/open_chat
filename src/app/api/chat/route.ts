import { streamText, UIMessage, convertToModelMessages, LanguageModel } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { getSystemPrompt, type UseCase } from '@/lib/prompts';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const lmstudioBaseUrl = process.env.LMSTUDIO_BASE_URL;
const lmstudio = lmstudioBaseUrl 
  ? createOpenAICompatible({ 
      name: 'lmstudio', 
      baseURL: lmstudioBaseUrl 
    }) 
  : null;

const openrouter = process.env.OPENROUTER_API_KEY
  ? createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })
  : null;

export async function POST(req: Request) {
  const {
    messages,
    model,
    webSearch,
    provider,
    useCase = 'default',
  }: { 
    messages: UIMessage[]; 
    model: string; 
    webSearch: boolean;
    provider?: string;
    useCase?: UseCase;
  } = await req.json();

  let activeModel = model;
  let modelConfig: LanguageModel | string;

  const selectedProvider = provider || 
    (lmstudio ? 'lmstudio' : openrouter ? 'openrouter' : 'gateway');

  if (selectedProvider === 'lmstudio' && lmstudio) {
    activeModel = model;
    modelConfig = lmstudio.chatModel(activeModel);
  } else if (selectedProvider === 'openrouter' && openrouter) {
    activeModel = webSearch ? `${model}:online` : model;
    modelConfig = openrouter.chat(activeModel);
  } else {
    activeModel = webSearch ? 'perplexity/sonar' : model;
    modelConfig = activeModel;
  }

  const systemPrompt = await getSystemPrompt(useCase);

  // Stream text response for all modes
  const result = streamText({
    model: modelConfig,
    messages: convertToModelMessages(messages),
    system: systemPrompt,
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}