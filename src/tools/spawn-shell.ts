import {jsonSchema, tool} from 'ai';
import {spawn} from 'node:child_process';

const decoder = new TextDecoder('utf8');

export async function spawnShell(command: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const cmdParts = command.split(' ');
		const child = spawn(cmdParts[0] ?? '', cmdParts.slice(1), {
			cwd: process.env['CWD'] || process.cwd(),
			shell: true,
			env: process.env,
		});

		let output = '';
		child.stdout.on('data', data => {
			const d = decoder.decode(data);
			console.error(d);
			output += d;
		});

		child.stderr.on('data', data => {
			const d = decoder.decode(data);
			console.error(d);
			output += d;
		});

		child.on('close', code => {
			resolve(output);
		});
	});
}

export const runShellCommand = tool({
	description:
		'Run a shell command in the current working directory. Always ask user for confirmation before running.',
	parameters: jsonSchema({
		type: 'object',
		properties: {
			command: {
				type: 'string',
				description: 'The shell command to run.',
			},
		},
		required: ['command'],
	}),
	async execute({command}: any) {
		return spawnShell(command);
	},
});
