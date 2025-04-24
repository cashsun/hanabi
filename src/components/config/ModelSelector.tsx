import { Select, Spinner, TextInput } from '@inkjs/ui';
import { Box, Text } from 'ink';
import React, { FC, useMemo, useState } from 'react';
import { useModelList } from '../../hooks/useListModels.js';

interface Props {
	llm: LLM | undefined;

	onSelect: (model: string) => void;
}

export const ModelSelector: FC<Props> = ({llm, onSelect}) => {
	const {provider, apiKey, apiUrl, apiVersion} = llm ?? {};
	const {data, isFetching, error} = useModelList(
		provider,
		apiKey,
		apiUrl,
		apiVersion,
	);
	const [searchTerm, setSearchTerm] = useState('');
	const models = useMemo(() => {
		return (
			data?.map(m => ({
				label: m,
				value: m,
			})) ?? []
		);
	}, [data]);

	const modelsToUse = useMemo(() => {
		if (!searchTerm) {
			return models;
		}
		const regex = new RegExp(searchTerm, 'ig');
		return models.filter(m => regex.test(m.label));
	}, [searchTerm, models]);

	if (isFetching) {
		return <Spinner label="Fetching models..." />;
	}

	if (error) {
		return <Text color="red">Error fetching models: {error.message}</Text>;
	}

	return (
		<Box flexDirection="column">
			<TextInput placeholder="Search..." onChange={setSearchTerm} />
			<Select
				visibleOptionCount={10}
				options={modelsToUse}
				onChange={onSelect}
			/>
		</Box>
	);
};
