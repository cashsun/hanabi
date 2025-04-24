import React, {FC, useMemo} from 'react';
import {useModelList} from '../hooks/list-models.js';
import {Text} from 'ink';
import {Spinner, Select, SelectProps} from '@inkjs/ui';

interface Props {
	provider: LLM['provider'];
	apiKey: string;
	apiUrl?: string;
	onSelect: (model: string) => void;
}

export const ModelSelector: FC<Props> = ({
	provider,
	apiKey,
	apiUrl,
	onSelect,
}) => {
	const {data, isFetching, error} = useModelList(provider, apiKey, apiUrl);

	const models = useMemo(() => {
		return (
			data?.map(m => ({
				label: m,
				value: m,
			})) ?? []
		);
	}, [data]);
    
	if (isFetching) {
		return <Spinner label="Fetching models..." />;
	}

	if (error) {
		return <Text color="red">Error fetching models: {error.message}</Text>;
	}

	return <Select options={models} onChange={onSelect} />;
};
