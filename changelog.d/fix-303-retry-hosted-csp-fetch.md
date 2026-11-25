### Fixed

- `Post-deploy Smoke`'s `Live-site CSP Browser` job no longer fails a healthy deployment when the
  live site drops one connection. The hosted CSP benchmark (`npm run benchmark:csp -- --url=…`)
  now retries a request whose connection fails before any response arrives (such as an
  `ECONNRESET`), up to three attempts with a short backoff, and logs each retry. Any HTTP response
  is still checked on the first attempt, so a wrong status, header or page still fails the run
  (#303).
