import test from 'ava';
import {render} from 'ink-testing-library';
import React from 'react';
import App from './app.js';

test('show chat window', t => {
	const {lastFrame} = render(<App />);

	t.assert(() => lastFrame()?.includes(`Chat >`));
});
