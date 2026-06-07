import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    server: {
        port: 8080,
        host: true,
    },
    plugins: [
        tsConfigPaths({ projects: ["./tsconfig.json"] }),
        tanstackStart({
            importProtection: {
                behavior: "error",
                client: {
                    files: ["**/server/**"],
                    specifiers: ["server-only"],
                },
            },
            router: {
                generatedRouteTree: "../.tanstack/routeTree.gen.js",
                disableTypes: true,
                routeTreeFileFooter: [],
            },
            server: { entry: "server" },
        }),
        viteReact(),
        tailwindcss(),
    ],
});
