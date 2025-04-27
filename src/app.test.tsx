import React from 'react';
import chalk from 'chalk';
import test from 'ava';
import {render} from 'ink-testing-library';
import App from './app.js';

test('show reset', t => {
	const {lastFrame} = render(<App command="list" />);

	t.is(lastFrame(), `Hello, ${chalk.green('Stranger')}`);
});
