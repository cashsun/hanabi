import {useQuery} from '@tanstack/react-query';

export const useChatConfig = () => {
	return useQuery({
		queryKey: ['chat-config'],
		async queryFn() {
			const config: {defaultModel: HanabiConfig['defaultModel']} & HanabiConfig['serve'] =
				await fetch('/api/config').then(res => res.json());
			return config;
		},
	});
};
