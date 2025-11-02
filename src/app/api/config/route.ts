export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedProvider = searchParams.get('provider');

  const isLMStudio = Boolean(process.env.LMSTUDIO_BASE_URL);
  const isOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);
  const isGateway = Boolean(process.env.AI_GATEWAY_API_KEY);

  const providers = [
    { id: 'lmstudio', name: 'LM Studio', enabled: isLMStudio, supportsWebSearch: false },
    { id: 'openrouter', name: 'OpenRouter', enabled: isOpenRouter, supportsWebSearch: true },
    { id: 'gateway', name: 'AI Gateway', enabled: isGateway, supportsWebSearch: true },
  ];

  const defaultActiveProvider = isLMStudio ? 'lmstudio' 
    : isOpenRouter ? 'openrouter' 
    : 'gateway';

  let selectedProvider = defaultActiveProvider;
  if (requestedProvider) {
    const providerExists = providers.find(
      p => p.id === requestedProvider && p.enabled
    );
    if (providerExists) {
      selectedProvider = requestedProvider;
    }
  }

  const modelsByProvider: Record<string, { name: string; value: string }[]> = {
    lmstudio: [
      { name: "Lfm 2 2.6b", value: "lfm2-2.6b" },
      // { name: "Qwen3 4B", value: "qwen/qwen3-4b-2507" },
      // { name: "Ling Mini 2", value: "ling-mini-2.0" },
    ],
    openrouter: [
      { name: "MiniMax M2 (free)", value: "minimax/minimax-m2:free" },
      { name: "Qwen3 235B", value: "qwen/qwen3-235b-a22b-2507" },
      { name: "Sonnet 4.5", value: "anthropic/claude-sonnet-4.5" },
      { name: "GPT-5", value: "openai/gpt-5" },
    ],
    gateway: [
      { name: "GPT 4o", value: "openai/gpt-4o" },
      { name: "Deepseek R1", value: "deepseek/deepseek-r1" },
    ],
  };

  const models = modelsByProvider[selectedProvider];

  return Response.json({
    models,
    defaultModel: models[0].value,
    providers,
    activeProvider: selectedProvider,
    useOpenRouter: isOpenRouter,
  });
}
