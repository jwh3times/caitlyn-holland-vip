import { setTimeout as delay } from "node:timers/promises";

const ATTEMPTS = 3;
const BACKOFF_MS = 1000;

/** @param {any} error */
const errorCode = (error) => error?.cause?.code ?? error?.message ?? String(error);

/**
 * Fetch a URL, retrying only when the request fails at the network level
 * (the fetch call itself rejects, as on a connection reset).
 *
 * Unlike `request()` in `smoke.mjs`, an HTTP response of any status is
 * returned at once: callers assert on status and headers, so a 5xx must
 * surface as an assertion failure rather than be retried away.
 *
 * @param {string | URL} url
 * @param {{
 *   fetchImpl?: (url: string | URL) => Promise<Response>,
 *   sleep?: (milliseconds: number) => Promise<unknown>,
 *   log?: (message: string) => void,
 * }} [options]
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(
  url,
  { fetchImpl = fetch, sleep = delay, log = console.warn } = {}
) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetchImpl(url);
    } catch (error) {
      if (attempt >= ATTEMPTS) throw error;
      const wait = BACKOFF_MS * attempt;
      log(`Retrying ${url} in ${wait} ms after ${errorCode(error)}`);
      await sleep(wait);
    }
  }
}
