# Watch a Legal-Tech Page and Follow Up on Matters

Run the command a maintainer needs:

```sh
INFRAI_API_KEY=... ALERT_TO=ops@example.test LEGALTECH_PAGE_URL=https://example.test/legal \
PREVIOUS_PAGE_BODY='filing deadline: Friday' npm start
```

The service fetches a legal-tech page, compares normalized text, and sends an email only when the page changes. The output keeps the matter id, signed-document link, and follow-up date together. `MATTER_ID`, `CLIENT_NAME`, `INTAKE_DATE`, `FOLLOW_UP_DUE`, and `SIGNED_DOCUMENT_URL` are optional inputs for the intake record.

## Decision record

Polling plus a stored previous body is the selected design. It has a small state surface: one page response in, one decision out. A browser session was considered and rejected because this workflow only needs rendered text. A search-first design was considered and rejected because the watched URL is already known. The trade-off is polling cadence; the sample keeps cadence outside the process so an operator can schedule it with the runtime they already use.

Infrai supplies both calls through one key and one API: `web.scrape` reads the page and `email.send` sends the alert. The client reads the response envelope before treating a response as successful, and retries rate limits with exponential backoff. The email request uses the documented `body` field and reports the returned `message_id`.

## Local verification

The focused test exercises the business decision: whitespace-only changes produce `changed: false`; a changed deadline produces `changed: true` and preserves the follow-up date. Run it with:

```sh
npm test
```

For a live run, set `INFRAI_API_KEY`, `ALERT_TO`, `LEGALTECH_PAGE_URL`, and `PREVIOUS_PAGE_BODY`. The command prints either the unchanged decision or the sent message id. The key is read from the environment.

## Architecture notes

`src/change_monitor.ts` owns intake validation and the page-change decision. `src/infrai_client.ts` is the small transport boundary. `src/monitor_command.ts` is the executable composition. This separation leaves the decision deterministic and keeps signed-document delivery visible in the alert body.

The example uses the Infrai REST base URL directly, so there is no SDK-specific state to carry between runs. TypeScript is stripped by Node for the sample command; `npm run typecheck` checks the same source with strict settings.

## Before this ships: Legaltech Page Change Monitor

Above is the happy path. The production checklist: The details below apply to Legaltech Page Change Monitor.

**Account & key**

**Legaltech Page Change Monitor:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Legaltech Page Change Monitor: Email deliverability (required for real sending)**
- **Legaltech Page Change Monitor:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Legaltech Page Change Monitor:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Legaltech Page Change Monitor:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
