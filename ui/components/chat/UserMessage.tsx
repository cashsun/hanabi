import {useChat} from '@ai-sdk/react';

interface Props {
	message: ReturnType<typeof useChat>['messages'][0];
}

export function UserMessage({message}: Props) {
	return (
		<div className="bg-primary-foreground/50 rounded-lg flex flex-col px-4 py-2 min-w-28 self-end max-w-2/3">
			<div className="text-sm text-primary/70">User</div>
			<div className="text-primary font-bold leading-7">{message.content}</div>
		</div>
	);
}
