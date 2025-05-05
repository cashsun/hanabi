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
import {motion} from 'motion/react';
import {Fragment, useEffect, useRef} from 'react';

const TYPE_DURATION = 0.03;

function TypeWriter({children, caret}: {children: string; caret?: boolean}) {
	const chars = children.split('');
	return (
		<>
			{chars.map((c, i) => {
				return (
					<motion.span
						key={i}
						className="overflow-hidden whitespace-pre"
						initial={{width: 0}}
						animate={{width: 'auto'}}
						transition={{
							delay: i * TYPE_DURATION + (caret ? 1 : 0),
							duration: TYPE_DURATION,
						}}
					>
						{c}
					</motion.span>
				);
			})}
			{caret && (
				<motion.div
					className="ml-1 w-2 h-5 bg-primary/60"
					animate={{opacity: 0}}
					transition={{delay: chars.length * TYPE_DURATION + 2}}
				/>
			)}
		</>
	);
}

export default function ChatUI() {
	const {data: config, isLoading: isLoadingConfig} = useChatConfig();

	const {
		messages,
		input,
		status,
		handleInputChange,
		handleSubmit,
		error,
		stop,
		reload,
	} = useChat();
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
							<div className="inline-flex gap-3 items-center">
								{isLoadingConfig && <div className='w-28 h-6 animate-pulse bg-primary-foreground/20 rounded-xl' />}
								{!!config?.defaultModel && (
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
								)}

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
						</div>
						<Button
							type="submit"
							variant="secondary"
							size="icon"
							className="bg-stone-900 text-white text w-auto px-3 rounded-lg"
							disabled={isLoading || isLoadingConfig}
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
						{message.role !== 'user' && (
							<AgentMessage
								message={message}
								reload={reload}
								isLoading={isLoading}
							/>
						)}
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
					{/* <motion.span initial={{opacity: 0}} animate={{opacity: 1}}> */}
					<Sparkles className="-ml-1 mr-2 w-5" />
					{/* </motion.span> */}
					<TypeWriter>Hi.</TypeWriter>
					{!isLoadingConfig && (
						<TypeWriter caret>{` I'm ${config?.name ?? 'Hanabi'}.`}</TypeWriter>
					)}
				</div>
			)}
		</main>
	);
}
