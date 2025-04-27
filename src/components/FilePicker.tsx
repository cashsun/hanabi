import {MultiSelect, Select, TextInput} from '@inkjs/ui';
import {globbySync} from 'globby';
import {Box, Text, useInput} from 'ink';
import React, {FC, useCallback, useMemo, useRef, useState} from 'react';
import {getConfig} from './config/util.js';

export const FilePicker: FC<{
	multi?: boolean;
	onConfirm: (files: string[]) => void;
}> = ({multi, onConfirm}) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [showInput, setShowInput] = useState(true);
	const [warning, setWarning] = useState('');
	const selected = useRef<string[]>([]);
	const allFiles = useMemo(() => {
		const ignore = getConfig().exclude;
		return globbySync(['**/*'], {gitignore: true, ignore});
	}, []);

	const refreshInput = useCallback(() => {
		setShowInput(false);
		setTimeout(() => setShowInput(true), 0);
	}, []);

	useInput((t, key) => {
		if (warning && !key.return) {
			setWarning('');
		}
		if (key.escape) {
			onConfirm([]);
		}
	});

	const options = useMemo(() => {
		let filtered = allFiles;
		if (searchTerm) {
			const regex = new RegExp(searchTerm, 'ig');
			filtered = selected.current.concat(
				allFiles.filter(f => regex.test(f) && !selected.current.includes(f)),
			);
		}
		return filtered.map(f => ({label: f, value: f}));
	}, [allFiles, searchTerm]);

	return (
		<Box
			borderColor="blueBright"
			borderStyle="single"
			flexDirection="column"
			paddingX={1}
		>
			{warning && <Text color="yellow">{warning}</Text>}
			<Box minHeight={1}>
				<Text color="blueBright" bold>
					File {'>'}{' '}
				</Text>
				{showInput && (
					<TextInput
						defaultValue={searchTerm}
						placeholder="Search... [SPACE] select, [ENTER] submit"
						onChange={val => {
							setSearchTerm(val.replace(/\s/g, ''));
							if (/\s/g.test(val)) {
								refreshInput();
							}
						}}
					/>
				)}
			</Box>
			{multi && (
				<MultiSelect
					visibleOptionCount={10}
					defaultValue={selected.current}
					options={options}
					onChange={vals => {
						selected.current = vals;
					}}
					onSubmit={() => {
						if (!selected.current.length) {
							setWarning('No file selected. Use [ESC] to exit.');
						} else {
							onConfirm(selected.current);
						}
					}}
				/>
			)}
			{!multi && (
				<Select
					visibleOptionCount={10}
					options={options}
					onChange={val => onConfirm([val])}
				/>
			)}
		</Box>
	);
};
