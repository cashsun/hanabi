import ReactQueryProvider from '@/components/ReactQueryProvider';
import {TooltipProvider} from '@/components/ui/tooltip';
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import 'github-markdown-css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	description: 'Hanabi Custom Agent',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
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
