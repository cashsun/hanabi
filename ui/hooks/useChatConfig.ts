import {useQuery} from '@tanstack/react-query';

export const useChatConfig = () => {
	return useQuery({
		queryKey: ['chat-config'],
		async queryFn() {
			const config: Pick<HanabiConfig, 'defaultModel' | 'answerSchema'> &
				HanabiConfig['serve'] = await fetch('/api/config').then(res =>
				res.json(),
			);
			return config;
		},
	});
};
