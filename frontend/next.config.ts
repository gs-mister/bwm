import type { NextConfig } from "next";

const urlPrefix = process.env.NEXT_PUBLIC_SUB_PATH || '';

const nextConfig: NextConfig = {

  // 静的出力(サーバー不使用)
  output: 'export',
  
  // basePathの変更
  basePath: urlPrefix,

  // 画像最適化を無効
  images: { unoptimized: true, },
};

export default nextConfig;
