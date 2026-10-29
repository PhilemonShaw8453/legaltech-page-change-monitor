export type MatterIntake = {
  matterId: string;
  clientName: string;
  intakeDate: string;
  followUpDue: string;
};

export type MonitorInput = MatterIntake & {
  pageUrl: string;
  previousBody: string;
  currentBody: string;
  signedDocumentUrl: string;
};

export type MonitorDecision = {
  changed: boolean;
  matterId: string;
  followUpDue: string;
  signedDocumentUrl: string;
  alertSubject?: string;
  alertBody?: string;
};

export function decideChange(input: MonitorInput): MonitorDecision {
  const changed = normalize(input.previousBody) !== normalize(input.currentBody);
  if (!changed) {
    return {
      changed: false,
      matterId: input.matterId,
      followUpDue: input.followUpDue,
      signedDocumentUrl: input.signedDocumentUrl
    };
  }
  return {
    changed: true,
    matterId: input.matterId,
    followUpDue: input.followUpDue,
    signedDocumentUrl: input.signedDocumentUrl,
    alertSubject: `Matter ${input.matterId}: monitored page changed`,
    alertBody: [
      `Client: ${input.clientName}`,
      `Page: ${input.pageUrl}`,
      `Signed document: ${input.signedDocumentUrl}`,
      `Follow-up due: ${input.followUpDue}`
    ].join("\n")
  };
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function assertMatterIntake(value: unknown): MatterIntake {
  if (!value || typeof value !== "object") throw new Error("matter intake must be an object");
  const item = value as Record<string, unknown>;
  for (const field of ["matterId", "clientName", "intakeDate", "followUpDue"]) {
    if (typeof item[field] !== "string" || item[field] === "") throw new Error(`${field} is required`);
  }
  return item as unknown as MatterIntake;
}
