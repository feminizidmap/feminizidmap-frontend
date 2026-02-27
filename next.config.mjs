const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["localhost"]
  },
};

// basePath is injected by the configure-pages GitHub Action for GitHub Pages deploys.
// Expose it so client components can prefix asset URLs (e.g. PMTiles).
nextConfig.env = {
  NEXT_PUBLIC_BASE_PATH: nextConfig.basePath || '',
};

export default nextConfig;
