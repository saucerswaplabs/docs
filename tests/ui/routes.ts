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
  { name: 'orderbook-orders', path: '/api-reference/orderbook/orders', heading: 'Orderbook API orders' },
  { name: 'roadmap', path: '/roadmap', heading: 'Roadmap' },
];
