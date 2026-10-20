import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    server: {
        port: 8080,
        host: true,
    },
    plugins: [
        tsConfigPaths({ projects: ["./tsconfig.json"] }),
        viteReact(),
        tailwindcss(),
    ],
});