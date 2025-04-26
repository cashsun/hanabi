import { Spinner, TextInput, TextInputProps } from '@inkjs/ui';
import { TextPart, UserContent } from 'ai';
import dedent from 'dedent';
import fs from 'fs';
import { Box, Text, useInput } from 'ink';
import mime from 'mime-types';
import os from 'os';
import React, { FC, useCallback, useState } from 'react';
import { DefaultModelPicker } from '../config/DefaultModelPicker.js';
import { FilePicker } from '../FilePicker.js';
import { ChatHandles, chatHandles, suggestions } from './ChatHandles.js';

const isReset = (msg?: string) => msg && chatHandles.RESET === msg.trim();
const isCopy = (msg?: string) => msg && chatHandles.COPY === msg.trim();
const isLLM = (msg?: string) => msg && chatHandles.LLM === msg.trim();
const isExit = (msg?: string) =>
	msg && new RegExp(`${chatHandles.EXIT}`, 'gi').test(msg.trim());

export const ChatInput: FC<{
	defaultModel: HanabiConfig['defaultModel'];
	isFetching?: boolean;
	defaultValue?: TextInputProps['defaultValue'];
	onSubmit: (msg: UserContent) => void;
	onReset?: () => void;
	onCopy?: () => void;
	onLLM?: ()=>void;
}> = ({defaultModel, isFetching, onSubmit, onReset, onCopy, onLLM}) => {
	const [value, setValue] = useState('');
	const [showInput, setShowInput] = useState(true);
	const [files, setFiles] = useState<string[]>([]);
	const [pickingLLM, setPickingLLM] = useState(false);
	const pickingFile = new RegExp(`${chatHandles.FILE} $`).test(value ?? '');

	useInput((t, key) => {
		if (key.tab) {
			const found = suggestions.find(s => new RegExp(value).test(s));
			if (found) {
				setValue(found);
				refreshInput();
			}
		}
		if (key.backspace || (key.delete && os.type() === 'Darwin' && !value)) {
			setFiles([]);
		}
	});

	// input does not support controlled mode, we need to rerender to override
	// default value instead.
	const refreshInput = useCallback(() => {
		setShowInput(false);
		setTimeout(() => setShowInput(true), 0);
	}, []);

	if (pickingFile) {
		return (
			<FilePicker
				multi
				onConfirm={files => {
					setFiles(files);
					setValue(prev =>
						prev.replace(new RegExp(`${chatHandles.FILE} $`), ``),
					);
				}}
			/>
		);
	}

	if (pickingLLM) {
		return (
			<DefaultModelPicker
				onSelect={() => {
					setPickingLLM(false)
					setFiles([]);
					onLLM?.()
				}}
			/>
		);
	}

	return (
		<Box flexDirection="column">
			<Box borderColor="blueBright" borderStyle="single" paddingX={1}>
				<Text color="blueBright" bold>
					Chat {'>'}{' '}
				</Text>
				{isFetching && <Spinner label="Thinking..." />}
				{!isFetching && !!files.length && (
					<Text backgroundColor="gray">{files.length} file(s)</Text>
				)}
				{!isFetching && showInput && (
					<TextInput
						placeholder={` ${defaultModel?.model}`}
						onChange={setValue}
						suggestions={suggestions}
						defaultValue={value}
						onSubmit={msg => {
							if (isExit(msg)) {
								process.exit(0);
							}

							if (isReset(msg)) {
								onReset?.();
								setValue('');
								refreshInput();
								return;
							}
							if (isCopy(msg)) {
								onCopy?.();
								setValue('');
								refreshInput();
								return;
							}
							if (isLLM(msg)) {
								setPickingLLM(true);
								setValue('')
								setFiles([])
								refreshInput();
								return;
							}

							setValue('');
							let finalMsg: UserContent = [{type: 'text', text: msg}];
							if (!!files.length) {
								files.forEach(f => {
									(finalMsg[0] as TextPart).text += `\n< ${f} >`;
									const mimeType = mime.lookup(f) || 'text/plain';
									if (mimeType.startsWith('image')) {
										finalMsg.push({
											type: 'image',
											mimeType,
											image: fs.readFileSync(f),
										});
									} else {
										if (
											defaultModel?.provider === 'OpenAI' ||
											defaultModel?.provider === 'Azure'
										) {
											// OpenAI models does not support raw files yet via completion API
											(finalMsg[0] as TextPart).text += dedent`\n
											\`\`\`
											\n${fs.readFileSync(f, {encoding: 'utf-8'})}\n
											\`\`\`
											`;
										} else {
											finalMsg.push({
												type: 'file',
												mimeType: mimeType === 'application/json'? 'text/plain': mimeType,
												data: fs.readFileSync(f),
											});
										}
									}
								});
							}
							setFiles([]);
							onSubmit?.(finalMsg);
						}}
					/>
				)}
			</Box>
			<ChatHandles />
		</Box>
	);
};
