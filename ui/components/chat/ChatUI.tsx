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
import {UIMessage} from 'ai';
import {
	AlertCircle,
	ArrowUp,
	LoaderCircle,
	Sparkles,
	Square,
	TriangleAlert,
} from 'lucide-react';
import {motion} from 'motion/react';
import {Fragment, useEffect, useRef, useState} from 'react';

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
	const [withAnswerSchema, setWithAnswerSchema] = useState(false);
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
		setMessages,
	} = useChat({body: {withAnswerSchema}});
	const ref = useRef<HTMLFormElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const isLoading = status === 'submitted' || status === 'streaming';

	useEffect(() => {
		if (!isLoading) {
			inputRef.current?.focus();
		}
	}, [isLoading]);

	useEffect(() => {
		const lastMessage = messages.at(-1);
		const formatAnswerIdx =
			lastMessage?.parts.findIndex(
				p =>
					p.type === 'tool-invocation' &&
					p.toolInvocation.toolName === 'format-answer',
			) ?? -1;
		const formatAnswerPart = lastMessage?.parts[formatAnswerIdx];
		const hasFormatted =
			formatAnswerPart &&
			formatAnswerPart.type == 'tool-invocation' &&
			formatAnswerPart.toolInvocation.state === 'result';
		if (
			lastMessage &&
			formatAnswerPart?.type === 'tool-invocation' &&
			!hasFormatted
		) {
			// extract the args as the extra message - ie formatted answer.
			const content = JSON.stringify(
				formatAnswerPart.toolInvocation.args,
				null,
				2,
			);
			const formatted: UIMessage[] = [
				...messages.slice(0, -1),
				{
					...lastMessage,
					content: '',
					parts: [
						...lastMessage.parts.slice(0, formatAnswerIdx),
						{
							type: 'tool-invocation',
							toolInvocation: {
								...formatAnswerPart.toolInvocation,
								state: 'result',
								result: formatAnswerPart.toolInvocation.args,
							},
						},
						{
							type: 'text',
							text: `\`\`\`json\n${content}\n\`\`\``,
						},
						...lastMessage.parts.slice(formatAnswerIdx + 1),
					],
				},
			];
			setMessages(formatted);
		}
	}, [status, messages, config, setMessages]);

	return (
		<main
			className={cn(
				'h-screen w-full items-center flex overflow-auto flex-col-reverse [&>*]:translate-z-0 pt-6 px-3',
				{'justify-center': !messages.length},
			)}
			style={{overflowAnchor: 'auto !important' as any}}
		>
			<title>{`${config?.name ?? 'Hanabi Agent'}`}</title>
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
						placeholder="Message agent..."
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
								{isLoadingConfig && (
									<div className="w-28 h-6 animate-pulse bg-primary-foreground/20 rounded-xl" />
								)}
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

								<Tooltip delayDuration={100}>
									<TooltipTrigger asChild>
										<div
											className="cursor-pointer"
											onClick={() => setWithAnswerSchema(!withAnswerSchema)}
										>
											<div
												className={cn(
													'inline-block size-1.5 rounded-full mb-px',
													withAnswerSchema
														? 'bg-emerald-500'
														: 'border border-border',
												)}
											/>{' '}
											format answer
										</div>
									</TooltipTrigger>
									<TooltipContent>
										{!config?.answerSchema && (
											<div>
												<AlertCircle className="w-4 inline-block" /> answer
												schema missing in the config.
											</div>
										)}
										<span>Use </span>
										<a
											className="text-blue-600"
											href="https://github.com/cashsun/hanabi?tab=readme-ov-file#answer-schema"
											target="_blank"
										>
											answer schema
										</a>
									</TooltipContent>
								</Tooltip>
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
				{messages.map((message, idx) => (
					<Fragment key={message.id}>
						{message.role === 'user' && <UserMessage message={message} />}
						{message.role !== 'user' && (
							<AgentMessage
								message={message}
								reload={messages.length - 1 === idx ? reload : undefined}
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
