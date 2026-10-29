import { decideChange, assertMatterIntake } from "./change_monitor.ts";
import { InfraiClient } from "./infrai_client.ts";

const key = process.env.INFRAI_API_KEY;
const recipient = process.env.ALERT_TO;
const pageUrl = process.env.LEGALTECH_PAGE_URL;
const previousBody = process.env.PREVIOUS_PAGE_BODY;
if (!key || !recipient || !pageUrl || previousBody === undefined) {
  throw new Error("Set INFRAI_API_KEY, ALERT_TO, LEGALTECH_PAGE_URL, and PREVIOUS_PAGE_BODY");
}

const matter = assertMatterIntake({
  matterId: process.env.MATTER_ID ?? "matter-demo",
  clientName: process.env.CLIENT_NAME ?? "Example client",
  intakeDate: process.env.INTAKE_DATE ?? new Date().toISOString().slice(0, 10),
  followUpDue: process.env.FOLLOW_UP_DUE ?? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
});
const client = new InfraiClient(key);
const currentBody = await client.scrape(pageUrl);
const decision = decideChange({ ...matter, pageUrl, previousBody, currentBody, signedDocumentUrl: process.env.SIGNED_DOCUMENT_URL ?? "https://example.test/signed-document" });
if (decision.changed && decision.alertSubject && decision.alertBody) {
  const messageId = await client.sendAlert(recipient, decision.alertSubject, decision.alertBody);
  console.log(JSON.stringify({ ...decision, messageId }));
} else {
  console.log(JSON.stringify(decision));
}
