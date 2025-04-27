# hanabi-cli

> A command line interface to chat with any AI models, with MCP support. Use is as copilot alternative or any other use case.

![Chat demo](screenshots/screenshot1.png)

## Install

```bash
$ npm install --global hanabi-cli
```

## CLI

Get Help (WIP)

```
$ hanabi --help
```

Start hanabi chat session

```
$ hanabi
```

Reset config file

```
$ hanabi reset
```

## MCP Servers

In your `<user home folder>/.hanabi.json`, add `mcpServers` config.

```json
{
	"llms": [
		// ...
	],
	"defaultModel": {
		// ...
	},
	"mcpServers": {
		"home-ai": {
			"name": "Home AI",
			"transport": "stdio",
			"command": "node",
			"args": ["c:/folder/home-mcp.js"]
		},
		"context7": {
			"name": "context7",
			"transport": "stdio",
			"command": "npx",
			"args": ["-y", "@upstash/context7-mcp@latest"]
		},
		"browser-use": {
			"name": "Browser-use automation",
			"transport": "sse",
			"url": "http://172.17.0.1:3003/sse",
			"headers": {
				"authentication": "Bearer api-token"
			}
		},
        // might not work if you are using Windows or nvm, try: https://github.com/modelcontextprotocol/servers/issues/64
		"tavily": {
			"name": "Tavily Search",
			"transport": "stdio",
			"command": "npx",
			"env": {
				"TAVILY_API_KEY": "your-api-key"
			},
			"args": ["-y", "tavily-mcp@0.1.4"]
		},
		"file-system": {
			"name": "file system",
			"transport": "stdio",
			"command": "npx",
			"args": [
				"-y",
				"@modelcontextprotocol/server-filesystem",
				"/Users/kaishisun/dev/hanabi"
			]
		},
		"my-calendar": {
			"name": "My Calendar",
			"transport": "streamable_http",
			"url": "http://172.17.0.1:3001/mcp",
			"headers": {
				"authentication": "Bearer my-auth-token"
			}
		}
	}
}
```

## Exclude files

To prevent files from being accessed, add [globby](https://github.com/sindresorhus/globby) patterns in the config

All files included in the .gitignore will also be auto excluded.

```json
// <user home folder>/.hanabi.json
{
	"exclude": [
        "certificates", 
        "screenshots/**/*", 
        "passwords/*", 
        "*.pid"
    ],
	"llms": [
		// ...
	],
	"defaultModel": {
		// ...
	}
}
```

## TODOs

- [x] include local files in chat
- [x] mcp support
- [x] add config to exclude custom files pattern
- [ ] support for custom system prompts (via cli and config)
- [ ] add web server host mode (ie api and web interface)
- [ ] Flowise agent support
- [ ] Dify agent support
- [ ] n8n agent support ?
