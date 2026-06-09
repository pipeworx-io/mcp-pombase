interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * PomBase MCP — the fission yeast (Schizosaccharomyces pombe) model-organism database.
 *
 * Keyless JSON API. Look up a gene by its PomBase systematic id and get its
 * product, protein domains (InterPro), deletion viability, UniProt id, and
 * curation status; or look up a curated publication by PubMed id.
 * Complements SGD (budding yeast).
 *
 * Base: https://www.pombase.org/api/v1/dataset/latest
 */


const BASE = 'https://www.pombase.org/api/v1/dataset/latest';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'get_gene',
    description:
      'PomBase (fission yeast / S. pombe model-organism DB): look up a gene by its PomBase systematic id and return its product, protein domains (InterPro), deletion viability, UniProt id, and curation status. Keyless. NOTE: requires a systematic id like "SPAC1002.01" or "SPBC2F12.13" — standard gene names like "cdc2" are NOT resolved by this API. Complements SGD (budding yeast).',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'A PomBase systematic id, e.g. "SPAC1002.01" or "SPBC2F12.13". Standard names ("cdc2") are not accepted.',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_reference',
    description:
      'PomBase: look up a curated S. pombe publication by its PubMed id (e.g. "PMID:11739790") and return its title, citation, authors, year, abstract, and how many genes it annotates. Keyless.',
    inputSchema: {
      type: 'object',
      properties: {
        pmid: {
          type: 'string',
          description: 'A PubMed id, with or without the "PMID:" prefix, e.g. "PMID:11739790" or "11739790".',
        },
      },
      required: ['pmid'],
    },
  },
];

interface InterProMatch {
  interpro_id?: string;
  interpro_description?: string;
  id?: string;
  description?: string;
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'get_gene':
        return await getGene(args);
      case 'get_reference':
        return await getReference(args);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function getGene(args: Record<string, unknown>): Promise<unknown> {
  const id = reqStr(args, 'id');
  const res = await pombaseGet(`/data/gene/${encodeURIComponent(id)}`);
  if (res.status === 404 || res.status === 410) return { error: 'gene not found', id };
  if (!res.ok) return { error: `PomBase: ${res.status} ${(await res.text()).slice(0, 200)}` };

  const gene = (await res.json()) as Record<string, unknown> | null;
  if (!gene || typeof gene !== 'object') return { error: 'gene not found', id };

  const matches = Array.isArray(gene.interpro_matches) ? (gene.interpro_matches as InterProMatch[]) : [];
  const tmCoords = Array.isArray(gene.tm_domain_coords) ? gene.tm_domain_coords : [];

  return {
    systematic_id: gene.uniquename ?? null,
    name: gene.name ?? null,
    product: gene.product ?? null,
    taxonid: gene.taxonid ?? null,
    feature_type: gene.feature_type ?? null,
    characterisation_status: gene.characterisation_status ?? null,
    deletion_viability: gene.deletion_viability ?? null,
    uniprot: gene.uniprot_identifier ?? null,
    interpro: matches.map((m) => ({
      id: m.interpro_id ?? m.id ?? null,
      description: m.interpro_description ?? m.description ?? null,
    })),
    tm_domains: tmCoords.length,
  };
}

async function getReference(args: Record<string, unknown>): Promise<unknown> {
  let pmid = reqStr(args, 'pmid').trim();
  if (!/^PMID:/i.test(pmid)) pmid = `PMID:${pmid.replace(/^PMID:?/i, '')}`;

  const res = await pombaseGet(`/data/reference/${encodeURIComponent(pmid)}`);
  if (res.status === 404 || res.status === 410) return { error: 'reference not found', pmid };
  if (!res.ok) return { error: `PomBase: ${res.status} ${(await res.text()).slice(0, 200)}` };

  const ref = (await res.json()) as Record<string, unknown> | null;
  if (!ref || typeof ref !== 'object') return { error: 'reference not found', pmid };

  return {
    pmid: ref.uniquename ?? pmid,
    title: ref.title ?? null,
    citation: ref.citation ?? null,
    authors: ref.authors ?? null,
    authors_abbrev: ref.authors_abbrev ?? null,
    publication_year: ref.publication_year ?? null,
    abstract: ref.abstract ?? null,
    curated_gene_count: ref.gene_count ?? null,
  };
}

async function pombaseGet(path: string): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
}

function reqStr(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
