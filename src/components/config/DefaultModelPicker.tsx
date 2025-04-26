import {Text, Box} from 'ink';
import React, {FC, useEffect, useMemo, useState} from 'react';
import {ModelSelector} from './ModelSelector.js';
import {ProviderPicker} from './ProviderPicker.js';
import {getConfig, writeConfig} from './util.js';
import { setAppReady } from '../../store/appState.js';

interface Props {
	llm?: LLM;
	/** callback after default model has been saved to config */
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
								provider: llmToUse.provider,
							},
						});
					}
					onSelect?.(model);
				}}
			/>
		</Box>
	);
};
