import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createApi, setTrpcRouter } from "./api";
import { appRouter } from "../routers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Wire up the tRPC router before the API middleware is used.
setTrpcRouter(appRouter);

const app: express.Express = createApi();

// ---- Static SPA + fallback ----
const distPublic = path.resolve(__dirname, "dist/public");
app.use(express.static(distPublic));

app.get("*", (_req, res) => {
  // Let /api/* routes short-circuit before the SPA fallback.
  try {
    res.sendFile(path.resolve(distPublic, "index.html"));
  } catch (_) {
    res.status(404).send("Not found");
  }
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`API base: /api`);
});

