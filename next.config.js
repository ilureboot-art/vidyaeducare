
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // This is required to make environment variables available in the browser.
  // Note: Only variables prefixed with NEXT_PUBLIC_ will be exposed.
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyCE1-2IqXXp7yBXZ2nu9igTx6f8YDw_N70",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "vidyaeducare.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "vidyaeducare",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "vidyaeducare.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "759861893307",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:759861893307:web:a3b03e98bee85418c6b19e",
  }
};

module.exports = nextConfig;
