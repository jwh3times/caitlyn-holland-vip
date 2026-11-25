import { describe, expect, it, vi } from "vitest";
import { fetchWithRetry } from "../../../scripts/fetch-with-retry.mjs";

const connectionReset = () =>
  Object.assign(new TypeError("fetch failed"), {
    cause: Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" }),
  });

describe("fetchWithRetry", () => {
  it("retries a connection that resets, then resolves with the response", async () => {
    const response = new Response("ok", { status: 200 });
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(connectionReset())
      .mockResolvedValueOnce(response);
    const sleep = vi.fn().mockResolvedValue(undefined);
    const log = vi.fn();

    await expect(
      fetchWithRetry("https://site.test/index.html", { fetchImpl, sleep, log })
    ).resolves.toBe(response);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl).toHaveBeenNthCalledWith(2, "https://site.test/index.html");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("https://site.test/index.html"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("ECONNRESET"));
  });

  it("gives up after three attempts and rejects with the last error", async () => {
    const last = connectionReset();
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(connectionReset())
      .mockRejectedValueOnce(connectionReset())
      .mockRejectedValueOnce(last)
      .mockResolvedValue(new Response("too late"));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      fetchWithRetry("https://site.test/index.html", { fetchImpl, sleep, log: vi.fn() })
    ).rejects.toBe(last);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    // One second, then two: the backoff grows between attempts.
    expect(sleep.mock.calls).toEqual([[1000], [2000]]);
  });

  it.each([404, 500])("returns an HTTP %i response at once, without retrying", async (status) => {
    const response = new Response("error", { status });
    const fetchImpl = vi.fn().mockResolvedValue(response);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      fetchWithRetry("https://site.test/missing", { fetchImpl, sleep, log: vi.fn() })
    ).resolves.toBe(response);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});
