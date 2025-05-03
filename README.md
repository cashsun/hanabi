# hanabi-cli

> ⟡ A terminal AI chat interface for any LLM model, with files & MCP support - Build your agent from command line.

## Table of Contents

- [Install](#install)
- [CLI](#cli)
- [MCP Servers](#mcp-servers)
- [Exclude files](#exclude-files)
- [Custom System Prompt](#custom-system-prompt)
- [Local config file override](#local-config-file-override)
- [Streaming Mode](#streaming-mode)
- [TODOs](#todos)

![Chat demo](screenshots/Screenshot1.png)

## Install

```bash
$ npm install -g hanabi-cli
```

## CLI

Get Help

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

Ask single question and print result. (Yes Hanabi auto injects today's date and timezone for you as context)

```
$ hanabi ask "how's the weather tomorrow?"
$ hanabi ask "generate a react todo app" > ./todo-app-instructions.md
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
		// npx stdio approach is flaky & slow. highly recommend to npm install -g <mcp-server> and use the following. see https://github.com/modelcontextprotocol/servers/issues/64
        // "file-system-windows": {
        // 	"name": "file system",
        // 	"transport": "stdio",
        // 	"command": "path/to/your/node.exe",
        // 	"args": ["path/to/global/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js", "."]
        // },
		"tavily": {
			"name": "Tavily Search",
			"transport": "stdio",
			"command": "npx",
			"env": {
				"TAVILY_API_KEY": "your-api-key"
			},
			"args": ["-y", "tavily-mcp@0.1.4"]
		},
		// npx is slow! use above recommendation
		"file-system": {
			"name": "file system",
			"transport": "stdio",
			"command": "npx",
			"args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
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
	"exclude": ["certificates", "screenshots/**/*", "passwords/*", "*.pid"],
	"llms": [
		// ...
	],
	"defaultModel": {
		// ...
	}
}
```

## Custom System Prompt

Hanabi comes with predefined simple system prompt to show docs on terminal commands and provide date & timezone context. You can provide extra system prompt in `hanabi.system.prompt.md` at working directory. You can use `/gen` handle to generate one for you.

example `hanabi.system.prompt.md`
```markdown
# act as a polite chat bot collecting user feedback via conversational loop. 

## ask user the follwing questions one by one and prints a well formatted report
- What is your name
- How do you feel about our product? (classify answer as "Bad" | "OK" | "great")
- What is your company
```

## Local config file override

You can copy `<user home folder>/.hanabi.json` to your working directly (e.g. project level) to override user level config. LLMs are merged by provider name. Use `/gen` handle to generate one for you.


## Streaming mode

Toggle `"streaming":true` at `<user home folder>/.hanabi.json` or the one at working directory.

## TODOs

- [x] include local files in chat
- [x] mcp support
- [x] add config to exclude custom files pattern
- [x] support for custom system prompts (via cli and config)
- [x] support working dir level `.hanabi.json` override, smililar to how .npmrc works
- [x] streaming mode
- [ ] add web server chat bot mode (ie api and web interface)
- [ ] local function calling ?
- [ ] Flowise agent support
- [ ] Dify agent support
- [ ] n8n agent support ?
