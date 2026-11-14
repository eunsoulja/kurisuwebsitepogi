import { defineConfig } from "vite";
import obfuscatorPlugin from "vite-plugin-javascript-obfuscator";

export default defineConfig({
  build: {
    target: "es2020",
    // Vite/esbuild handles minification; we keep it on for whitespace/comment stripping
    // and syntax-level size reduction before obfuscation runs.
    minify: "esbuild",
    sourcemap: false,
    cssCodeSplit: false,
    assetsInlineLimit: 0,
  },
  plugins: [
    obfuscatorPlugin({
      include: ["src/**/*.ts", "src/**/*.js"],
      exclude: [/node_modules/],
      apply: "build",
      debugger: false,
      options: {
        // Single compact line output; no readability gain from whitespace.
        compact: true,
        // Rename local identifiers to short mangled names. Biggest readability hit.
        renameGlobals: false,
        identifierNamesGenerator: "hexadecimal",
        // Move string literals into a rotated array and decode via base64 lookups,
        // so text/URLs/class tokens are not greppable in plain form.
        stringArray: true,
        stringArrayEncoding: ["base64"],
        stringArrayThreshold: 0.75,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 1,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 2,
        // Flatten numbers to expressions (e.g. 1500 -> 0x5dc-ish forms) to reduce constants scanning.
        numbersToExpressions: true,
        simplify: true,
        // OFF per requirements / runtime cost: control-flow flattening is expensive on hot paths.
        controlFlowFlattening: false,
        // OFF: inflates bundle and can add work per frame.
        deadCodeInjection: false,
        // OFF: can break debugging and may interfere with some environments.
        selfDefending: false,
        debugProtection: false,
        debugProtectionInterval: 0,
        disableConsoleOutput: false,
        // Keep object keys untouched: dynamic DOM/CSS/style property access relies on real names.
        renameProperties: false,
        // Avoid breaking ESM/top-level semantics and URL-like strings beyond array encoding.
        transformObjectKeys: false,
        unicodeEscapeSequence: false,
        splitStrings: false,
        target: "browser",
      },
    }),
  ],
});
