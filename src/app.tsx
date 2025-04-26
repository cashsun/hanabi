import React, { useEffect } from 'react';
import { Chat } from './components/chat/Chat.js';
import { Setup } from './components/config/Setup.js';
import {
	loadConfigToEnv
} from './components/config/util.js';
import { useAppStore } from './store/appState.js';

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

	if (!ready) {
		return <Setup isReset={isReset} />;
	}

	

	return <Chat singleQuestion={command === 'ask'} query={query} />;
}
