import test from 'ava';
import {render} from 'ink-testing-library';
import React from 'react';
import {Chat} from './components/chat/Chat.js';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

test('runs normal chat', t => {
	const {lastFrame} = render(
		<QueryClientProvider client={new QueryClient()}>
			<Chat prompt="hi" onComplete={() => {}} />
		</QueryClientProvider>,
	);
	t.assert(!!lastFrame()?.includes(`Thinking...`), 'Did not match');
});
