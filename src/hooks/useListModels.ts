import {anthropic} from '@ai-sdk/anthropic';
import {createAzure} from '@ai-sdk/azure';
import {deepseek} from '@ai-sdk/deepseek';
import {google} from '@ai-sdk/google';
import {openai} from '@ai-sdk/openai';
import {createOpenAICompatible} from '@ai-sdk/openai-compatible';
import {ollama} from 'ollama-ai-provider';

import {useQuery} from '@tanstack/react-query';
import {getConfig, getDefaultApiVersion} from '../components/config/util.js';
import {
	ANTHROPIC_API_URL,
	DEEPSEEK_API_URL,
	GOOGLE_AI_API_URL,
	OLLAMA_API_URL,
	OPENAI_API_URL,
} from './endpoints.js';
import {useMemo} from 'react';

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

			let apiUrlToUse = `${apiUrl}/models`;
			const headers: Record<string, string> = {
				Authorization: `Bearer ${apiKey}`,
			};

			if (provider === 'OpenAI') {
				apiUrlToUse = `${OPENAI_API_URL}/models`;
			} else if (provider === 'Google') {
				apiUrlToUse = `${GOOGLE_AI_API_URL}/models`;
			} else if (provider === 'Azure') {
				apiUrlToUse = `${apiUrl}/models?api-version=${apiVersion}`;
			} else if (provider === 'Deepseek') {
				apiUrlToUse = `${DEEPSEEK_API_URL}/models`;
			} else if (provider === 'Ollama') {
				apiUrlToUse = `${OLLAMA_API_URL}/tags`;
			} else if (provider === 'Anthropic') {
				apiUrlToUse = `${ANTHROPIC_API_URL}/models`;
				headers['x-api-key'] = apiKey ?? '';
				headers['anthropic-version'] =
					apiVersion || getDefaultApiVersion(provider);
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
