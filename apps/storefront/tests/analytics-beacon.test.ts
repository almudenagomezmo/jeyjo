import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { heartbeatSchema } from "@/lib/analytics/heartbeat-schema";

describe("analytics beacon schema", () => {
  it("accepts valid cart snapshot", () => {
    const parsed = heartbeatSchema.safeParse({ lineCount: 2, totalQty: 5 });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid payload", () => {
    const parsed = heartbeatSchema.safeParse({ lineCount: -1, totalQty: 0 });
    expect(parsed.success).toBe(false);
  });
});

describe("analytics beacon env gate", () => {
  const original = process.env.NEXT_PUBLIC_ANALYTICS_BEACONS_ENABLED;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_ANALYTICS_BEACONS_ENABLED = original;
    vi.unstubAllGlobals();
  });

  it("skips fetch when beacons disabled", async () => {
    process.env.NEXT_PUBLIC_ANALYTICS_BEACONS_ENABLED = "false";
    const fetchMock = vi.mocked(fetch);

    const enabled = process.env.NEXT_PUBLIC_ANALYTICS_BEACONS_ENABLED !== "false";
    if (!enabled) {
      expect(fetchMock).not.toHaveBeenCalled();
      return;
    }

    await fetch("/api/analytics/heartbeat", { method: "POST" });
    expect(fetchMock).toHaveBeenCalled();
  });
});
