import {anthropic} from '@ai-sdk/anthropic';
import {createAzure} from '@ai-sdk/azure';
import {deepseek} from '@ai-sdk/deepseek';
import {google} from '@ai-sdk/google';
import {groq} from '@ai-sdk/groq';
import {openai} from '@ai-sdk/openai';
import {createOpenAICompatible} from '@ai-sdk/openai-compatible';
import {xai} from '@ai-sdk/xai';
import {ollama} from 'ollama-ai-provider';

import {useQuery} from '@tanstack/react-query';
import {useMemo} from 'react';
import {getConfig, getDefaultApiVersion} from '../components/config/util.js';
import {officialApiUrls} from './endpoints.js';

export const useModelList = (
	provider: LLM['provider'] | undefined,
	apiKey: string | undefined,
	apiUrl: string | undefined,
	apiVersion: string | undefined,
) => {
	return useQuery<string[]>({
		queryKey: ['modelList', provider, apiKey, apiUrl, apiVersion],
		async queryFn() {
			if (!provider) {
				return [];
			}
			const headers: Record<string, string> = {
				Authorization: `Bearer ${apiKey}`,
			};

			let apiUrlToUse = `${officialApiUrls[provider]}/models`;

			switch (provider) {
				case 'Anthropic': {
					headers['x-api-key'] = apiKey ?? '';
					headers['anthropic-version'] =
						apiVersion ?? getDefaultApiVersion(provider);
					break;
				}
				case 'Azure': {
					apiUrlToUse = `${apiUrl}/models?api-version=${
						apiVersion ?? getDefaultApiVersion(provider)
					}`;
					break;
				}
				case 'Ollama': {
					apiUrlToUse = `${officialApiUrls[provider]}/tags`;
					break;
				}
				case 'OpenAI-Compatible':
					apiUrlToUse = `${apiUrl}/models`;
					break;
				default:
					break;
			}

			const response = await fetch(`${apiUrlToUse}`, {
				method: 'GET',
				headers,
			}).then(async res => res.json());

			return response.data.map((model: any) =>
				model.id.replace(/^models\//, ''),
			);
		},
	});
};

export const useModel = (defaultModel: HanabiConfig['defaultModel']) => {
	return useMemo(() => {
		const config = getConfig();
		const llm = config.llms.find(l => l.provider === defaultModel?.provider);
		if (!llm || !defaultModel) {
			return undefined;
		}

		const modelName = defaultModel.model; // Extract model name for clarity

		switch (llm.provider) {
			case 'Google': {
				return google(modelName);
			}
			case 'Azure': {
				const azure = createAzure({
					apiVersion: llm.apiVersion ?? getDefaultApiVersion(llm.provider),
				});
				return azure(modelName);
			}
			case 'Deepseek':
				return deepseek(modelName);
			case 'Anthropic':
				return anthropic(modelName);
			case 'OpenAI':
				return openai(modelName);
			case 'Groq':
				return groq(modelName);
			case 'xAI':
				return xai(modelName);
			case 'Ollama':
				return ollama(modelName);
			default: {
				// OpenAI Compatible
				const compatible = createOpenAICompatible({
					name: llm.provider,
					apiKey: llm.apiKey,
					baseURL: llm.apiUrl ?? '',
				});
				return compatible(modelName);
			}
		}
	}, [defaultModel]);
};
