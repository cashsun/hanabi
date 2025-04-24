import {ConfirmInput, Select, TextInput} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React, {FC, useEffect, useRef, useState} from 'react';
import {v4 as uniqueId} from 'uuid';
import {setAppReady} from '../../store/appState.js';
import {ModelSelector} from '../ModelSelector.js';
import {getConfig, loadConfigToEnv, writeConfig} from './util.js';

const providers: {label: LLM['provider']; value: LLM['provider']}[] = [
	{
		label: 'OpenAI',
		value: 'OpenAI',
	},
	{
		label: 'Google',
		value: 'Google',
	},
	{
		label: 'Azure',
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

export const AddLLM: FC = () => {
	const [step, setStep] = useState(1);
	const [provider, setProvider] = useState<LLM['provider'] | undefined>();
	const [apiKey, setApiKey] = useState<LLM['apiKey'] | undefined>();
	const [apiUrl, setApiUrl] = useState<LLM['apiUrl'] | undefined>();
	const [model, setModel] = useState<string>();
	const asDefault = useRef(false);

	useEffect(() => {
		if (step === -1) {
			// Get the current config from file
			const config = getConfig();
			const llms = config.llms;
			// Create a new LLM configuration object
			const llm: LLM = {
				id: uniqueId(),
				provider,
				apiKey,
				apiUrl,
			};
			let found: LLM;
			// Update existing LLM if provider matches (except for OpenAI-Compatible)
			const newLlms = llms.map(l => {
				if (l.provider === provider && provider !== 'OpenAI-Compatible') {
					found = l;
					return {
						...l,
						apiKey,
						apiUrl,
					};
				}
				return l;
			});
			// Add new LLM if no existing one was found
			if (!found) {
				found = llm;
				newLlms.push(llm);
			}
			const defaultModel: HanabiConfig['defaultModel'] = asDefault.current
				? {
						id: found.id,
						model: model || '',
				  }
				: config.defaultModel;
			// Save the updated config to file
			writeConfig({llms: newLlms, defaultModel});
			loadConfigToEnv();
			// Signal that the app is ready
			setAppReady();
		}
	}, [step]);

	return (
		<Box flexDirection="column">
			{step !== 5 && (
				<>
					<Text color="green">⟡ Select a provider below:</Text>
					<Select
						options={providers}
						onChange={(val: LLM['provider']) => {
							setProvider(val);
							setStep(2);
						}}
					/>
				</>
			)}

			{step === 2 && (
				<>
					<Text color="green">⟡ Paste your API key for {provider}:</Text>
					<TextInput
						placeholder="Provider API Key"
						onSubmit={v => {
							setApiKey(v);
							if (provider == 'OpenAI-Compatible') {
								setStep(3);
							} else {
								// finish
								setStep(4);
							}
						}}
					/>
				</>
			)}
			{step === 3 && (
				<>
					<Text color="green">⟡ Your custom API url:</Text>
					<TextInput
						placeholder="API base URL, e.g. http://localhost:1234/v1"
						onSubmit={v => {
							setApiUrl(v);
							// finish
							setStep(4);
						}}
					/>
				</>
			)}
			{step === 4 && (
				<Text color="green">
					⟡ Use this model as default?{' '}
					<ConfirmInput
						onConfirm={() => {
							asDefault.current = true;
							setStep(5);
						}}
						onCancel={() => {
							asDefault.current = false;
							setStep(-1);
						}}
					/>
				</Text>
			)}
			{step === 5 && (
				<>
					<Text color="green">⟡ Select a model below:</Text>
					<ModelSelector
						provider={provider}
						apiKey={apiKey}
						apiUrl={apiUrl}
						onSelect={m => {
							setModel(m);
							setStep(-1);
						}}
					/>
				</>
			)}
		</Box>
	);
};
