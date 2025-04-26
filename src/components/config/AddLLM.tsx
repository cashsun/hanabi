import { ConfirmInput, TextInput } from '@inkjs/ui';
import { Box, Text } from 'ink';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uniqueId } from 'uuid';
import { setAppReady } from '../../store/appState.js';
import { DefaultModelPicker } from './DefaultModelPicker.js';
import { ProviderPicker } from './ProviderPicker.js';
import {
	DEFAULT_API_VERSION,
	getConfig,
	loadConfigToEnv,
	writeConfig,
} from './util.js';

export const AddLLM: FC = () => {
	const [step, setStep] = useState(1);
	const id = useMemo(() => uniqueId(), []);
	const [provider, setProvider] = useState<LLM['provider']>();
	const [apiKey, setApiKey] = useState<LLM['apiKey']>();
	const [apiUrl, setApiUrl] = useState<LLM['apiUrl']>();
	const [apiVersion, setApiVersion] =
		useState<LLM['apiVersion']>(DEFAULT_API_VERSION);
	const llm = useRef<LLM>();
	llm.current = {
		id,
		provider,
		apiKey,
		apiUrl,
		apiVersion,
	} as LLM;

	useEffect(() => {
		if (step === -1) {
			// Get the current config from file
			const config = getConfig();
			const llms = config.llms;

			let found: LLM | undefined;
			// Update existing LLM if provider matches
			const newLlms = llms.map(l => {
				if (l.provider === provider) {
					found = l;
					const {id, ...override} = llm.current ?? {};
					return {
						...l,
						...override,
					};
				}
				return l;
			});
			// Add new LLM if no existing one was found
			if (!found) {
				found = llm.current;
				newLlms.push(found!);
			}
			// Save the updated config to file
			writeConfig({llms: newLlms as LLM[]});
			loadConfigToEnv();
			// Signal that the app is ready
			setAppReady(true);
		}
	}, [step]);

	return (
		<Box flexDirection="column">
			{step !== 6 && step !== -1 && (
				<ProviderPicker
					onSelect={p => {
						setProvider(p);
						setStep(2);
					}}
				/>
			)}

			{step === 2 && (
				<>
					<Text color="green">⟡ Paste your API key for {provider}:</Text>
					<TextInput
						placeholder={'Provider API Key'}
						onSubmit={v => {
							setApiKey(v);
							if (provider == 'OpenAI-Compatible' || provider === 'Azure') {
								setStep(3);
							} else {
								// finish
								setStep(5);
							}
						}}
					/>
				</>
			)}
			{step === 3 && (
				<>
					<Text color="green">⟡ {provider} API base URL:</Text>
					<TextInput
						placeholder=" e.g. http://localhost:1234/v1, https://<resource-name>.openai.azure.com/openai"
						onSubmit={v => {
							setApiUrl(v);
							// finish
							setStep(provider === 'Azure' ? 4 : 5);
						}}
					/>
				</>
			)}
			{step === 4 && (
				<>
					<Text color="green">⟡ Specify {provider} API Version:</Text>
					<TextInput
						placeholder={`${DEFAULT_API_VERSION} (default)`}
						onSubmit={v => {
							setApiVersion(v || DEFAULT_API_VERSION);
							// finish
							setStep(5);
						}}
					/>
				</>
			)}
			{step === 5 && (
				<Text color="green">
					⟡ Use this model as default?{' '}
					<ConfirmInput
						onConfirm={() => {
							setStep(6);
						}}
						onCancel={() => {
							setStep(-1);
						}}
					/>
				</Text>
			)}
			{step === 6 && provider && (
				<DefaultModelPicker
					llm={llm.current}
					onSelect={() => {
						setStep(-1);
					}}
				/>
			)}
			{step === -1 && (
				<Box>
					<Text><Text color="green">✓</Text> Config file updated.</Text>
				</Box>
			)}
		</Box>
	);
};
