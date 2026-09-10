import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDragToCreate } from "../../../src/hooks/useDragToCreate";
import { HOUR_HEIGHT } from "../../../src/constants";

describe("useDragToCreate", () => {
  it("creates a snapped range from a drag in either direction", () => {
    const { result } = renderHook(() => useDragToCreate());
    const day = new Date(2026, 8, 8);

    act(() => result.current.begin(day, HOUR_HEIGHT * 10 + 4, 0));
    act(() => result.current.update(HOUR_HEIGHT * 9 + 3));

    expect(result.current.preview).toMatchObject({
      day,
      start: 9 * 60,
      end: 10 * 60 + 15,
    });

    let range: ReturnType<typeof result.current.finish> = null;
    act(() => {
      range = result.current.finish();
    });
    expect(range).toEqual({
      start: new Date(2026, 8, 8, 9),
      end: new Date(2026, 8, 8, 10, 15),
    });
    expect(result.current.preview).toBeNull();
  });

  it("keeps a 15-minute minimum range and can cancel", () => {
    const { result } = renderHook(() => useDragToCreate());
    const day = new Date(2026, 8, 8);

    act(() => result.current.begin(day, HOUR_HEIGHT * 23.9, 0));
    expect(result.current.preview).toMatchObject({ start: 1425, end: 1440 });

    act(() => result.current.cancel());
    expect(result.current.preview).toBeNull();
    expect(result.current.finish()).toBeNull();
  });
});
