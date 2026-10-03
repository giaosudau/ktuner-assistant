/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The chat reads the server on another port during local runs; without this a
  // future Next major would start refusing those dev requests.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // The dev badge sits on the composer's attach button on a phone.
  devIndicators: false,
};

export default nextConfig;