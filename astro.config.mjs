import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://multimind.dev",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr", "nl"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", fr: "fr", nl: "nl" },
      },
    }),
  ],
});
