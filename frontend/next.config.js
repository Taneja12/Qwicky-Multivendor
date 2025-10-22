/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: We removed the global `/api/:path*` rewrite because it proxied
  // Next.js API routes (including NextAuth at /api/auth/*) to the Django
  // backend. That caused 404s like `/api/auth/error` hitting Django.
  // Use `NEXT_PUBLIC_API_URL` (absolute URL) in the frontend API client
  // to call the Django backend instead of relying on rewrites.
  images: {
    domains: ['127.0.0.1', 'res.cloudinary.com', 'images.unsplash.com'],
  },
}

module.exports = nextConfig