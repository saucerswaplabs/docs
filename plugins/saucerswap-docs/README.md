# SaucerSwap docs Agent Plugin

Experimental [Agent Plugins 1.0.0](https://agent-plugins.org/) bundle for the public SaucerSwap documentation MCP server. This directory is the plugin root; keep `plugin.json` and `mcp.json` together. There is no build step, local server, or bundled executable.

## Install

1. Download this directory, or copy it from a clone of [the docs repository](https://github.com/saucerswaplabs/docs).
2. Inspect both JSON files, then use your client's Agent Plugins installation flow to load this directory. The client must support Agent Plugins 1.0.0 MCP components and the `streamable-http` transport.
3. Enable the `saucerswap-docs` server and ask your agent: "Search the SaucerSwap docs for token association requirements and cite the relevant pages."

Installation and permissions are client-specific; the standard does not define a universal install command. See the [compatible clients directory](https://agent-plugins.org/compatible-clients). If your client does not support this format or transport, use the [direct MCP setup instructions](https://docs.saucerswap.finance/developers/ai#direct-mcp-setup) instead. Avoid enabling the same endpoint twice.

## Connection and permissions

- Endpoint: `https://docs.saucerswap.finance/mcp` over Streamable HTTP.
- No wallet connection or SaucerSwap REST API key is required.
- The hosted server provides documentation search and retrieval, plus a tool for submitting documentation feedback. Review your client's tool permissions before enabling it.
- Queries and submitted feedback go to the hosted documentation service. Do not include private keys, API keys, or other secrets.

The bundle configures a connection to the live service; it does not include a frozen copy of the docs or server tools. The `0.1.0` package version is separate from the `1.0.0` Agent Plugins schema version.

## Validate

Validate `plugin.json` and `mcp.json` with a JSON Schema Draft 2020-12 validator against the official [manifest schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json) and [MCP schema](https://agent-plugins.org/schemas/1.0.0/mcp.schema.json), respectively. The [specification](https://agent-plugins.org/specification) also defines semantic requirements beyond those schemas.
