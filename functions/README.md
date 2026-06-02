# Woogi Stock Functions

This directory contains deployable Firebase Cloud Functions for the web app.

## Callable

- `generateStockAiAnalysis`: HTTPS callable used by `src/app.js`.
- `getKospiNightFutures`: HTTPS callable returning the latest collected
  KOSPI200 night futures snapshot.
- `getKisNightFuturesConfig`: HTTPS callable returning KIS configuration status,
  current symbol, session status, and recent `night_futures_prices` history.
- `getMarketProviderConfig`: HTTPS callable returning only whether OpenAI, DART,
  and KIS Functions secrets are configured.

## Scheduled

- `recordNightFuturesPrice`: every-minute KST night-session collector. It uses
  `KIS_APP_KEY` and `KIS_APP_SECRET` secrets, subscribes to KIS `H0UPANC0`, and
  stores snapshots in Firestore `night_futures_prices`.

The function always returns the analysis schema expected by the client. If the
`OPENAI_API_KEY` secret is unavailable or the OpenAI call fails, it returns a
deterministic analysis from the stock, price, fundamentals, candle, and news
payload sent by the browser.

The OpenAI call uses the Responses API over `fetch`, so no OpenAI SDK package is
required in the Functions bundle.

## Deploy

```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set DART_API_KEY
firebase functions:secrets:set KIS_APP_KEY
firebase functions:secrets:set KIS_APP_SECRET
firebase deploy --only functions:generateStockAiAnalysis,functions:recordNightFuturesPrice,functions:getKospiNightFutures,functions:getKisNightFuturesConfig,functions:getMarketProviderConfig
```
