import {useQuery} from '@tanstack/react-query';

export function useChatConfig() {
	return useQuery({
		queryKey: ['use-chat-config'],
		async queryFn() {
			const result = await fetch('/api/config').then(res => res.json());
			return {
				defaultModel: result.defaultModel as HanabiConfig['defaultModel'],
				mcpKeys: result.mcpKeys as string[]
			};
		},
	});
}
