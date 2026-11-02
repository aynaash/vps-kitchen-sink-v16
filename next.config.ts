import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  reactCompiler: true,
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
