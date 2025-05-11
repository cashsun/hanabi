'use client';
import ChatUI from '@/components/chat/ChatUI';
import { useChatConfig } from '@/hooks/useChatConfig';
import {
	Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

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

export default function Home() {
	const {data: config, isLoading: isLoadingConfig} = useChatConfig();

	if (isLoadingConfig) {
		return (
			<main className="h-screen container mx-auto flex items-center justify-center">
				<Sparkles className="mr-2 w-4 animate-pulse" /> Checking agent config...
			</main>
		);
	}

	return <ChatUI />;
}
