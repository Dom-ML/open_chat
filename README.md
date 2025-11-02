# Open Chat

Open-source AI-chat-bot (like ChatGPT) that runs any local or hosted LLM with web search and custom modes to tailor responses

## Features

<img align="right" src="media/logo.gif" width="200" alt="Animated logo" />

- **Hybrid AI control in one UI:** Switch between local and hosted models without leaving the chat flow.
- **OpenRouter = model superhub:** Tap into OpenAI, Anthropic, Google, Qwen, MiniMax, and dozens more through a single key and use their free tiers to prototype fast.
- **Offline-first with LM Studio:** Run everything locally by loading compatible models in LM Studio and keeping keys private.
- **Persona-driven customization:** Drop new prompt files to craft modes tailored to any workflow or teaching style.

![App demo](media/AppDemo0.gif)


## Setup
1. Clone: `git clone https://github.com/<org>/open_chat && cd open_chat`.
2. Install dependencies: `npm install`.
3. Create a `.env` with `AI_GATEWAY_API_KEY`, `OPENROUTER_API_KEY`, and `LMSTUDIO_BASE_URL=http://localhost:1234/v1`.
4. Start LM Studio with the models you want available (match the names listed under each provider).
5. Run the dev server: `npm run dev`.

### LM Studio Default Model
- Default local model: `mlx-community/LFM2-2.6B-4bit`. In LM Studio, search for this model, download it, then hit **Serve** so it runs on `http://localhost:1234/v1` (see [LM Studio docs](https://lmstudio.ai/docs/developer) for details).
- To swap models later, update the first entry in `modelsByProvider.lmstudio` inside `src/app/api/config/route.ts` so its `value` matches the Serve ID you expose from LM Studio.

## How It Works
- Providers live in `src/app/api/config/route.ts`; add models by extending the `modelsByProvider` list for the provider you use.
- Streaming chat logic is in `src/app/api/chat/route.ts`, which reads your provider choice and system prompt.
- Prompt modes come from markdown files in `src/prompts`; copy one, edit the front matter, choose any Lucide icon name, and reload to see it.
- UI helpers for fetching provider data sit in `src/lib/ai-config.ts`, and prompt loading is cached in `src/lib/prompts-server.ts`.

## Tech Stack
- Next.js app ready for Vercel hosting or local dev.
- UI layer built with shadcn’s `@ai-elements` components.
- AI SDK suite: `ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`, `@openrouter/ai-sdk-provider`, plus `zod` for validation.

## How to add custom modes
- Copy one of the markdown files in `src/prompts`, change the `id` and `name`, and write the persona instructions under the front matter.
- Keep the instructions clear and scannable: define the tone, outline the response structure (bullets, summaries, steps), and give 1-2 concrete dos/don’ts so the model stays on brief.
- Pick an icon by matching any entry from the Lucide icon list (https://lucide.dev/icons) or by browsing `node_modules/lucide-react`, then drop the plain name into the `icon` field.
- Restart the dev server or reload the page so the cache in `prompts-server` picks up the new file.

## Limitations/Future Improvements
- [ ] Persistent storage
- [ ] MCP support
