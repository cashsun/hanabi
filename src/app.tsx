import React, {useEffect, useState} from 'react';
import {Chat} from './components/chat/Chat.js';
import {Setup} from './components/config/Setup.js';
import {
	configPath,
	defaultConfig,
	loadConfigToEnv,
} from './components/config/util.js';
import {useAppStore} from './store/appState.js';
import ListLLMAndMcpServers from './components/config/ListLLMAndMcpServers.js';
import {ConfirmInput} from '@inkjs/ui';
import {Newline, Text} from 'ink';

if (process.platform === 'win32') {
	var rl = require('readline').createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.on('SIGINT', function () {
		process.emit('SIGINT');
	});
}

interface Props {
	command?: string;
	query?: string;
}

export default function App({command, query}: Props) {
	const isReset = command === 'reset';
	const ready = useAppStore(state => (isReset ? false : state.ready));
	const [confirmReset, setConfirmReset] = useState(false);

	useEffect(() => {
		if (ready) {
			loadConfigToEnv();
		}
	}, [ready]);

	if (command === 'list') {
		return <ListLLMAndMcpServers />;
	}

	if (!ready) {
		if (!confirmReset && isReset) {
			return (
				<>
					<Text color="yellowBright">⟡ Are you sure to reset the config?{' '}</Text>
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
		return <Setup isReset={isReset} />;
	}

	return <Chat singleRunQuery={command === 'ask' ? query ?? '1' : undefined} />;
}
