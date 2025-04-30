import React, {useEffect} from 'react';
import {ChatUI} from './components/chat/ChatUI.js';
import {Setup} from './components/config/Setup.js';
import {loadConfigToEnv} from './components/config/util.js';
import {useAppStore} from './store/appState.js';

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
