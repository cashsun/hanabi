# hanabi-cli

> A command line interface to chat with any AI models, with MCP support.

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
            "args": [
                "-y",
                "@upstash/context7-mcp@latest"
            ]
        },
        "browser-use": {
            "name": "Browser-use automation",
			"transport": "sse",
			"url": "http://172.17.0.1:3003/sse",
            "headers": {
                "authentication": "Bearer api-token"
            }
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

## TODOs

- [x] include local files in chat
- [ ] add config to exclude custom files
- [x] mcp support
- [ ] add more LLM providers
- [ ] Flowise agent support
- [ ] Dify agent support
- [ ] n8n agent support ?
