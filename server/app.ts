import type { IncomingMessage, ServerResponse } from "node:http";
import { isEventCategory } from "../src/types/event";
import type { EventStore, StoredEventDraft } from "./db";

const MAX_BODY_BYTES = 64 * 1024;

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function send(res: ServerResponse, status: number, body?: unknown) {
  if (body === undefined) {
    res.writeHead(status).end();
    return;
  }
  res
    .writeHead(status, { "Content-Type": "application/json" })
    .end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "Body too large.");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Body must be valid JSON.");
  }
}

export function parseDraft(body: unknown): StoredEventDraft {
  if (typeof body !== "object" || body === null)
    throw new HttpError(400, "Body must be an object.");
  const {
    title,
    description = "",
    category,
    start,
    end,
  } = body as Record<string, unknown>;
  if (typeof title !== "string" || !title.trim())
    throw new HttpError(400, "Title is required.");
  if (typeof description !== "string")
    throw new HttpError(400, "Description must be a string.");
  if (!isEventCategory(category))
    throw new HttpError(400, "Category is invalid.");
  const startDate = new Date(typeof start === "string" ? start : NaN);
  const endDate = new Date(typeof end === "string" ? end : NaN);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()))
    throw new HttpError(400, "Start and end must be ISO dates.");
  if (endDate <= startDate)
    throw new HttpError(400, "End time must be after the start time.");
  return {
    title: title.trim(),
    description,
    category,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

export function createHandler(store: EventStore) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const { pathname } = new URL(req.url ?? "/", "http://localhost");
      if (pathname === "/api/health") return send(res, 200, { ok: true });

      if (pathname === "/api/events") {
        if (req.method === "GET") return send(res, 200, store.list());
        if (req.method === "POST")
          return send(res, 201, store.create(parseDraft(await readJson(req))));
        throw new HttpError(405, "Method not allowed.");
      }

      const match = /^\/api\/events\/([^/]+)$/.exec(pathname);
      if (match) {
        const id = decodeURIComponent(match[1]);
        if (req.method === "GET") {
          const event = store.get(id);
          if (!event) throw new HttpError(404, "Event not found.");
          return send(res, 200, event);
        }
        if (req.method === "PUT") {
          const event = store.update(id, parseDraft(await readJson(req)));
          if (!event) throw new HttpError(404, "Event not found.");
          return send(res, 200, event);
        }
        if (req.method === "DELETE") {
          if (!store.remove(id)) throw new HttpError(404, "Event not found.");
          return send(res, 204);
        }
        throw new HttpError(405, "Method not allowed.");
      }

      throw new HttpError(404, "Not found.");
    } catch (error) {
      if (error instanceof HttpError)
        return send(res, error.status, { error: error.message });
      console.error(error);
      send(res, 500, { error: "Internal server error." });
    }
  };
}
