import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  images: supabaseHostname
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ],
      }
    : undefined,
  async redirects() {
    return [
      { source: "/archivo", destination: "/archive", permanent: true },
      { source: "/auth/login", destination: "/login", permanent: true },
      { source: "/auth/registro", destination: "/login", permanent: true },
      { source: "/historial", destination: "/dashboard", permanent: true },
      { source: "/favoritos", destination: "/dashboard", permanent: true },
      { source: "/teorias", destination: "/archive", permanent: true },
    ];
  },
};

export default nextConfig;
