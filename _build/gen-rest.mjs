#!/usr/bin/env node
// Generates one MDX page per REST API operation from openapi.yml.
// No YAML library needed: the spec is regular enough to extract
// `paths` keys and their HTTP methods with line scanning. Every
// operation must have an entry in OPS below; the script fails loudly
// on any mismatch in either direction, so spec/page drift is impossible.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = join(ROOT, 'openapi.yml');
const OUT = join(ROOT, 'api-reference', 'rest');

// ---------------------------------------------------------------------------
// Operation map: spec path -> { group, slug, title, description }
// Titles are unique and qualified. Descriptions are 140-160 chars (enforced).
// Reading order below = nav order within each group.
// ---------------------------------------------------------------------------
const OPS = [
  // --- stats ---
  ['/stats', 'stats', 'general-stats', 'REST API: General statistics',
    'Retrieve protocol-wide SaucerSwap statistics in one call: circulating SAUCE supply, total swap count, TVL in tinybar and USD, and all-time volume.'],
  ['/stats/sss', 'stats', 'sss-stats', 'REST API: Single-sided staking statistics',
    'Retrieve single-sided staking statistics: the current xSAUCE to SAUCE ratio, 5-day average APR, and staked SAUCE and xSAUCE amounts in smallest units.'],
  ['/stats/hbarHistoricalPrices', 'stats', 'hbar-historical-prices', 'REST API: Historical HBAR prices',
    'Query minutely historical HBAR prices in USD between two unix-second timestamps, for charting, backtesting, and converting tinybar values to dollars.'],
  ['/stats/platformData', 'stats', 'platform-data', 'REST API: Platform liquidity and volume history',
    'Query historical platform-wide liquidity or volume in tinybar over hourly, daily, or weekly intervals between two unix-second timestamps you choose.'],

  // --- tokens ---
  ['/tokens', 'tokens', 'list-tokens', 'REST API: List all tokens (compact)',
    'List every token traded on SaucerSwap in compact form: token id, symbol, decimals, icon path, price in tinybar and USD, and due-diligence flags.'],
  ['/tokens/full', 'tokens', 'list-tokens-full', 'REST API: List all tokens (detailed)',
    'List every token traded on SaucerSwap with full detail per token: description, website, X handle, sentinel report link, prices, and decimal places.'],
  ['/tokens/{tokenId}', 'tokens', 'get-token', 'REST API: Get token by id',
    'Retrieve detailed data for one token by Hedera token id, including price in tinybar and USD, decimals, description, website, and due-diligence flags.'],
  ['/tokens/known', 'tokens', 'default-listed-tokens', 'REST API: Default listed tokens',
    'List default listed tokens, the tokens that have completed SaucerSwap due diligence, with full metadata, prices in tinybar and USD, and decimals.'],
  ['/tokens/default', 'tokens', 'default-token-price-changes', 'REST API: Price changes for default listed tokens',
    'Retrieve hourly, daily, and weekly price change percentages plus USD price and liquidity for every default listed token on SaucerSwap in one call.'],
  ['/tokens/price-change', 'tokens', 'price-change-map', 'REST API: 24-hour price change map',
    'Retrieve a mapping from Hedera token id to 24-hour price change percentage for tokens on SaucerSwap, suited to fast dashboard and ticker updates.'],
  ['/tokens/daily', 'tokens', 'all-tokens-daily', 'REST API: Daily metrics for all tokens',
    "Retrieve daily price, volume, and liquidity datapoints for all SaucerSwap tokens, with prices in tinybar and amounts in each token's smallest unit."],
  ['/tokens/weekly', 'tokens', 'all-tokens-weekly', 'REST API: Weekly metrics for all tokens',
    "Retrieve weekly price, volume, and liquidity datapoints for all SaucerSwap tokens, with prices in tinybar and amounts in each token's smallest unit."],
  ['/tokens/monthly', 'tokens', 'all-tokens-monthly', 'REST API: Monthly metrics for all tokens',
    "Retrieve monthly price, volume, and liquidity datapoints for all SaucerSwap tokens, prices in tinybar and amounts in each token's smallest unit."],
  ['/tokens/yearly', 'tokens', 'all-tokens-yearly', 'REST API: Yearly metrics for all tokens',
    "Retrieve yearly price, volume, and liquidity datapoints for all SaucerSwap tokens, with prices in tinybar and amounts in each token's smallest unit."],
  ['/tokens/daily/{tokenId}', 'tokens', 'token-daily', 'REST API: Daily metrics for a token',
    'Retrieve daily price, volume, and liquidity history for a single token by Hedera token id, with prices in tinybar and unix-second timestamps.'],
  ['/tokens/weekly/{tokenId}', 'tokens', 'token-weekly', 'REST API: Weekly metrics for a token',
    'Retrieve weekly price, volume, and liquidity history for a single token by Hedera token id, with prices in tinybar and unix-second timestamps.'],
  ['/tokens/monthly/{tokenId}', 'tokens', 'token-monthly', 'REST API: Monthly metrics for a token',
    'Retrieve monthly price, volume, and liquidity history for a single token by Hedera token id, with prices in tinybar and unix-second timestamps.'],
  ['/tokens/yearly/{tokenId}', 'tokens', 'token-yearly', 'REST API: Yearly metrics for a token',
    'Retrieve yearly price, volume, and liquidity history for a single token by Hedera token id, with prices in tinybar and unix-second timestamps.'],
  ['/tokens/associated-pools/{tokenId}', 'tokens', 'associated-pools', 'REST API: Pools containing a token',
    'List every SaucerSwap V1 pool that contains a given token, with pool contract ids, paired-token metadata, current reserves, and LP token details.'],
  ['/tokens/prices/{tokenId}', 'tokens', 'token-price-history', 'REST API: Token price history (candlesticks)',
    'Query historical OHLCV candlestick data for a token between two unix-second timestamps at five-minute, hourly, daily, or weekly interval sizes.'],
  ['/tokens/prices/latest/{tokenId}', 'tokens', 'token-price-latest', 'REST API: Latest token candlestick',
    'Retrieve the most recent OHLCV candlestick for a token at a chosen interval, with open, high, low, close, and average prices in tinybar and USD.'],
  ['/tokens/ohlcv/latest', 'tokens', 'ohlcv-latest', 'REST API: Latest candlesticks for all tokens',
    'Retrieve the latest OHLCV candlestick for every SaucerSwap token in one call at a chosen interval, the bulk endpoint for price and chart refreshes.'],

  // --- pools-v1 ---
  ['/pools', 'pools-v1', 'list-pools', 'REST API: List V1 pools (compact)',
    'List all SaucerSwap V1 liquidity pools in compact form, with pool and contract ids, paired token summaries, current reserves, and LP token metadata.'],
  ['/pools/full', 'pools-v1', 'list-pools-full', 'REST API: List V1 pools (detailed)',
    'List all SaucerSwap V1 liquidity pools with full token detail, including descriptions, websites, prices in tinybar and USD, and current reserves.'],
  ['/pools/{poolId}', 'pools-v1', 'get-pool', 'REST API: Get V1 pool by id',
    'Retrieve detailed data for one SaucerSwap V1 pool by pool id, including contract id, paired token metadata, current reserves, and LP token details.'],
  ['/pools/known', 'pools-v1', 'default-listed-pools', 'REST API: Default listed V1 pools',
    'List default listed SaucerSwap V1 pools, the pools whose tokens completed due diligence, with contract ids, token metadata, and current reserves.'],
  ['/pools/daily', 'pools-v1', 'all-pools-daily', 'REST API: Daily metrics for all V1 pools',
    "Retrieve daily volume and liquidity datapoints for all SaucerSwap V1 pools, in each pool's smallest unit, keyed by pool id and unix timestamp."],
  ['/pools/weekly', 'pools-v1', 'all-pools-weekly', 'REST API: Weekly metrics for all V1 pools',
    "Retrieve weekly volume and liquidity datapoints for all SaucerSwap V1 pools, in each pool's smallest unit, keyed by pool id and unix timestamp."],
  ['/pools/monthly', 'pools-v1', 'all-pools-monthly', 'REST API: Monthly metrics for all V1 pools',
    "Retrieve monthly volume and liquidity datapoints for all SaucerSwap V1 pools, in each pool's smallest unit, keyed by pool id and unix timestamp."],
  ['/pools/yearly', 'pools-v1', 'all-pools-yearly', 'REST API: Yearly metrics for all V1 pools',
    "Retrieve yearly volume and liquidity datapoints for all SaucerSwap V1 pools, in each pool's smallest unit, keyed by pool id and unix timestamp."],
  ['/pools/daily/{poolId}', 'pools-v1', 'pool-daily', 'REST API: Daily metrics for a V1 pool',
    'Retrieve daily volume and liquidity history for a single SaucerSwap V1 pool by pool id, in smallest units, with unix-second timestamps per point.'],
  ['/pools/weekly/{poolId}', 'pools-v1', 'pool-weekly', 'REST API: Weekly metrics for a V1 pool',
    'Retrieve weekly volume and liquidity history for a single SaucerSwap V1 pool by pool id, in smallest units, with unix-second timestamps per point.'],
  ['/pools/monthly/{poolId}', 'pools-v1', 'pool-monthly', 'REST API: Monthly metrics for a V1 pool',
    'Retrieve monthly volume and liquidity history for a single SaucerSwap V1 pool by pool id, in smallest units, with unix-second timestamps per point.'],
  ['/pools/yearly/{poolId}', 'pools-v1', 'pool-yearly', 'REST API: Yearly metrics for a V1 pool',
    'Retrieve yearly volume and liquidity history for a single SaucerSwap V1 pool by pool id, in smallest units, with unix-second timestamps per point.'],
  ['/pools/conversionRates/{poolId}', 'pools-v1', 'pool-conversion-rates', 'REST API: V1 pool price history (candlesticks)',
    'Query historical candlestick conversion rates for a V1 pool between two unix-second timestamps, with optional pair inversion and four interval sizes.'],
  ['/pools/conversionRates/latest/{poolId}', 'pools-v1', 'pool-conversion-rates-latest', 'REST API: Latest V1 pool candlestick',
    'Retrieve the latest candlestick conversion rate for a V1 pool at a chosen interval, with open, high, low, close, volume, and liquidity fields.'],

  // --- pools-v2 ---
  ['/v2/pools', 'pools-v2', 'list-v2-pools', 'REST API: List V2 pools (compact)',
    'List all SaucerSwap V2 concentrated-liquidity pools in compact form, with fee tier, current tick, sqrt price ratio, liquidity, and token amounts.'],
  ['/v2/pools/full', 'pools-v2', 'list-v2-pools-full', 'REST API: List V2 pools (detailed)',
    'List all SaucerSwap V2 concentrated-liquidity pools with full token metadata alongside fee tier, current tick, sqrt price ratio, and liquidity.'],
  ['/v2/pools/{poolId}', 'pools-v2', 'get-v2-pool', 'REST API: Get V2 pool by id',
    'Retrieve one SaucerSwap V2 pool by pool id, including contract id, token pair detail, fee tier, current tick, sqrt price ratio, and liquidity.'],
  ['/v2/pools/conversionRates/{poolId}', 'pools-v2', 'v2-pool-conversion-rates', 'REST API: V2 pool price history (candlesticks)',
    'Query historical candlestick conversion rates for a SaucerSwap V2 pool between two unix-second timestamps, with optional inversion of the pair.'],
  ['/v2/nfts/{accountId}/positions', 'pools-v2', 'v2-positions-by-account', 'REST API: V2 liquidity positions by account',
    'List all SaucerSwap V2 liquidity positions for a Hedera account, with NFT serials, tick ranges, liquidity, fee growth, and tokens owed per position.'],
  ['/v2/rewards/account/{accountId}', 'pools-v2', 'lari-rewards-by-account', 'REST API: LARI rewards by account',
    'Retrieve estimated LARI rewards accrued by a Hedera account for the current epoch, updated hourly, with pool id, token id, and an epoch-final flag.'],

  // --- farms ---
  ['/farms', 'farms', 'list-farms', 'REST API: List active farms',
    'List all active SaucerSwap yield farms with farm and pool ids, SAUCE and HBAR emission rates per second, and total staked LP token amounts per farm.'],
  ['/farms/totals/{accountId}', 'farms', 'farm-totals-by-account', 'REST API: Farm LP totals by account',
    'Retrieve the LP token amounts a Hedera account has staked in each SaucerSwap farm, with farm id, pool id, and the timestamp of the latest update.'],
];

// ---------------------------------------------------------------------------
// Parse the spec: collect { path -> method } from the paths block.
// ---------------------------------------------------------------------------
const lines = readFileSync(SPEC, 'utf8').split('\n');
const specOps = new Map();
let inPaths = false;
let currentPath = null;
for (const line of lines) {
  if (/^paths:\s*$/.test(line)) { inPaths = true; continue; }
  if (inPaths && /^\S/.test(line)) { inPaths = false; }
  if (!inPaths) continue;
  const p = line.match(/^ {2}(\/\S+):\s*$/);
  if (p) { currentPath = p[1]; continue; }
  const m = line.match(/^ {4}(get|post|put|patch|delete):\s*$/);
  if (m && currentPath) specOps.set(currentPath, m[1].toUpperCase());
}

// ---------------------------------------------------------------------------
// Validate both directions + description lengths.
// ---------------------------------------------------------------------------
const errors = [];
const mapped = new Set(OPS.map((o) => o[0]));
for (const p of specOps.keys()) if (!mapped.has(p)) errors.push(`spec path not mapped: ${p}`);
for (const [p] of OPS) if (!specOps.has(p)) errors.push(`mapped path not in spec: ${p}`);
const slugs = new Set();
const titles = new Set();
for (const [p, group, slug, title, desc] of OPS) {
  const key = `${group}/${slug}`;
  if (slugs.has(key)) errors.push(`duplicate slug: ${key}`);
  slugs.add(key);
  if (titles.has(title)) errors.push(`duplicate title: ${title}`);
  titles.add(title);
  if (desc.length < 140 || desc.length > 160) {
    errors.push(`description length ${desc.length} (need 140-160) for ${p}`);
  }
}
if (!specOps.has('/tokens/ohlcv/latest')) errors.push('GET /tokens/ohlcv/latest missing from spec');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Emit MDX files + nav mapping.
// ---------------------------------------------------------------------------
const nav = { stats: [], tokens: [], 'pools-v1': [], 'pools-v2': [], farms: [] };
for (const [p, group, slug, title, desc] of OPS) {
  const method = specOps.get(p);
  const mdx = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(desc)}\nopenapi: ${JSON.stringify(`${method} ${p}`)}\n---\n`;
  mkdirSync(join(OUT, group), { recursive: true });
  writeFileSync(join(OUT, group, `${slug}.mdx`), mdx);
  nav[group].push(`api-reference/rest/${group}/${slug}`);
}
writeFileSync(join(ROOT, '_build', 'REST-NAV.json'), JSON.stringify(nav, null, 2) + '\n');

console.log(`spec operations: ${specOps.size}`);
console.log(`pages written:   ${OPS.length}`);
console.log(`ohlcv/latest:    ${specOps.has('/tokens/ohlcv/latest') ? 'present' : 'MISSING'}`);
