'use client';
import {AgentMessage} from '@/components/chat/AgentMessage';
import {MessageSkeleton} from '@/components/chat/MessageSkeleton';
import {UserMessage} from '@/components/chat/UserMessage';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip';
import {useChatConfig} from '@/hooks/useChatConfig';
import {cn} from '@/lib/utils';
import {useChat} from '@ai-sdk/react';
import {
	ArrowUp,
	LoaderCircle,
	Sparkles,
	Square,
	TriangleAlert,
} from 'lucide-react';
import {Fragment, useEffect, useRef} from 'react';

export default function ChatUI() {
	const {
		messages,
		input,
		status,
		handleInputChange,
		handleSubmit,
		error,
		stop,
	} = useChat();
	const {data: config, isLoading: isLoadingConfig} = useChatConfig();
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
				'h-screen w-full items-center flex overflow-auto flex-col-reverse [&>*]:translate-z-0 pt-6 px-3',
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
					<div className="flex flex-none justify-between items-center p-2 gap-3">
						<div className="grow text-primary/50 ml-1">
							{isLoadingConfig && (
								<div className="h-5 bg-primary/10 w-full max-w-32 rounded-lg animate-pulse" />
							)}
							{!isLoadingConfig && (
								<div className="inline-flex gap-3">
									<Tooltip delayDuration={100}>
										<TooltipTrigger asChild>
											<span className="cursor-default">
												{config?.defaultModel?.model}
											</span>
										</TooltipTrigger>
										<TooltipContent>
											{config?.defaultModel?.provider}
										</TooltipContent>
									</Tooltip>

									{!!config?.mcpKeys?.length && (
										<Tooltip delayDuration={100}>
											<TooltipTrigger asChild>
												<div className="cursor-default">
													<div className="inline-block size-1.5 rounded-full bg-emerald-500 mb-px" />{' '}
													tools
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<ul>
													{config.mcpKeys.map(k => (
														<li key={k}>{k}</li>
													))}
												</ul>
											</TooltipContent>
										</Tooltip>
									)}
								</div>
							)}
						</div>
						<Button
							type="submit"
							variant="secondary"
							size="icon"
							className="bg-stone-900 text-white text w-auto px-3 rounded-lg"
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<LoaderCircle className="animate-spin" /> Thinking
								</>
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
					'flex flex-col gap-6 pb-8 container mx-auto max-w-[800px] justify-end',
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
				{error && (
					<div
						title={error.message}
						className="text-white px-3 py-2 rounded-xl bg-red-600/30 self-start max-w-full truncate"
					>
						<div className="flex font-bold items-center gap-2">
							<TriangleAlert className="w-4 flex-none" /> Error
						</div>
						{error.message}
					</div>
				)}
				{status === 'submitted' && <MessageSkeleton />}
				{isLoading && (
					<Button
						size="sm"
						variant="outline"
						className="self-center"
						onClick={stop}
					>
						<Square className="w-3" />
						Stop
					</Button>
				)}
			</div>
			{!messages.length && (
				<div className="overflow-hidden flex h-36 text-primary/30 text-2xl justify-center items-center w-full">
					<Sparkles className="-ml-1 mr-2 w-5" />
					Hi.{' '}
					{!isLoadingConfig && <div className="ml-1">I'm {config?.name ?? 'Hanabi'}.</div>}
				</div>
			)}
		</main>
	);
}
