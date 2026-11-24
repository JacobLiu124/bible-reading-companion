# 0003: No Bible text in the app

- Status: Accepted
- Date: 2026-11-23

## Context

The goal is to encourage people to read their own paper Bibles. Popular translations (NIV, ESV) need publisher permission for use in apps. YouVersion's free API forbids apps that "replicate or compete with" the YouVersion Bible App.

## Decision

OneJoy shows **which chapter** to read, never the text. Users can quote scripture they type in themselves (up to 500 characters per post).

## Consequences

- No translation licensing or API dependency; the app stays free and simple.
- OneJoy is a companion, not a Bible reader, which also keeps it clear of YouVersion's terms.
- Anyone without a paper Bible needs another app or website to read the chapter.
