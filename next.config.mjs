/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 为了安全性，默认禁止加载外部域名的图片
  images: {
    domains: ["images.unsplash.com", "img.clerk.com", "ik.imagekit.io"],
  }
};

export default nextConfig;
