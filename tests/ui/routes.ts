export type UiRoute = {
  name: string;
  path: string;
  heading: string;
};

export const uiRoutes: UiRoute[] = [
  { name: 'tokenomics', path: '/tokenomics/overview', heading: 'SAUCE tokenomics' },
  { name: 'routing', path: '/protocol/routing', heading: 'Swap routing' },
  { name: 'farm-weights', path: '/protocol/saucerswap-v1/farm-weights', heading: 'Farm weights' },
  { name: 'lari-weights', path: '/protocol/saucerswap-v2/lari-weights', heading: 'LARI weights' },
  { name: 'v3', path: '/protocol/saucerswap-v3', heading: 'SaucerSwap V3' },
  { name: 'v3-fees', path: '/protocol/saucerswap-v3/fees', heading: 'V3 fees and rebates' },
  { name: 'staking', path: '/protocol/single-sided-staking', heading: 'Single-sided staking' },
  { name: 'governance', path: '/governance/overview', heading: 'SaucerSwap governance' },
  { name: 'dao-reporting', path: '/governance/dao-reporting', heading: 'DAO reporting' },
  { name: 'wallet', path: '/get-started/wallet', heading: 'Create a Hedera wallet' },
  { name: 'contracts', path: '/developers/contracts', heading: 'Contract deployments' },
  { name: 'for-projects', path: '/resources/for-projects', heading: 'For projects: list your token' },
  { name: 'v2-pool', path: '/api-reference/rest/pools-v2/get-v2-pool', heading: 'REST API: Get V2 pool by id' },
  { name: 'v2-pools-compact', path: '/api-reference/rest/pools-v2/list-v2-pools', heading: 'REST API: List V2 pools (compact)' },
  { name: 'v2-pools-detailed', path: '/api-reference/rest/pools-v2/list-v2-pools-full', heading: 'REST API: List V2 pools (detailed)' },
  { name: 'v2-positions', path: '/api-reference/rest/pools-v2/v2-positions-by-account', heading: 'REST API: V2 liquidity positions by account' },
  { name: 'orderbook-market-data', path: '/api-reference/orderbook/market-data', heading: 'Orderbook API market data' },
  { name: 'orderbook-orders', path: '/api-reference/orderbook/orders', heading: 'Orderbook API orders' },
  { name: 'changelog', path: '/changelog', heading: 'Changelog' },
  { name: 'roadmap', path: '/roadmap', heading: 'Roadmap' },
];
