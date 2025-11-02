'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Action, Actions } from '@/components/ai-elements/actions';
import { Fragment, useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';
import { CopyIcon, GlobeIcon, RefreshCcwIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { type Model, type Provider, fetchConfig } from '@/lib/ai-config';
import { getAllPromptConfigs, type PromptConfig } from '@/lib/prompts';
import { cn } from '@/lib/utils';

type Mode = 'default' | 'ai-engineer' | 'simple';

function getIconComponent(iconName: string) {
  const Icon = (LucideIcons as Record<string, unknown>)[`${iconName}Icon`];
  return Icon || LucideIcons.MessageSquareIcon;
}

const AIChat = () => {
  const [input, setInput] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [model, setModel] = useState<string>('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [provider, setProvider] = useState<string>('');
  const [webSearch, setWebSearch] = useState(false);
  const [mode, setMode] = useState<Mode>('default');
  const [modes, setModes] = useState<PromptConfig[]>([]);
  const { messages, sendMessage, status, regenerate } = useChat();

  useEffect(() => {
    fetchConfig().then((config) => {
      setModels(config.models);
      setModel(config.defaultModel || config.models[0]?.value || '');
      setProviders(config.providers);
      setProvider(config.activeProvider || config.providers[0]?.id || '');
    });

    getAllPromptConfigs().then((promptConfigs) => {
      setModes(promptConfigs);
    });
  }, []);

  const handleProviderChange = async (newProvider: string) => {
    setProvider(newProvider);
    const enabledProvider = providers.find(p => p.id === newProvider && p.enabled);
    if (enabledProvider) {
      const config = await fetchConfig(newProvider);
      setModels(config.models);
      setModel(config.models[0].value);
      if (!enabledProvider.supportsWebSearch && webSearch) {
        setWebSearch(false);
      }
    }
  };

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    let currentModel = model;
    const currentProviderModels = models;
    
    const modelExists = currentProviderModels.some(m => m.value === currentModel);
    
    if (!modelExists && currentProviderModels.length > 0) {
      currentModel = currentProviderModels[0].value;
      setModel(currentModel);
    }

    sendMessage(
      { 
        text: message.text || 'Sent with attachments',
        files: message.files 
      },
      {
        body: {
          model: currentModel,
          webSearch: webSearch,
          provider: provider,
          useCase: mode,
        },
      },
    );
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => {
              return (
                <div key={message.id}>
                  {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                    <Sources>
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            (part) => part.type === 'source-url',
                          ).length
                        }
                      />
                      {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                        <SourcesContent key={`${message.id}-${i}`}>
                          <Source
                            key={`${message.id}-${i}`}
                            href={part.url}
                            title={part.url}
                          />
                        </SourcesContent>
                      ))}
                    </Sources>
                  )}

                  {message.parts.map((part, i) => {

                    switch (part.type) {
                      case 'text':
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Message from={message.role}>
                              <MessageContent>
                                <Response>
                                  {part.text}
                                </Response>
                              </MessageContent>
                            </Message>
                            {message.role === 'assistant' && i === message.parts.length - 1 && (
                              <Actions className="mt-2">
                                <Action
                                  onClick={() => regenerate()}
                                  label="Retry"
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </Action>
                                <Action
                                  onClick={() =>
                                    navigator.clipboard.writeText(part.text)
                                  }
                                  label="Copy"
                                >
                                  <CopyIcon className="size-3" />
                                </Action>
                              </Actions>
                            )}
                          </Fragment>
                        );
                      case 'reasoning':
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full"
                            isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              );
            })}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => setWebSearch(!webSearch)}
                disabled={!providers.find(p => p.id === provider)?.supportsWebSearch}
                title="Web Search - Find current information online"
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputModelSelect
                onValueChange={handleProviderChange}
                value={provider || providers[0]?.id || ''}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue 
                    placeholder={providers.find((p) => p.id === (provider || providers[0]?.id))?.name || providers[0]?.name || 'Provider'}
                  />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {providers.map((p) => (
                    <PromptInputModelSelectItem 
                      key={p.id} 
                      value={p.id}
                      disabled={!p.enabled}
                      className={!p.enabled ? 'cursor-not-allowed opacity-50' : ''}
                    >
                      {p.name}
                      {!p.enabled && ' (disabled)'}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
              <PromptInputModelSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model || models[0]?.value || ''}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue 
                    placeholder={models.find((m) => m.value === (model || models[0]?.value))?.name || models[0]?.name || 'Select model'} 
                  />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((model) => (
                    <PromptInputModelSelectItem key={model.value} value={model.value}>
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
              {modes.map((promptConfig) => {
                const Icon = getIconComponent(promptConfig.metadata.icon);
                const isActive = mode === promptConfig.metadata.id;
                
                return (
                  <Tooltip key={promptConfig.metadata.id} delayDuration={200}>
                    <TooltipTrigger asChild>
                      <PromptInputButton
                        variant={isActive ? 'default' : 'ghost'}
                        size="icon-sm"
                        onClick={() => setMode(promptConfig.metadata.id as Mode)}
                        className={cn(
                          "relative transition-all duration-200",
                          isActive && "shadow-md"
                        )}
                        title=""
                        aria-label={`${promptConfig.metadata.name} mode`}
                      >
                        <Icon className="size-4" />
                        {isActive && (
                          <span 
                            className={cn(
                              "absolute inset-0 rounded-md ring-2 animate-pulse pointer-events-none",
                              promptConfig.metadata.color || "ring-primary"
                            )}
                            aria-hidden="true"
                          />
                        )}
                      </PromptInputButton>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px] text-center">
                      <p className="font-semibold">{promptConfig.metadata.name}</p>
                      <p className="text-xs text-background/80 mt-1">{promptConfig.metadata.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};

export default AIChat;
