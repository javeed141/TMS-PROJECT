import   * as path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { transformSync } from "esbuild"
import { fileURLToPath } from "url"
import * as fs from "fs"
import * as os from "os"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // process JSX inside plain `.js` files too
      include: ["src/**/*.{js,jsx,ts,tsx}"]
    }),
    tailwindcss(),
    // Pre-transform `.js` files that contain JSX so Rollup sees valid JS.
    // This avoids renaming files while ensuring `.js` with JSX builds on Vercel.
    // We use a lightweight esbuild transform here.
    {
      name: "pre-transform-jsx-js",
      enforce: "pre",
      transform(code, id) {
        if (!id.endsWith('.js')) return null
        // Only transform files inside the `src` directory (simple path check)
        if (!id.includes(`${path.sep}src${path.sep}`) && !id.includes('/src/')) return null
        // Quick heuristic: skip if no JSX-like characters
        if (!/[<>]/.test(code)) return null
        const res = transformSync(code, { loader: 'jsx', jsx: 'automatic', sourcemap: false })
        return { code: res.code, map: res.map ? JSON.parse(res.map) : null }
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})