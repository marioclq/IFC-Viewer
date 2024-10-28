import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */

const nextConfig = {
  webpack: (config:any) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
}
module.exports = nextConfig

export default nextConfig;
