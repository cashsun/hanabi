import {useQuery} from '@tanstack/react-query';
import {
	ANTHROPIC_API_URL,
	DEEPSEEK_API_URL,
	GOOGLE_AI_API_URL,
	OLLAMA_API_URL,
	OPENAI_API_URL,
} from './endpoints.js';
import {getDefaultApiVersion} from '../components/config/util.js';
export const useModelList = (
	provider: LLM['provider'] | undefined,
	apiKey: string | undefined,
	apiUrl: string | undefined,
	apiVersion: string | undefined,
) => {
	return useQuery<string[], Error>({
		queryKey: ['modelList', provider, apiKey, apiUrl, apiVersion],
		enabled: !!provider,
		queryFn: async () => {
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
			}).then(res => res.json());

			return response.data.map((model: any) =>
				model.id.replace(/^models\//, ''),
			);
		},
	});
};
