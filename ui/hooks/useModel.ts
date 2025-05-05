import {useQuery} from '@tanstack/react-query';

export function useModel() {
	return useQuery({
		queryKey: ['use-model'],
		async queryFn() {
			const result = await fetch('/api/model').then(res=>res.json());
			return result.defaultModel as HanabiConfig['defaultModel'];
		},
	});
}
