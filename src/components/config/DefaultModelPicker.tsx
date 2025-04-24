import {Text, Box} from 'ink';
import React, {FC, useMemo, useState} from 'react';
import {ModelSelector} from './ModelSelector.js';
import {ProviderPicker} from './ProviderPicker.js';
import {getConfig, writeConfig} from './util.js';

interface Props {
	llm?: LLM;
	onSelect?: (model: string) => void;
}

export const DefaultModelPicker: FC<Props> = ({llm, onSelect}) => {
	const config = useMemo(() => getConfig(), []);
	const [llmToUse, setLLMToUse] = useState(llm);

	if (!llmToUse) {
		return (
			<ProviderPicker
				useExisting
				onSelect={p => {
					setLLMToUse(config.llms.find(llm => llm.provider === p));
				}}
			/>
		);
	}

	return (
		<Box flexDirection="column">
			<Text color="green">⟡ Select a model below:</Text>
			<ModelSelector
				llm={llmToUse}
				onSelect={model => {
					if (llmToUse) {
						writeConfig({
							defaultModel: {
								id: llmToUse.id,
								model,
							},
						});
					}
					onSelect?.(model);
				}}
			/>
		</Box>
	);
};
