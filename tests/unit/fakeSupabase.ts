// Minimal in-memory stand-in for the parts of the Supabase query builder
// used by src/api/events.ts.
type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string } | null };

export function createFakeSupabase() {
  const rows = new Map<string, Row>();
  let nextId = 1;
  let failure: string | null = null;

  const from = () => {
    let op: "select" | "insert" | "update" | "delete" = "select";
    let payload: Row = {};
    let id: string | undefined;
    let shape: "many" | "single" | "maybeSingle" = "many";

    const run = (): Result => {
      if (failure) return { data: null, error: { message: failure } };
      const matches = id === undefined ? [...rows.values()] : [rows.get(id)];
      let data: Row[] = [];
      if (op === "select") {
        data = matches
          .filter((r): r is Row => !!r)
          .sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)));
      } else if (op === "insert") {
        const row = { ...payload, id: String(nextId++) };
        rows.set(row.id, row);
        data = [row];
      } else if (op === "update") {
        const current = id === undefined ? undefined : rows.get(id);
        if (current) {
          Object.assign(current, payload);
          data = [current];
        }
      } else if (id !== undefined) {
        rows.delete(id);
      }
      if (shape === "many") return { data, error: null };
      if (shape === "single" && data.length !== 1) {
        return { data: null, error: { message: "Expected one row." } };
      }
      return { data: data[0] ?? null, error: null };
    };

    const builder = {
      select: () => builder,
      order: () => builder,
      insert: (value: Row) => ((op = "insert"), (payload = value), builder),
      update: (value: Row) => ((op = "update"), (payload = value), builder),
      delete: () => ((op = "delete"), builder),
      eq: (_column: string, value: string) => ((id = value), builder),
      single: () => ((shape = "single"), builder),
      maybeSingle: () => ((shape = "maybeSingle"), builder),
      then: (resolve: (result: Result) => unknown, reject?: () => unknown) =>
        Promise.resolve(run()).then(resolve, reject),
    };
    return builder;
  };

  return {
    rows,
    client: { from },
    fail: (message: string | null) => {
      failure = message;
    },
  };
}
