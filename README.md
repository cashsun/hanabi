# hanabi-cli

> ⟡ A terminal AI chat interface for any LLM model, with file context, MCP and deployment support.

- Local multi skilled agent with files, clipboard & MCP support
- Project folder scoped - different agent per project
- Host your agent web chat UI (Next.js) from command line in seconds and ready for deployment

## Command line interface

![Chat demo](screenshots/Screenshot1.png)

## Web Chat UI
![Web Chat UI](screenshots/WebUI.png)


## Table of Contents

- [Install](#install)
- [CLI](#cli)
- [MCP Servers](#mcp-servers)
- [Exclude files](#exclude-files)
- [Local envs](#local-envs)
- [Custom System Prompt](#custom-system-prompt)
- [Local config file override](#local-config-file-override)
- [Streaming Mode](#streaming-mode)
- [Web Chat UI](#web-chat-ui)
- [TODOs](#todos)


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

```
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
		// npx stdio approach is flaky & slow. highly recommend 
		// to npm install -g <mcp-server> and use the following. 
		// see https://github.com/modelcontextprotocol/servers/issues/64
        // "file-system": {
        // 	"name": "file system",
        // 	"transport": "stdio",
        // 	"command": "path/to/your/node.exe",
        // 	"args": [
		// "path/to/global/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js", "."]
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

```
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

## Local Envs

Hanabi supports local dot env files (`.env`). 
You can also add `envs` field to `.hanabi.json`.
use `file://` prefix URL to inject file content as env variable
Supports only plain text files e.g. `*.json`,`*.txt`, `*.html` etc.
To inject PDF file content into process.env, convert them to text files by using something like `pdf2json`.

```
// .hanabi.json
{
	"envs": { "FOO": "bar", "MY_DOC: "file://./README.md" },
	"llms": [
		// ...
	],
	"defaultModel": {
		// ...
	}
}
```

## Custom System Prompt

Hanabi comes with predefined simple system prompt to show docs on terminal commands and provide date & timezone context. You can provide extra system prompt in `hanabi.system.prompt.md` at working directory. Use `/gen` handle or `hanabi gen` to generate one for you.

Variables are supported via `${VAR_NAME}` syntax, they are read from process.env. see [Local envs](#local-envs).

example `hanabi.system.prompt.md`
```markdown
# act as a polite chat bot collecting user feedback via conversational loop. 

## context
Product name is ${PRODUCT_NAME}

## ask user the follwing questions one by one and prints a well formatted report
- What is your name
- How do you feel about our product? (classify answer as "Bad" | "OK" | "great")
- What is your company
```

## Local config file override

You can copy `<user home folder>/.hanabi.json` to your working directly (e.g. project level) to override user level config. LLMs are merged by provider name. Use `/gen` or `hanabi gen` handle to generate one for you.


## Streaming mode

Toggle `"streaming":true` at `<user home folder>/.hanabi.json` or the one at working directory.

## Web Chat UI

**It's recommended to create a local `.hanabi.json` for independent chat server**

In Hanabi cli, use `/serve` to start the web server with current context (MCPs & system prompt). This will save `serve` config to your `.hanabi.json`.

Use `hanabi serve` to start the web UI server directly - useful for deployments.

```
// .hanabi.json
{
	"serve": {
 		"mcpKeys": ["home-ai"],
    	"port": 3041
	},
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
- [x] support for custom system prompt (via local .md file)
- [x] support working dir level `.hanabi.json` override, smililar to how .npmrc works
- [x] streaming mode
- [x] add web server chat bot mode (ie api and web interface)
- [ ] improve web server mode (API keys, UX improvements, Update UI mode readme)
- ~~[ ] local function calling ?~~ Use [FaskMCP](https://github.com/punkpeye/fastmcp) instead.
