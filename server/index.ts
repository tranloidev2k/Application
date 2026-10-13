import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createServer } from "node:http";
import { createEventStore } from "./db";
import { createHandler } from "./app";

const port = Number(process.env.PORT ?? 3001);
const inMemory = process.argv.includes("--memory");
const dbPath = inMemory
  ? ":memory:"
  : resolve(process.env.DB_PATH ?? "data/calendar.db");

if (!inMemory) mkdirSync(dirname(dbPath), { recursive: true });

const store = createEventStore(dbPath);
const server = createServer(createHandler(store));

server.listen(port, () => {
  console.log(
    `API listening on http://localhost:${port} (database: ${dbPath})`,
  );
});

const shutdown = () => server.close(() => store.close());
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
