'use client';
import {AgentMessage} from '@/components/chat/AgentMessage';
import {UserMessage} from '@/components/chat/UserMessage';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {cn} from '@/lib/utils';
import {useChat} from '@ai-sdk/react';
import {ArrowUp, LoaderCircle, Sparkle, Sparkles} from 'lucide-react';
import {Fragment, useEffect, useRef} from 'react';

export default function ChatUI() {
	const {messages, input, status, handleInputChange, handleSubmit, error} =
		useChat();
	const ref = useRef<HTMLFormElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const isLoading = status === 'submitted' || status === 'streaming';

	useEffect(() => {
		if (!isLoading) {
			inputRef.current?.focus();
		}
	}, [isLoading]);

	return (
		<main
			className={cn(
				'h-screen w-full items-center flex overflow-auto flex-col-reverse [&>*]:translate-z-0 pt-6',
				{'justify-center': !messages.length},
			)}
			style={{overflowAnchor: 'auto !important' as any}}
		>
			<form
				onSubmit={handleSubmit}
				ref={ref}
				className={cn(
					'flex-none flex justify-center z-10 w-full bg-background',
					{
						'sticky bottom-0 pb-3': messages.length,
					},
				)}
			>
				<div className="max-w-[800px] flex container mx-auto flex-col border border-primary/50 w-full rounded-xl">
					<Textarea
						name="prompt"
						value={input}
						placeholder="Chat to Hanabi..."
						ref={inputRef}
						disabled={isLoading}
						rows={2}
						onKeyDownCapture={e => {
							if (e.key === 'Enter') {
								ref.current?.requestSubmit();
								e.preventDefault();
								return false;
							}
						}}
						className="py-3 !text-base !bg-transparent border-none !focus:outline-0 !focus-visible:border-none focus-visible:ring-0 resize-none"
						onChange={handleInputChange}
					/>
					{/* controls */}
					<div className="flex flex-none justify-end p-2">
						<Button
							type="submit"
							variant="secondary"
							size="icon"
							className="bg-stone-900 text-white text w-auto px-3 rounded-lg"
							disabled={isLoading}
						>
							{isLoading ? (
								<LoaderCircle className="animate-spin" />
							) : (
								<>
									<ArrowUp />
									Send
								</>
							)}
						</Button>
					</div>
				</div>
			</form>
			{/* messages */}
			<div
				className={cn(
					'flex flex-col gap-6 pb-8 container mx-auto max-w-[800px]',
					{
						grow: messages.length,
					},
				)}
			>
				{messages.map(message => (
					<Fragment key={message.id}>
						{message.role === 'user' && <UserMessage message={message} />}
						{message.role !== 'user' && <AgentMessage message={message} />}
					</Fragment>
				))}
			</div>
			{!messages.length && (
				<div className="flex h-36 text-primary/30 text-xl justify-center items-center w-full">
					<Sparkle className='-ml-1 mr-2 w-4' /> Hi, I'm Hanabi.
				</div>
			)}
		</main>
	);
}
