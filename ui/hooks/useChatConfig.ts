import {useQuery} from '@tanstack/react-query';
import { defaultConfig } from 'next/dist/server/config-shared';

export function useChatConfig() {
	return useQuery({
		queryKey: ['use-chat-config'],
		async queryFn() {
			const result: Partial<HanabiConfig> = await fetch('/api/config').then(res => res.json());
			return {
				defaultModel: result.defaultModel,
				...result.serve
			};
		},
	});
}
