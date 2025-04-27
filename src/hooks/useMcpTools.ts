import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
	experimental_createMCPClient as createMCPClient,
	jsonSchema,
	ToolSet,
} from 'ai';
import { getConfig } from '../components/config/util.js';
import { StreamableHTTPTransport } from '../lib/streamableHttpTransport.js';

const clientRegistry: Record<
	string,
	Awaited<ReturnType<typeof createMCPClient>>
> = {};

async function closeAllMcpConnections() {
	for (const client of Object.values(clientRegistry)) {
		await client.close();
	}
}

process.on('SIGINT', async function () {
	console.log('Caught interrupt signal... Closing MCP clients.');
	await closeAllMcpConnections();
});
process.on('beforeExit', async function () {
	console.log('Exiting... closing MCP clients.');
	await closeAllMcpConnections();
});

export async function getMcpTools(serverKeys: string[]) {
	const config = getConfig();
	let tools: ToolSet = {};
	for (const key of serverKeys) {
		const c = config.mcpServers?.[key];
		if (c) {
			let client: Awaited<ReturnType<typeof createMCPClient>> | undefined =
				clientRegistry[key];

			if (!client) {
				if (c.transport === 'stdio') {
					const transport = new StdioClientTransport({
						command: c.command,
						args: c.args,
						env: c.env,
						stderr: process.stderr
					});

					const stdioClient = new Client({
						name: `${key}-client`,
						version: '1.0.0'
					});

					await stdioClient.connect(transport);
					(stdioClient as any).tools = async () => {
						// Get list of tools and add them to the toolset
						const toolList = await stdioClient.listTools();
						const stdioTools: ToolSet = {};
						for (const tool of toolList.tools) {
							let toolName = tool.name;
							stdioTools[toolName] = {
								description: tool.description || '',
								parameters: jsonSchema(tool.inputSchema as any),
								execute: async args => {
									const result = await stdioClient?.callTool({
										name: tool.name,
										arguments: args,
									});
									return JSON.stringify(result);
								},
							};
						}
						return stdioTools;
					};
					client = stdioClient as any;
				} else if (c.transport === 'sse') {
					client = await createMCPClient({
						transport: {
							type: 'sse',
							url: c.url,
							// optional: configure HTTP headers, e.g. for authentication
							headers: c.headers,
						},
					});
				} else if (c.transport === 'streamable-http') {
					// streamable http
					client = await createMCPClient({
						transport: new StreamableHTTPTransport({
							url: c.url,
							headers: c.headers,
						}),
					});
				}
			}

			if (client) {
				clientRegistry[key] = client;
				const clientTools = await client.tools();
				tools = {...tools, ...clientTools};
			}
		}
	}
	return tools;
}
