'use server';

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type UseCase = "default" | "ai-engineer" | "simple";

export interface PromptMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
  color?: string;
  enabled: boolean;
  order?: number;
}

export interface PromptConfig {
  metadata: PromptMetadata;
  content: string;
}

const PROMPTS_DIR = path.join(process.cwd(), 'src/prompts');

let promptsCache: Map<string, PromptConfig> | null = null;

function loadAllPrompts(): Map<string, PromptConfig> {
  if (promptsCache) return promptsCache;

  const cache = new Map<string, PromptConfig>();
  const files = fs.readdirSync(PROMPTS_DIR).filter((f) => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(PROMPTS_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    const metadata = data as PromptMetadata;
    if (metadata.enabled !== false) {
      cache.set(metadata.id, { metadata, content: content.trim() });
    }
  }

  promptsCache = cache;
  return cache;
}

export async function getSystemPrompt(useCase: UseCase): Promise<string> {
  const prompts = loadAllPrompts();
  const config = prompts.get(useCase);

  if (!config) {
    return "You are a helpful assistant.";
  }

  return config.content;
}

export async function getAllPromptConfigs(): Promise<PromptConfig[]> {
  const prompts = loadAllPrompts();
  return Array.from(prompts.values()).sort(
    (a, b) => (a.metadata.order || 999) - (b.metadata.order || 999)
  );
}

export async function getPromptConfig(id: string): Promise<PromptConfig | undefined> {
  const prompts = loadAllPrompts();
  return prompts.get(id);
}
