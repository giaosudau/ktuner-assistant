/** @type {import('next').NextConfig} */
const nextConfig = {
  // A static site in web/out: the server serves it, so the chat and API share one origin.
  output: "export",
  reactStrictMode: true,
  // The chat reads the server on another port during local runs; without this a
  // future Next major would start refusing those dev requests.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // The dev badge sits on the composer's attach button on a phone.
  devIndicators: false,
};

export default nextConfig;