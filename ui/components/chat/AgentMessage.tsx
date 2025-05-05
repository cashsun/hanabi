'use client';
import {useChat} from '@ai-sdk/react';
import {Plug, Sparkles} from 'lucide-react';
import { memo } from 'react';
import Markdown from 'react-markdown';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism';
interface Props {
	message: ReturnType<typeof useChat>['messages'][0];
}

export function AgentMessage({message}: Props) {
	return (
		<div className="rounded-lg flex -mt-4 leading-9 gap-4">
			<Sparkles className="w-5 flex-none" />
			<div className="flex-auto flex flex-col gap-1 min-h-16 text-foreground/50 [&>*]:text-foreground">
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
							<div
								key={idx}
								className="inline-flex gap-2 mt-1.5 bg-primary/20 self-start px-3 leading-6 rounded-full items-center font-semibold"
							>
								<Plug className="w-4 -mr-1" />
								tool: {part.toolInvocation.toolName}
							</div>
						);
					}
				})}
				<div className="markdown-body">
					<Markdown
						children={message.content}
						components={{
							code: memo(({node, inline, className, children, ...props}: any) => {
								const match = /language-(\w+)/.exec(className || '');

								return !inline && match ? (
									<SyntaxHighlighter
										style={vscDarkPlus}
										PreTag="div"
										language={match[1]}
									>
										{children}
									</SyntaxHighlighter>
								) : (
									<code className={className} {...props}>
										{children}
									</code>
								);
							}),
						}}
					/>
				</div>
			</div>
		</div>
	);
}
