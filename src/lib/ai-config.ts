export type Model = {
  name: string;
  value: string;
};

export type Provider = {
  id: 'lmstudio' | 'openrouter' | 'gateway';
  name: string;
  enabled: boolean;
  supportsWebSearch: boolean;
};

export type Config = {
  models: Model[];
  defaultModel: string;
  providers: Provider[];
  activeProvider: string;
  useOpenRouter: boolean;
};

export async function fetchConfig(provider?: string): Promise<Config> {
  const url = provider ? `/api/config?provider=${provider}` : "/api/config";
  const res = await fetch(url);
  return res.json();
}
