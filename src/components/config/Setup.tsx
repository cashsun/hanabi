import {Badge, Spinner} from '@inkjs/ui';
import fs from 'fs';
import {Box, Text} from 'ink';
import React, {FC, useEffect, useState} from 'react';
import {configPath, defaultConfig, getConfig, writeConfig} from './util.js';
import {setAppReady} from '../../store/appState.js';
import {AddLLM} from './AddLLM.js';

export const Setup: FC = () => {
	const [step, setStep] = useState(1);

	useEffect(() => {
		switch (step) {
			case 1: {
				writeConfig(defaultConfig);
				// give some time to show the spinner
				setTimeout(() => {
					setStep(2);
				}, 1000);
				break;
			}
		}
	}, [step]);

	return (
		<Box flexDirection="column">
			<Text color="green">⟡ Hanabi will now start the initial setup.</Text>
			{step === 1 && <Spinner label="Creating .hanabi.json" />}
			{step > 1 && (
				<Box>
					<Text>✓ Config file created.</Text>
				</Box>
			)}
			{step === 2 && (
				<Box flexDirection="column">
					<Text color="green">⟡ Now, let's add your first LLM.</Text>
					<AddLLM />
				</Box>
			)}
		</Box>
	);
};
