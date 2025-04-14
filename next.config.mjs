const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
    dangerouslyAllowSVG: true,
  },
  // Ensure that Next.js handles Firebase client-side imports correctly
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
