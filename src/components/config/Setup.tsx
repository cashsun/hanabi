import {ConfirmInput, Spinner} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React, {type FC, useEffect, useState} from 'react';
import {AddLLM} from './AddLLM.js';
import {configPath, defaultConfig, removeConfig, writeConfig} from './util.js';

export const Setup: FC<{isReset: boolean}> = ({isReset}) => {
	const [step, setStep] = useState(0);
	const [confirmReset, setConfirmReset] = useState(!isReset);

	useEffect(() => {
		if (isReset && confirmReset) {
			removeConfig();
		}
		setStep(1);
	}, [isReset, confirmReset]);

	useEffect(() => {
		if (step === 1) {
			writeConfig(defaultConfig);
			// give some time to show the spinner
			setTimeout(() => {
				setStep(2);
			}, 500);
		}
	}, [step]);

	if (!confirmReset && isReset) {
		return (
			<>
				<Text color="yellowBright">⟡ Are you sure to reset the config? </Text>
				<Text color="gray">({configPath})</Text>
				<ConfirmInput
					onConfirm={() => {
						setConfirmReset(true);
					}}
					onCancel={() => {
						process.exit(0);
					}}
				/>
			</>
		);
	}

	return (
		<Box flexDirection="column">
			<Text color="green">⟡ Hanabi will now start the initial setup.</Text>
			{step === 1 && <Spinner label="Creating .hanabi.json" />}
			{step > 1 && (
				<Box flexDirection="column">
					<Text>
						<Text color="green">✓</Text> Config file created.
					</Text>
					<Text color="gray" dimColor>
						{configPath}
					</Text>
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
