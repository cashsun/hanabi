import {createInterface} from 'node:readline';
import React, {useEffect} from 'react';
import {ChatUI} from './components/chat/ChatUI.js';
import ListLLMAndMcpServers from './components/config/ListLLMAndMcpServers.js';
import {Setup} from './components/config/Setup.js';
import {loadConfigToEnv} from './components/config/util.js';
import {useAppStore} from './store/appState.js';

if (process.platform === 'win32') {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.on('SIGINT', function () {
		process.emit('SIGINT');
	});
}

export default function App() {
	const ready = useAppStore(state => state.ready);

	useEffect(() => {
		if (ready) {
			loadConfigToEnv();
		}
	}, [ready]);

	if (!ready) {
		return <Setup isReset={false} />;
	}

	return <ChatUI />;
}
