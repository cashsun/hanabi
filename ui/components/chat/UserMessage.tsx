import {useChat} from '@ai-sdk/react';

interface Props {
	message: ReturnType<typeof useChat>['messages'][0];
}

export function UserMessage({message}: Props) {
	return (
		<div className="bg-stone-600/20 dark:bg-primary-foreground/50 rounded-lg flex flex-col px-4 py-2 self-end max-w-2/3">
			<div className="text-primary font-bold leading-7">
				{message.parts.find(p => p.type === 'text')?.text}
			</div>
		</div>
	);
}
