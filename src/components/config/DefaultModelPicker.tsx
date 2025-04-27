import {Box, Text} from 'ink';
import React, {type FC, useMemo, useState} from 'react';
import {ModelSelector} from './ModelSelector.js';
import {ProviderPicker} from './ProviderPicker.js';
import {getConfig, loadConfigToEnv, writeConfig} from './util.js';

interface Props {
	llm?: LLM;
	/** callback after default model has been saved to config */
	onSelect?: (defaultModel: HanabiConfig['defaultModel']) => void;
}

export const DefaultModelPicker: FC<Props> = ({llm, onSelect}) => {
	const config = useMemo(() => getConfig(), []);
	const [llmToUse, setLLMToUse] = useState(llm);

	if (!llmToUse) {
		return (
			<ProviderPicker
				useExisting
				onSelect={(p, d) => {
					setLLMToUse(config.llms.find(llm => llm.provider === p));
					if (d) {
						onSelect?.(d);
					}
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
						const defaultModel = {
							id: llmToUse.id,
							model,
							provider: llmToUse.provider,
						};
						writeConfig({
							defaultModel,
						});
						loadConfigToEnv();
						onSelect?.(defaultModel);
					}
				}}
			/>
		</Box>
	);
};
