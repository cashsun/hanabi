import {MultiSelect, Select, Spinner, TextInput} from '@inkjs/ui';
import {Box, Text, useInput} from 'ink';
import React, {type FC, useCallback, useMemo, useRef, useState} from 'react';
import {useListFIles} from '../hooks/useListFiles.js';

export const FilePicker: FC<{
	multi?: boolean;
	readonly onConfirm: (files: string[]) => void;
}> = ({multi, onConfirm}) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [showInput, setShowInput] = useState(true);
	const [warning, setWarning] = useState('');
	const selected = useRef<string[]>([]);
	const {data: allFiles, isFetching} = useListFIles();

	const refreshInput = useCallback(() => {
		setShowInput(false);
		setTimeout(() => {
			setShowInput(true);
		}, 0);
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
		let filtered = allFiles ?? [];
		if (searchTerm && allFiles) {
			const regex = new RegExp(searchTerm, 'ig');
			filtered = [
				...selected.current,
				...allFiles.filter(f => regex.test(f) && !selected.current.includes(f)),
			];
		}
		return filtered.map(f => ({label: f, value: f}));
	}, [allFiles, searchTerm]);

	if (isFetching) {
		return <Spinner label="Listing files..." />;
	}

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
					onChange={val => {
						onConfirm([val]);
					}}
				/>
			)}
		</Box>
	);
};
