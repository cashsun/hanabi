'use client'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useMemo} from 'react';

export default function ReactQueryProvider({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const queryClient = useMemo(() => new QueryClient(), []);
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
