# mcp-pombase

PomBase MCP — the fission yeast (Schizosaccharomyces pombe) model-organism database.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_gene` | PomBase (fission yeast / S. pombe model-organism DB): look up a gene by its PomBase systematic id and return its product, protein domains (InterPro), deletion viability, UniProt id, and curation status. Keyless. NOTE: requires a systematic id like "SPAC1002.01" or "SPBC2F12.13" — standard gene names like "cdc2" are NOT resolved by this API. Complements SGD (budding yeast). |
| `get_reference` | PomBase: look up a curated S. pombe publication by its PubMed id (e.g. "PMID:11739790") and return its title, citation, authors, year, abstract, and how many genes it annotates. Keyless. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "pombase": {
      "url": "https://gateway.pipeworx.io/pombase/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Pombase data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
