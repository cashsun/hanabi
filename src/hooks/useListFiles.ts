import {useQuery} from '@tanstack/react-query';
import {globby} from 'globby';
import {getConfig} from '../components/config/util.js';

/** list all files under current workding dir */
export const useListFIles = () => {
	return useQuery({
		queryKey: ['list-all-files'],
		async queryFn() {
			const ignore = [...(getConfig().exclude ?? []), '**/.hanabi.json'];
			return globby(['**/*'], {gitignore: true, ignore});
		},
	});
};
