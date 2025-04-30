import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {
	experimental_createMCPClient as createMCPClient,
	jsonSchema,
	type ToolSet,
} from 'ai';
import {getConfig} from '../components/config/util.js';
import {StreamableHTTPTransport} from '../lib/streamableHttpTransport.js';

const clientRegistry: Record<
	string,
	Awaited<ReturnType<typeof createMCPClient>>
> = {};

async function closeAllMcpConnections() {
	for (const [key, client] of Object.entries(clientRegistry)) {
		await client
			.close()
			.then(() => {
				console.log(`${key} client closed.`);
			})
			.catch(error => {
				console.error(`Error closing ${key} client:`, error);
			});
	}
}

process.once('exit', async function () {
	await closeAllMcpConnections();
	process.exit(0);
});
process.once('SIGINT', async function () {
	await closeAllMcpConnections();
	process.exit(0);
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
				switch (c.transport) {
					case 'stdio': {
						const transport = new StdioClientTransport({
							command: c.command,
							args: c.args,
							env: c.env,
							stderr: process.stderr,
							cwd: c.cwd,
						});

						const stdioClient = new Client({
							name: `${key}-client`,
							version: '1.0.0',
						});

						await stdioClient.connect(transport);
						(stdioClient as any).tools = async () => {
							// Get list of tools and add them to the toolset
							const toolList = await stdioClient.listTools();
							const stdioTools: ToolSet = {};
							for (const tool of toolList.tools) {
								const toolName = tool.name;
								stdioTools[toolName] = {
									description: tool.description || '',
									parameters: jsonSchema(tool.inputSchema as any),
									async execute(args) {
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

						break;
					}

					case 'sse': {
						client = await createMCPClient({
							transport: {
								type: 'sse',
								url: c.url,
								// optional: configure HTTP headers, e.g. for authentication
								headers: c.headers,
							},
						});

						break;
					}

					case 'streamable-http': {
						// streamable http
						client = await createMCPClient({
							transport: new StreamableHTTPTransport({
								url: c.url,
								headers: c.headers,
							}),
						});

						break;
					}
					// No default
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
