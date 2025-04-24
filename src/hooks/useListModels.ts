import {useQuery} from '@tanstack/react-query';
import { AZURE_API_URL, DEEPSEEK_API_URL, GOOGLE_AI_API_URL, OLLAMA_API_URL, OPENAI_API_URL } from './endpoints.js';
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

            if (provider === 'OpenAI') {
                apiUrlToUse = `${OPENAI_API_URL}/models`;
            } else if (provider === 'Google') {
                apiUrlToUse = `${GOOGLE_AI_API_URL}/models`;
            } else if (provider === 'Azure') {
                // TODO: this is wrong, need to get the resource name from the config
                apiUrlToUse = `${apiUrl}/models?api-version=${apiVersion}`;
            } else if (provider === 'Deepseek') {
                apiUrlToUse = `${DEEPSEEK_API_URL}/models`;
            } else if (provider === 'Ollama') {
                apiUrlToUse = `${OLLAMA_API_URL}/tags`;
            }

			const response = await fetch(`${apiUrlToUse}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			}).then(res => res.json());
            
			return response.data.map((model:any) => model.id.replace(/^models\//, ''));
		},
	});
};
