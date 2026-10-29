import assert from "node:assert/strict";
import { decideChange } from "./change_monitor.ts";

const unchanged = decideChange({
  matterId: "M-17",
  clientName: "Northwind",
  intakeDate: "2026-10-01",
  followUpDue: "2026-10-08",
  pageUrl: "https://example.test/legal",
  previousBody: "  filing deadline: Friday ",
  currentBody: "filing   deadline: Friday",
  signedDocumentUrl: "https://example.test/signed"
});
assert.equal(unchanged.changed, false);

const changed = decideChange({
  matterId: "M-17",
  clientName: "Northwind",
  intakeDate: "2026-10-01",
  followUpDue: "2026-10-08",
  pageUrl: "https://example.test/legal",
  previousBody: "filing deadline: Friday",
  currentBody: "filing deadline: Monday",
  signedDocumentUrl: "https://example.test/signed"
});
assert.equal(changed.changed, true);
assert.match(changed.alertBody ?? "", /Follow-up due: 2026-10-08/);
console.log("change decision test passed");
