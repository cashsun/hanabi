import {Spinner} from '@inkjs/ui';
import {Box, Text, Newline} from 'ink';
import React, {FC, useEffect, useState} from 'react';
import {AddLLM} from './AddLLM.js';
import {defaultConfig, removeConfig, writeConfig} from './util.js';

export const Setup: FC<{isReset: boolean}> = ({isReset}) => {
	const [step, setStep] = useState(0);
	
	useEffect(() => {
		if (isReset) {
			removeConfig();
		}
		setStep(1)
	}, [isReset]);

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
					<Box borderColor="green">
						<AddLLM />
					</Box>
				</Box>
			)}
		</Box>
	);
};
