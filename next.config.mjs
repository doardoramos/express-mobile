/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  // Todas as páginas aqui são client components que precisam fazer requests ao Supabase
  // Disable static export para essas rotas
  experimental: {
    dynamicIO: true,
  },
};

export default nextConfig;

