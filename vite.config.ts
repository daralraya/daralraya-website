import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import netlify from "@netlify/vite-plugin-tanstack-start";

export default defineConfig({
  plugins: [netlify()],
  nitro: { preset: "netlify" },
  tanstackStart: {
    server: { entry: "server" },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: [
      "4182-iz9r38dzrb48t70e13imb-df6483a7.sg1.manus.computer",
      "4181-iz9r38dzrb48t70e13imb-df6483a7.sg1.manus.computer",
      ".manus.computer",
      "localhost",
      "127.0.0.1",
      "169.254.0.21"
    ],
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: [
      "4182-iz9r38dzrb48t70e13imb-df6483a7.sg1.manus.computer",
      "4181-iz9r38dzrb48t70e13imb-df6483a7.sg1.manus.computer",
      ".manus.computer",
      "localhost",
      "127.0.0.1",
      "169.254.0.21"
    ],
  },
});
