/** @type {import('next').NextConfig} */
const nextConfig = {
  // Web 版需要 Route Handler 服务端运行时，禁止静态导出（output: 'export'）
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    '@milkdown/core',
    '@milkdown/kit',
    '@milkdown/react',
    '@milkdown/theme-nord',
    '@milkdown/plugin-listener',
    '@milkdown/plugin-history',
    '@milkdown/plugin-clipboard',
    '@milkdown/preset-commonmark',
    '@milkdown/ctx',
    '@milkdown/prose',
    '@milkdown/transformer',
    '@milkdown/utils',
    '@milkdown/exception',
  ],
}

module.exports = nextConfig
