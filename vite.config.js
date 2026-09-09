import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const proxyConfig = {
  target: "http://127.0.0.1:8000",
  changeOrigin: true,
  secure: false,
  bypass: (req) => {
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return req.url;
    }
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "^/auth($|/)": proxyConfig,
      "/admin": proxyConfig,
      "/upload": proxyConfig,
      "/products": proxyConfig,
      "/cart": proxyConfig,
      "/users": proxyConfig,
      "/departments": proxyConfig,
      "/categories": proxyConfig,
      "/subcategories": proxyConfig,
      "/brands": proxyConfig,
      "/attributes": proxyConfig,
      "/attribute-options": proxyConfig,
      "/orders": proxyConfig,
      "/coupons": proxyConfig,
      "/reviews": proxyConfig,
      "/wishlist": proxyConfig,
      "/dashboard": proxyConfig,
      "/addresses": proxyConfig,
      "/return-requests": proxyConfig,
      "/tickets": proxyConfig,
      "/notifications": proxyConfig,
    },
  },
});
