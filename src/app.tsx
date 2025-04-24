import {TextInput} from '@inkjs/ui';
import {Text} from 'ink';
import React, {useEffect, useState} from 'react';
import {Setup} from './components/config/Setup.js';
import {useAppStore} from './store/appState.js';
import {hasConfig, loadConfigToEnv} from './components/config/util.js';
import { Chat } from './components/chat/Chat.js';

interface Props {
	command?: string;
}

export default function App({command}: Props) {
	const ready = useAppStore(state => state.ready);

	useEffect(() => {
		if (ready) {
			loadConfigToEnv();
		}
	}, [ready]);

	if (!ready) {
		return <Setup />;
	}

	return <Chat />;
}
