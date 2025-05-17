import {useChat} from '@ai-sdk/react';
import {useMemo} from 'react';

interface Props {
	message: ReturnType<typeof useChat>['messages'][0];
}

export function UserMessage({message}: Props) {
	const textPart = useMemo(() => {
		return message.parts.find(p => p.type === 'text')?.text;
	}, [message.parts]);

	return (
		<div className="bg-stone-600/20 dark:bg-primary-foreground/50 rounded-lg flex flex-col px-4 py-2 self-end max-w-2/3">
			<div className="text-primary font-bold leading-7">{textPart}</div>
		</div>
	);
}
