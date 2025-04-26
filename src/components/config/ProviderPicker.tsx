import {Select} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React, {FC, useMemo, useState} from 'react';
import {getConfig} from './util.js';
import {AddLLM} from './AddLLM.js';

export const providers: {label: string; value: LLM['provider']}[] = [
	{
		label: 'OpenAI',
		value: 'OpenAI',
	},
	{
		label: 'Google (Gemini)',
		value: 'Google',
	},
	{
		label: 'Azure (OpenAI)',
		value: 'Azure',
	},
	{
		label: 'Deepseek',
		value: 'Deepseek',
	},
	{
		label: 'Ollama',
		value: 'Ollama',
	},
	{
		label: 'OpenAI-Compatible',
		value: 'OpenAI-Compatible',
	},
];

export const ProviderPicker: FC<{
	onSelect: (p: LLM['provider']) => void;
	useExisting?: boolean;
}> = ({onSelect, useExisting}) => {
	const [isNew, setIsNew] = useState(false);
	const providersToUse = useMemo(() => {
		if (useExisting) {
			const config = getConfig();
			return [
				{label: 'Add new provider', value: 'new'},
				...config.llms.map(
					llm => providers.find(option => option.value === llm.provider)!,
				),
			];
		}
		return providers;
	}, []);

	if (isNew) {
		return <AddLLM />;
	}

	return (
		<Box flexDirection="column">
			<Text color="green">⟡ Select a provider below:</Text>
			<Select
				options={providersToUse}
				onChange={p => {
					if (p === 'new') {
						setIsNew(true);
					} else {
						onSelect(p as LLM['provider']);
					}
				}}
			/>
		</Box>
	);
};
