import test from 'ava';
import {render} from 'ink-testing-library';
import React from 'react';
import App from './app.js';

test('show config list', t => {
	const {lastFrame} = render(<App command="list" />);

	t.assert(() => lastFrame()?.includes(`Google`));
});

test('show chat window', t => {
	const {lastFrame} = render(<App />);

	t.assert(() => lastFrame()?.includes(`Chat >`));
});

test('single question mode works', t => {
	const {lastFrame} = render(<App command="ask" query="help" />);

	t.assert(() => lastFrame()?.includes(`/reset`));
	t.assert(() => lastFrame()?.includes(`Reset current chat`));
});
