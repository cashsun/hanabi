import React, {useEffect} from 'react';
import {Chat} from './components/chat/Chat.js';
import {Setup} from './components/config/Setup.js';
import {loadConfigToEnv} from './components/config/util.js';
import {useAppStore} from './store/appState.js';
import ListLLMAndMcpServers from './components/config/ListLLMAndMcpServers.js';

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

	useEffect(() => {
		if (ready) {
			loadConfigToEnv();
		}
	}, [ready]);

	if(command === 'list'){
		return <ListLLMAndMcpServers />
	}

	if (!ready) {
		return <Setup isReset={isReset} />;
	}

	return <Chat singleRunQuery={command === 'ask' ? query ?? '1' : undefined} />;
}
