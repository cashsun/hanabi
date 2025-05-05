import ReactQueryProvider from '@/components/ReactQueryProvider';
import {QueryClient} from '@tanstack/react-query';
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import {useMemo} from 'react';
import './globals.css';
import 'github-markdown-css';
import { TooltipProvider } from '@/components/ui/tooltip';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Hanabi Agent',
	description: 'Hanabi Agent',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const queryClient = useMemo(() => new QueryClient(), []);
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
			>
				<ReactQueryProvider>
					<TooltipProvider>{children}</TooltipProvider>
				</ReactQueryProvider>
			</body>
		</html>
	);
}
