'use client';
import {Button} from '@/components/ui/button';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip';
import {UIMessage} from 'ai';
import clipboard from 'clipboardy';
import {Check, Copy, Plug, RefreshCw, Sparkles} from 'lucide-react';
import {ComponentProps, memo, ReactNode, useEffect, useState} from 'react';
import Markdown from 'react-markdown';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Props {
	message: UIMessage;
	isLoading: boolean | undefined;
	reload?: () => void;
}

function CopyButton({onClick, ...props}: ComponentProps<typeof Button>) {
	const [done, setDone] = useState(false);

	useEffect(() => {
		if (done) {
			setTimeout(() => {
				setDone(false);
			}, 2000);
		}
	}, [done]);

	return (
		<Button
			{...props}
			variant="ghost"
			size="icon"
			onClick={e => {
				onClick?.(e);
				setDone(true);
			}}
		>
			{done ? <Check /> : <Copy />}
		</Button>
	);
}

function WithCodeControls({
	text,
	language,
	children,
}: {
	text: string;
	language?: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col">
			<div className="bg-stone-700 flex items-center justify-between -mb-2 [&_button]:text-white">
				<span className="pl-3 text-white/60">{language ?? ''}</span>
				<Tooltip delayDuration={100}>
					<TooltipTrigger asChild>
						<CopyButton onClick={() => clipboard.write(text)}>
							<Copy />
						</CopyButton>
					</TooltipTrigger>
					<TooltipContent>Copy This Code</TooltipContent>
				</Tooltip>
			</div>
			{children}
		</div>
	);
}

export function AgentMessage({message, reload, isLoading}: Props) {
	return (
		<div className="flex -mt-4 leading-9 gap-4">
			<Sparkles className="w-5 flex-none" />
			<div className="grow min-w-0 flex flex-col gap-1 min-h-16 text-foreground/50 [&>*]:text-foreground">
				{message.parts.map((part, idx) => {
					if (part.type === 'reasoning') {
						return (
							<Markdown key={idx}>{`resoning: ${part.reasoning}`}</Markdown>
						);
					}

					if (part.type === 'source') {
						return (
							<div key={idx}>
								source: {part.source.title} ({part.source.url})
							</div>
						);
					}
					if (part.type === 'tool-invocation') {
						return (
							<Tooltip key={idx} delayDuration={100}>
								<TooltipTrigger asChild>
									<div className="inline-flex gap-2 bg-primary/20 self-start px-3 leading-6 rounded-full items-center font-semibold">
										<Plug className="w-4 -mr-1" />
										tool: {part.toolInvocation.toolName}
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<div className="flex flex-col">
										<div className="font-bold">Args:</div>
										<div>
											{JSON.stringify(part.toolInvocation.args, null, 2)}
										</div>
									</div>
								</TooltipContent>
							</Tooltip>
						);
					}
					if (part.type === 'text') {
						return (
							<div className="markdown-body" key={idx}>
								<Markdown
									children={part.text}
									components={{
										code: memo(
											({node, inline, className, children, ...props}: any) => {
												const match = /language-(\w+)/.exec(className || '');

												return !inline && match ? (
													<WithCodeControls text={children} language={match[1]}>
														<SyntaxHighlighter
															style={vscDarkPlus}
															PreTag="div"
															language={match[1]}
														>
															{children}
														</SyntaxHighlighter>
													</WithCodeControls>
												) : (
													<code className={className} {...props}>
														{children}
													</code>
												);
											},
										),
									}}
								/>
							</div>
						);
					}
				})}

				{!isLoading && (
					<div className="flex justify-end -mb-2">
						<Tooltip delayDuration={100}>
							<TooltipTrigger asChild>
								{!!reload && (
									<Button variant="ghost" size="icon" onClick={reload}>
										<RefreshCw />
									</Button>
								)}
							</TooltipTrigger>
							<TooltipContent>Retry</TooltipContent>
						</Tooltip>
						<Tooltip delayDuration={100}>
							<TooltipTrigger asChild>
								<CopyButton
									onClick={() =>
										clipboard.write(
											message.parts
												.map(p => (p.type === 'text' ? p.text : ''))
												.join('\n'),
										)
									}
								>
									<Copy />
								</CopyButton>
							</TooltipTrigger>
							<TooltipContent>Copy This Answer</TooltipContent>
						</Tooltip>
					</div>
				)}
			</div>
		</div>
	);
}
