// Shared domain constants: trades, statuses and SEAI grant workflows.

export const TRADES = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  INSULATION: 'Insulation',
  HEATING: 'Heating',
  CARPENTRY: 'Carpentry',
  ROOFING: 'Roofing',
  GENERAL: 'General',
  OTHER: 'Other',
} as const;
export type TradeKey = keyof typeof TRADES;

export const JOB_STATUS = {
  LEAD: { label: 'Lead', color: 'bg-slate-400/15 text-slate-500' },
  QUOTED: { label: 'Quoted', color: 'bg-blue-500/15 text-blue-500' },
  SCHEDULED: { label: 'Scheduled', color: 'bg-violet-500/15 text-violet-500' },
  IN_PROGRESS: { label: 'In progress', color: 'bg-amber-500/15 text-amber-500' },
  COMPLETED: { label: 'Completed', color: 'bg-teal-500/15 text-teal-500' },
  INVOICED: { label: 'Invoiced', color: 'bg-indigo-500/15 text-indigo-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500/15 text-red-500' },
} as const;
export type JobStatusKey = keyof typeof JOB_STATUS;

export const QUOTE_STATUS = {
  DRAFT: { label: 'Draft', color: 'bg-slate-400/15 text-slate-500' },
  SENT: { label: 'Sent', color: 'bg-blue-500/15 text-blue-500' },
  ACCEPTED: { label: 'Accepted', color: 'bg-teal-500/15 text-teal-500' },
  DECLINED: { label: 'Declined', color: 'bg-red-500/15 text-red-500' },
  EXPIRED: { label: 'Expired', color: 'bg-amber-500/15 text-amber-500' },
} as const;
export type QuoteStatusKey = keyof typeof QUOTE_STATUS;

export const INVOICE_STATUS = {
  DRAFT: { label: 'Draft', color: 'bg-slate-400/15 text-slate-500' },
  SENT: { label: 'Sent', color: 'bg-blue-500/15 text-blue-500' },
  PAID: { label: 'Paid', color: 'bg-teal-500/15 text-teal-500' },
  OVERDUE: { label: 'Overdue', color: 'bg-red-500/15 text-red-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-500/15 text-slate-500' },
} as const;
export type InvoiceStatusKey = keyof typeof INVOICE_STATUS;

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
}

interface GrantMeta {
  label: string;
  checklist: string[];
}

// SEAI grant documentation workflows. Each grant type ships with the standard
// evidence checklist an installer/contractor needs on file for that measure.
export const SEAI_GRANTS: Record<string, GrantMeta> = {
  ATTIC_INSULATION: {
    label: 'Attic Insulation',
    checklist: [
      'Pre-works BER certificate on file',
      'Photos of attic before works',
      'Depth of insulation recorded (min 300mm)',
      'Declaration of Works signed by homeowner',
      'Product / material certs (thermal conductivity)',
      'Photos of completed insulation with depth gauge',
      'Post-works BER assessment arranged',
    ],
  },
  CAVITY_WALL_INSULATION: {
    label: 'Cavity Wall Insulation',
    checklist: [
      'Pre-works BER certificate on file',
      'Cavity suitability / borescope survey',
      'Photos of external walls before works',
      'NSAI Agrément-certified bonded bead system used',
      'Fill pattern & drill hole photos',
      'Declaration of Works signed by homeowner',
      'Post-works BER assessment arranged',
    ],
  },
  INTERNAL_WALL_INSULATION: {
    label: 'Internal Wall (Dry Lining)',
    checklist: [
      'Pre-works BER certificate on file',
      'Photos of rooms before works',
      'U-value calculation for build-up',
      'Ventilation assessment completed',
      'Photos during installation (insulation + membrane)',
      'Declaration of Works signed by homeowner',
      'Post-works BER assessment arranged',
    ],
  },
  EXTERNAL_WALL_INSULATION: {
    label: 'External Wall Insulation',
    checklist: [
      'Pre-works BER certificate on file',
      'Photos of all elevations before works',
      'NSAI Agrément-certified render system',
      'U-value calculation for build-up',
      'Photos of insulation boards & render coats',
      'Declaration of Works signed by homeowner',
      'Post-works BER assessment arranged',
    ],
  },
  HEAT_PUMP: {
    label: 'Heat Pump System',
    checklist: [
      'Technical assessment by registered assessor',
      'Pre-works BER certificate on file',
      'Heat loss indicator (HLI) within threshold',
      'Photos of installed unit & buffer/cylinder',
      'Commissioning certificate',
      'Declaration of Works signed by homeowner',
      'Post-works BER assessment arranged',
    ],
  },
  SOLAR_PV: {
    label: 'Solar PV',
    checklist: [
      'MCS/registered installer confirmation',
      'Photos of roof before works',
      'Array layout & inverter spec on file',
      'Photos of installed panels & inverter',
      'NC6 / ESB Networks notification submitted',
      'Commissioning & handover pack',
      'Declaration of Works signed by homeowner',
    ],
  },
  HEATING_CONTROLS: {
    label: 'Heating Controls',
    checklist: [
      'Pre-works BER certificate on file',
      'Photos of existing controls',
      'Zoning (min 2 zones) implemented',
      'Photos of installed controls & TRVs',
      'Declaration of Works signed by homeowner',
      'Post-works BER assessment arranged',
    ],
  },
  WINDOWS_DOORS: {
    label: 'Windows & Doors',
    checklist: [
      'Pre-works BER certificate on file',
      'Photos of existing windows/doors',
      'U-value certs for new glazing (≤ 1.4)',
      'Photos of installed units',
      'Declaration of Works signed by homeowner',
      'Post-works BER assessment arranged',
    ],
  },
  OTHER: {
    label: 'Other Measure',
    checklist: [
      'Pre-works BER certificate on file',
      'Photos before works',
      'Product / material certs',
      'Photos after works',
      'Declaration of Works signed by homeowner',
    ],
  },
};

export function defaultChecklistFor(grantType: string): ChecklistItem[] {
  const meta = SEAI_GRANTS[grantType] ?? SEAI_GRANTS.OTHER;
  return meta.checklist.map((label, i) => ({ key: `${i}`, label, done: false }));
}

export function labelForTrade(t: string): string {
  return (TRADES as Record<string, string>)[t] ?? t;
}
