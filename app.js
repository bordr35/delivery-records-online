const state = {
  view: "home",
  tiles: [
    { label: "Today Gross", value: "$84.50", meta: "Latest shift snapshot", tone: "good" },
    { label: "Week Gross", value: "$497.30", meta: "7-day rollup", tone: "good" },
    { label: "Earnings / Hour", value: "$20.89", meta: "Weekly average", tone: "good" },
    { label: "Earnings / Mile", value: "$1.76", meta: "Current efficiency", tone: "neutral" },
    { label: "Completed Orders", value: "58", meta: "This week", tone: "neutral" },
    { label: "Issue Count", value: "4", meta: "Needs review", tone: "warn" },
  ],
  latestShift: {
    date: "2026-04-17",
    platform: "DoorDash",
    hours: "3.75",
    gross: "$84.50",
    bonus: "$0.00",
    perHour: "$22.53",
    perMile: "$1.75",
    issues: "1",
  },
  friction: [
    { label: "Wingstop wait times", detail: "Dinner pace dropped after one slow pickup.", tone: "warn" },
    { label: "Apartment friction", detail: "North-apartment dropoff took longer than the payout justified.", tone: "neutral" },
    { label: "Strong zone", detail: "West-side dinner block held the best numbers.", tone: "good" },
  ],
  evidence: [
    { file: "2026-04-17_doordash_wingstop_offer.png", type: "offer", platform: "DoorDash", date: "2026-04-17", order: "dd-417-01", caseId: "-", folder: "inbox-tonight" },
    { file: "2026-04-17_doordash_wingstop_dropoff-proof.jpg", type: "dropoff-proof", platform: "DoorDash", date: "2026-04-17", order: "dd-417-01", caseId: "case-2026-04-17-01", folder: "contract-violations" },
    { file: "2026-04-17_doordash_wingstop_final-payout.png", type: "final-payout", platform: "DoorDash", date: "2026-04-17", order: "dd-417-01", caseId: "-", folder: "completed-orders" },
  ],
  selectedEvidenceFile: "2026-04-17_doordash_wingstop_offer.png",
  orders: [
    { id: "dd-417-01", platform: "DoorDash", date: "2026-04-17", merchant: "Wingstop", gross: "$9.25", bonus: "$0.00", miles: "6.8", minutes: "28", issue: "Yes" },
    { id: "dd-417-02", platform: "DoorDash", date: "2026-04-17", merchant: "Chick-fil-A", gross: "$12.50", bonus: "$0.00", miles: "4.2", minutes: "19", issue: "No" },
    { id: "dd-417-03", platform: "DoorDash", date: "2026-04-17", merchant: "Chipotle", gross: "$11.75", bonus: "$0.00", miles: "5.4", minutes: "22", issue: "No" },
  ],
  shifts: [
    { date: "2026-04-17", platform: "DoorDash", zone: "west-side", hours: "3.75", gross: "$84.50", bonus: "$0.00", perHour: "$22.53", perMile: "$1.75", notes: "dinner was decent but Wingstop slowed the pace" },
    { date: "2026-04-16", platform: "DoorDash", zone: "north-side", hours: "4.10", gross: "$92.80", bonus: "$0.00", perHour: "$22.63", perMile: "$1.82", notes: "good flow with short trips" },
  ],
  weekly: [
    { week: "Apr 14 - Apr 20", gross: "$497.30", bonus: "$0.00", hours: "23.8", perHour: "$20.89", perMile: "$1.76", issues: "4", notes: "west-side dinner blocks were the strongest" },
  ],
  merchants: [
    { merchant: "Chick-fil-A", orders: "18", problemOrders: "1", wait: "4.2", bestZone: "west-side", worstZone: "south-suburbs" },
    { merchant: "Wingstop", orders: "9", problemOrders: "4", wait: "11.5", bestZone: "west-side", worstZone: "north-apartments" },
    { merchant: "Chipotle", orders: "11", problemOrders: "2", wait: "6.8", bestZone: "north-side", worstZone: "east-suburbs" },
  ],
  zones: [
    { zone: "west-side", orders: "26", gross: "$183.20", perHour: "$24.10", perMile: "$1.89", wait: "5.1", issues: "1" },
    { zone: "north-side", orders: "19", gross: "$126.40", perHour: "$20.05", perMile: "$1.74", wait: "6.6", issues: "2" },
    { zone: "east-suburbs", orders: "10", gross: "$74.80", perHour: "$17.92", perMile: "$1.51", wait: "9.2", issues: "3" },
  ],
  cases: [
    { id: "case-2026-04-17-01", date: "2026-04-17", merchant: "Wingstop", issue: "customer-access", status: "open", outcome: "evidence preserved" },
    { id: "case-2026-04-15-01", date: "2026-04-15", merchant: "McDonald's", issue: "merchant-delay", status: "closed", outcome: "warning logged" },
  ],
};

const STORAGE_KEY = "food-gig-dashboard-state-v1";
const browserState = {
  rootName: "No folder selected",
  entries: [],
  selectedPath: "",
  objectUrl: "",
  detailObjectUrl: "",
  searchTerm: "",
};

const evidenceFilters = {
  all: () => true,
  notes: (entry) => Boolean(entry.notes?.trim()),
  cases: (entry) => Boolean(entry.caseId && entry.caseId !== "-"),
  both: (entry) => Boolean(entry.notes?.trim()) && Boolean(entry.caseId && entry.caseId !== "-"),
  plain: (entry) => !entry.notes?.trim() && !(entry.caseId && entry.caseId !== "-"),
};

const caseFilters = {
  all: () => true,
  open: (entry) => String(entry.status || "").toLowerCase() === "open",
  closed: (entry) => String(entry.status || "").toLowerCase() === "closed",
};

const UI_STATE_KEY = "food-gig-dashboard-ui-v1";
const OCR_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
const ocrRuntime = {
  promise: null,
  status: "idle",
  error: "",
};

const viewMeta = {
  home: {
    title: "Home Dashboard",
    description: "Today, this is your working control panel for delivery performance and evidence.",
  },
  evidence: {
    title: "Evidence Inbox",
    description: "Recent screenshots and photos that may be useful for records or disputes.",
  },
  intake: {
    title: "Photo Intake",
    description: "Quickly upload a delivery photo and capture a note while the shift is still in motion.",
  },
  orders: {
    title: "Order Records",
    description: "One row per completed order, with evidence linked to the record.",
  },
  shifts: {
    title: "Shift Reviews",
    description: "Daily performance rollups and shift-level notes.",
  },
  weekly: {
    title: "Weekly Reviews",
    description: "Weekly performance trends, friction, and rule changes.",
  },
  merchants: {
    title: "Merchant Log",
    description: "Track which merchants are fast, slow, or worth downgrading.",
  },
  zones: {
    title: "Zone Log",
    description: "Compare areas by real earnings and friction, not just busyness.",
  },
  cases: {
    title: "Case Files",
    description: "Preserve serious issues with a structured evidence trail.",
  },
  settings: {
    title: "Settings",
    description: "Storage, sync, privacy, and build mode settings.",
  },
};

const navButtons = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const viewTitle = document.getElementById("view-title");
const viewDescription = document.getElementById("view-description");
const csvInputs = {
  orders: document.getElementById("orders-file"),
  shifts: document.getElementById("shifts-file"),
  weekly: document.getElementById("weekly-file"),
  merchants: document.getElementById("merchants-file"),
  zones: document.getElementById("zones-file"),
  cases: document.getElementById("cases-file"),
};
const folderInput = document.getElementById("folder-input");
const browseFolderBtn = document.getElementById("browse-folder-btn");
const clearBrowserBtn = document.getElementById("clear-browser-btn");
const browserDropzone = document.getElementById("browser-dropzone");
const browserSearch = document.getElementById("browser-search");
const evidenceFilter = document.getElementById("evidence-filter");
const browserTree = document.getElementById("browser-tree");
const browserPreview = document.getElementById("browser-preview");
const browserRootLabel = document.getElementById("browser-root-label");
const evidenceTable = document.getElementById("evidence-table");
const evidenceCount = document.getElementById("evidence-count");
const evidenceTypeChips = document.getElementById("evidence-type-chips");
const evidenceDetail = document.getElementById("evidence-detail");
const evidenceOrderSelect = document.getElementById("evidence-order-select");
const evidenceCaseSelect = document.getElementById("evidence-case-select");
const evidenceNotes = document.getElementById("evidence-notes");
const evidenceOcrText = document.getElementById("evidence-ocr-text");
const evidenceOcrStatus = document.getElementById("evidence-ocr-status");
const evidenceOcrFields = document.getElementById("evidence-ocr-fields");
const evidenceManualNote = document.getElementById("evidence-manual-note");
const evidenceSelectedPath = document.getElementById("evidence-selected-path");
const evidenceCopySelectedPath = document.getElementById("evidence-copy-selected-path");
const evidenceDetailStatus = document.getElementById("evidence-detail-status");
const evidenceDetailPreview = document.getElementById("evidence-detail-preview");
const evidenceDetailTitle = document.getElementById("evidence-detail-title");
const evidenceDetailMeta = document.getElementById("evidence-detail-meta");
const evidenceDetailReason = document.getElementById("evidence-detail-reason");
const evidenceDetailSave = document.getElementById("evidence-detail-save");
const evidenceDetailAuto = document.getElementById("evidence-detail-auto");
const evidenceDetailClear = document.getElementById("evidence-detail-clear");
const evidenceDetailCreateCase = document.getElementById("evidence-detail-create-case");
const evidenceDetailCopyName = document.getElementById("evidence-detail-copy-name");
const evidenceDetailCopyPath = document.getElementById("evidence-detail-copy-path");
const evidenceDetailExportCase = document.getElementById("evidence-detail-export-case");
const caseTable = document.getElementById("case-table");
const caseFilter = document.getElementById("case-filter");
const caseStatusCount = document.getElementById("case-status-count");
const caseExportPacketBtn = document.getElementById("case-export-packet-btn");
const caseSummary = document.getElementById("case-summary");
const caseSummaryCopyPathBtn = document.getElementById("case-summary-copy-path-btn");
const caseSummaryCopyBtn = document.getElementById("case-summary-copy-btn");
const caseEvidenceCount = document.getElementById("case-evidence-count");
const casePathStatus = document.getElementById("case-path-status");

function formatTag(tone, text) {
  return `<span class="tag ${tone}">${text}</span>`;
}

function normalizeKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function inferPlatform(value) {
  const text = String(value ?? "").toLowerCase();
  if (/uber\s*eats|ubereats/.test(text)) return "Uber Eats";
  if (/grubhub/.test(text)) return "Grubhub";
  if (/instacart/.test(text)) return "Instacart";
  if (/door\s*dash|doordash/.test(text)) return "DoorDash";
  return "DoorDash";
}

function extractDateFromText(value) {
  const text = String(value ?? "");
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  const monthMatch = text.match(
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b/i,
  );
  return monthMatch ? monthMatch[0] : "";
}

function extractMoneyFromText(value) {
  const text = String(value ?? "");
  const moneyMatches = [
    text.match(/\$\d{1,4}(?:,\d{3})*(?:\.\d{2})?/),
    text.match(/\b(?:total|payout|earnings|amount|pay)\b[:\s-]*\$\d{1,4}(?:,\d{3})*(?:\.\d{2})?/i),
  ].filter(Boolean);
  if (!moneyMatches.length) return "";
  const match = moneyMatches[0][0];
  const amountMatch = match.match(/\$\d{1,4}(?:,\d{3})*(?:\.\d{2})?/);
  return amountMatch ? amountMatch[0] : "";
}

function extractMilesFromText(value) {
  const text = String(value ?? "");
  const match = text.match(/\b\d+(?:\.\d+)?\s*(?:mi|mile|miles)\b/i);
  return match ? match[0].replace(/\s+/g, " ") : "";
}

function extractTimeFromText(value) {
  const text = String(value ?? "");
  const match = text.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d(?:\s?[AP]M)?\b/i);
  return match ? match[0].toUpperCase() : "";
}

function extractCoordinatesFromText(value) {
  const text = String(value ?? "");
  const coordinateMatch = text.match(/\b(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\b/);
  if (coordinateMatch) {
    return `${coordinateMatch[1]}, ${coordinateMatch[2]}`;
  }
  const lat = text.match(/\b(?:lat(?:itude)?|gps\s*lat)\b[:\s-]*(-?\d{1,3}\.\d+)/i);
  const lng = text.match(/\b(?:lng|lon|long(?:itude)?|gps\s*(?:lng|lon))\b[:\s-]*(-?\d{1,3}\.\d+)/i);
  if (lat && lng) {
    return `${lat[1]}, ${lng[1]}`;
  }
  return "";
}

function extractCoordinatePairFromText(value) {
  const text = String(value ?? "");
  const suffixedMatch = text.match(
    /\b(\d{1,3}\.\d+)\s*([NS])\b[,\s]+(\d{1,3}\.\d+)\s*([EW])\b/i,
  );
  if (suffixedMatch) {
    const latitude = `${suffixedMatch[2].toUpperCase() === "S" ? "-" : ""}${suffixedMatch[1]}`;
    const longitude = `${suffixedMatch[4].toUpperCase() === "W" ? "-" : ""}${suffixedMatch[3]}`;
    return { latitude, longitude };
  }

  const coordinateMatch = text.match(/\b(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\b/);
  if (coordinateMatch) {
    return {
      latitude: coordinateMatch[1],
      longitude: coordinateMatch[2],
    };
  }

  const lat = text.match(/\b(?:lat(?:itude)?|gps\s*lat)\b[:\s-]*(-?\d{1,3}\.\d+)/i);
  const lng = text.match(/\b(?:lng|lon|long(?:itude)?|gps\s*(?:lng|lon))\b[:\s-]*(-?\d{1,3}\.\d+)/i);
  if (lat && lng) {
    return {
      latitude: lat[1],
      longitude: lng[1],
    };
  }
  return null;
}

function extractLineByLabel(lines, labels) {
  const normalizedLabels = labels.map((label) => normalizeKey(label));
  for (const line of lines) {
    const trimmed = line.trim();
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex > 0) {
      const key = normalizeKey(trimmed.slice(0, colonIndex));
      if (normalizedLabels.includes(key)) {
        return trimmed.slice(colonIndex + 1).trim();
      }
    }
    const lower = normalizeKey(trimmed);
    for (const label of normalizedLabels) {
      if (lower.startsWith(label) || lower.includes(label)) {
        const parts = trimmed.split(/[:\-–]/);
        if (parts.length > 1) return parts.slice(1).join(":").trim();
      }
    }
  }
  return "";
}

function prettifyOcrFieldName(key) {
  const map = {
    date: "Date",
    time: "Time",
    merchant: "Merchant",
    orderId: "Order ID",
    payout: "Payout",
    miles: "Miles",
    address: "Address",
    platform: "Platform",
    snapshotClass: "Snapshot Class",
    orderState: "Order State",
    stackType: "Stack Type",
    stackCount: "Stack Count",
    customerNames: "Customers",
    itemCounts: "Item Counts",
    bonusAmount: "Bonus Amount",
    bonusTitle: "Bonus Title",
    bonusRule: "Bonus Rule",
    bonusPeriod: "Bonus Period",
    raw: "Raw Text",
    matchedCount: "Matched Count",
    matchedFields: "Matched Fields",
  };
  if (map[key]) return map[key];
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function parseEvidenceOcrText(text) {
  const raw = String(text ?? "").trim();
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const flattened = lines.join(" ");
  const stackMode = lines.filter((line) => /\bPick\s*up\b/i.test(line)).length >= 2 || /continue/i.test(flattened);
  const hasPickupHeader = /\bPick\s*up from\b/i.test(flattened) || /\bArrived at store\b/i.test(flattened);
  const hasDropoffHeader = /\bDeliver to\b/i.test(flattened) || /\bHand it to customer\b/i.test(flattened);
  const hasProofPhoto = /\bPhoto Code\b/i.test(flattened) || /\bCoordinate\b/i.test(flattened);
  const hasShiftSummary = /\bStart Time\b/i.test(flattened) && /\bEnd Time\b/i.test(flattened) && /\bDeliveries\b/i.test(flattened);
  const hasBonusReward = /\b(?:you earned|congrats|challenge details|reward|bonus)\b/i.test(flattened);

  const extracted = {
    platform: inferPlatform(raw),
    date: extractLineByLabel(lines, ["date"]) || extractDateFromText(raw),
    time: extractLineByLabel(lines, ["time"]) || extractTimeFromText(raw),
    merchant: extractLineByLabel(lines, ["merchant", "restaurant", "store", "pickup"]) || "",
    orderId: extractLineByLabel(lines, ["order id", "order", "id", "job id", "ticket"]) || "",
    payout: extractLineByLabel(lines, ["payout", "total", "earnings", "amount", "pay"]) || extractMoneyFromText(raw),
    miles: extractLineByLabel(lines, ["miles", "distance"]) || extractMilesFromText(raw),
    address: extractLineByLabel(lines, ["address", "dropoff", "drop off", "deliver to", "delivery"]) || "",
    pickupTime: extractLineByLabel(lines, ["pickup time", "picked up", "pickup"]) || "",
    dropoffTime: extractLineByLabel(lines, ["dropoff time", "drop off time", "delivered at", "dropoff", "drop off"]) || "",
    coordinates: extractLineByLabel(lines, ["coordinates", "coord", "gps"]) || extractCoordinatesFromText(raw),
  };

  if (stackMode) {
    extracted.snapshotClass = "stack-header";
    extracted.orderState = "stacked";
  } else if (hasPickupHeader) {
    extracted.snapshotClass = "pickup-snapshot";
    extracted.orderState = "single-order";
  } else if (hasDropoffHeader) {
    extracted.snapshotClass = "dropoff-instructions";
    extracted.orderState = "single-order";
  } else if (hasProofPhoto) {
    extracted.snapshotClass = "proof-photo";
    extracted.orderState = "single-order";
  } else if (hasShiftSummary) {
    extracted.snapshotClass = "final-payout-summary";
    extracted.orderState = "shift-closeout";
  } else if (hasBonusReward) {
    extracted.snapshotClass = "promotion-award";
    extracted.orderState = "bonus";
  } else {
    extracted.snapshotClass = "unknown";
    extracted.orderState = "unknown";
  }

  if (stackMode) {
    extracted.stackType = "stack-header";
    extracted.stackCount = String(lines.filter((line) => /\bPick\s*up\b/i.test(line)).length || 2);
    const customerNames = lines
      .filter((line) => /^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)*\s+[A-Z]\.?$/.test(line) || /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+[A-Z]\.?\b/.test(line))
      .slice(0, 6);
    const itemCounts = lines
      .filter((line) => /\b\d+\s+items?\b/i.test(line))
      .slice(0, 6);
    extracted.customerNames = customerNames.join(" | ");
    extracted.itemCounts = itemCounts.join(" | ");
  }

  if (!extracted.time) {
    const timeLine = lines.find((line) => /\b(?:[01]?\d|2[0-3]):[0-5]\d(?:\s?[AP]M)?\b/i.test(line));
    if (timeLine) extracted.time = extractTimeFromText(timeLine);
  }

  if (!extracted.date) {
    const dateLine = lines.find((line) => /\b(?:\d{4}-\d{2}-\d{2}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4})\b/i.test(line));
    if (dateLine) extracted.date = extractDateFromText(dateLine);
  }

  const pair = extractCoordinatePairFromText(extracted.coordinates || raw);
  extracted.latitude = pair?.latitude || "";
  extracted.longitude = pair?.longitude || "";

  if (!extracted.coordinates && extracted.latitude && extracted.longitude) {
    extracted.coordinates = `${extracted.latitude}, ${extracted.longitude}`;
  }

  if (stackMode && !extracted.merchant) {
    const stackMerchant = lines.find((line) => /culver|mcdonald|wingstop|chipotle|chick[-\s]?fil[-\s]?a|burger|taco|pizza|sushi|restaurant/i.test(line));
    if (stackMerchant) extracted.merchant = stackMerchant;
  }

  if (!extracted.merchant) {
    const merchantLine = lines.find((line) => /wingstop|mcdonald|chipotle|chick[-\s]?fil[-\s]?a|subway|pizza|taco|burger|sushi|restaurant/i.test(line));
    if (merchantLine) extracted.merchant = merchantLine;
  }

  if (!extracted.address) {
    const addressLine = lines.find((line) =>
      /\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,6}\s+(?:St|Street|Rd|Road|Dr|Drive|Ave|Avenue|Blvd|Boulevard|Ln|Lane|Ct|Court|Pl|Place|Pkwy|Parkway|Way|Cir|Circle)\b/i.test(
        line,
      ),
    );
    if (addressLine) extracted.address = addressLine;
  }

  if (!extracted.address && flattened) {
    const addressMatch = flattened.match(
      /\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,6}\s+(?:St|Street|Rd|Road|Dr|Drive|Ave|Avenue|Blvd|Boulevard|Ln|Lane|Ct|Court|Pl|Place|Pkwy|Parkway|Way|Cir|Circle)\s*,?\s+[A-Za-z .'-]+?\s+[A-Z]{2}\s+\d{5}\b/i,
    );
    if (addressMatch) extracted.address = addressMatch[0];
  }

  if (hasBonusReward) {
    extracted.bonusTitle = extractLineByLabel(lines, ["congrats", "you earned", "challenge details", "reward", "bonus"]) || "Promotion reward";
    extracted.bonusAmount = extractMoneyFromText(flattened);
    extracted.bonusRule = extractLineByLabel(lines, ["complete", "deliveries", "orders", "missions", "challenge"]) || "";
    const periodLine = lines.find((line) => /\b(?:\w{3}\s+\d{1,2}\s+at\s+\d{1,2}:\d{2}\s+[AP]M\s+-\s+\w{3}\s+\d{1,2}\s+at\s+\d{1,2}:\d{2}\s+[AP]M|\w{3}\s+\d{1,2}\s+at\s+\d{1,2}:\d{2}\s+[AP]M\s+-\s+\w{3}\s+\d{1,2}\s+at\s+\d{1,2}:\d{2}\s+[AP]M)\b/i.test(line));
    extracted.bonusPeriod = periodLine || extractLineByLabel(lines, ["challenge details"]) || "";
  }

  const matchedFields = Object.entries(extracted).filter(([, value]) => Boolean(String(value || "").trim()));

  return {
    raw,
    extracted,
    matchedCount: matchedFields.length,
    matchedFields: matchedFields.map(([key, value]) => ({ key, value })),
  };
}

function renderOcrFields(parsed) {
  if (!evidenceOcrFields) return;
  const extracted = parsed?.extracted || {};
  const rows = [
    ["date", extracted.date],
    ["time", extracted.time],
    ["platform", extracted.platform],
    ["pickupTime", extracted.pickupTime],
    ["dropoffTime", extracted.dropoffTime],
    ["merchant", extracted.merchant],
    ["orderId", extracted.orderId],
    ["payout", extracted.payout],
    ["miles", extracted.miles],
    ["address", extracted.address],
    ["coordinates", extracted.coordinates],
    ["latitude", extracted.latitude],
    ["longitude", extracted.longitude],
    ["snapshotClass", extracted.snapshotClass],
    ["orderState", extracted.orderState],
    ["stackType", extracted.stackType],
    ["stackCount", extracted.stackCount],
    ["customerNames", extracted.customerNames],
    ["itemCounts", extracted.itemCounts],
    ["bonusAmount", extracted.bonusAmount],
    ["bonusTitle", extracted.bonusTitle],
    ["bonusRule", extracted.bonusRule],
    ["bonusPeriod", extracted.bonusPeriod],
  ].filter(([, value]) => Boolean(String(value || "").trim()));

  if (!rows.length) {
    evidenceOcrFields.innerHTML = `
      <div class="empty-state ocr-empty">
        <strong>No OCR fields extracted yet.</strong>
        <span>Paste screenshot text above to break it into usable fields.</span>
      </div>
    `;
    return;
  }

  evidenceOcrFields.innerHTML = rows
    .map(
      ([label, value]) => `
        <div class="ocr-field">
          <strong>${escapeHtml(prettifyOcrFieldName(label))}</strong>
          <span>${escapeHtml(value)}</span>
        </div>
      `,
    )
    .join("");
}

function updateEvidenceOcrText(value) {
  const evidence = getSelectedEvidence();
  if (!evidence) return;

  const parsed = parseEvidenceOcrText(value);
  state.evidence = state.evidence.map((entry) =>
    entry.file === evidence.file
      ? {
          ...entry,
          ocrText: value,
          ocrParsed: parsed.extracted,
          ocrMatchedCount: parsed.matchedCount,
          ocrStatus: value.trim() ? "manual" : "empty",
          platform: parsed.extracted.platform || entry.platform || "DoorDash",
          ocrLatitude: "",
          ocrLongitude: "",
          ocrGeoLabel: "",
          ocrGeoStatus: value.trim() ? "pending" : "empty",
          ocrGeoError: "",
        }
      : entry,
  );
  persistState();
  renderEvidenceDetail();
}

function loadOcrRuntime() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!ocrRuntime.promise) {
    ocrRuntime.status = "loading";
    ocrRuntime.promise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[data-food-gig-ocr="true"]`);
      if (existingScript && window.Tesseract) {
        resolve(window.Tesseract);
        return;
      }

      const script = existingScript || document.createElement("script");
      script.src = OCR_SCRIPT_URL;
      script.async = true;
      script.dataset.foodGigOcr = "true";
      script.onload = () => {
        ocrRuntime.status = "ready";
        resolve(window.Tesseract);
      };
      script.onerror = () => {
        ocrRuntime.status = "error";
        ocrRuntime.error = "Unable to load OCR engine.";
        reject(new Error(ocrRuntime.error));
      };
      if (!existingScript) {
        document.head.appendChild(script);
      }
    });
  }
  return ocrRuntime.promise;
}

async function geocodeAddressText(address) {
  const query = String(address ?? "").trim();
  if (!query) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", query);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Geocode failed (${response.status})`);
  }

  const data = await response.json();
  const match = Array.isArray(data) ? data[0] : null;
  if (!match) return null;

  return {
    latitude: String(match.lat || ""),
    longitude: String(match.lon || ""),
    label: match.display_name || query,
    source: "nominatim",
  };
}

async function runEvidenceGeocode(evidence) {
  if (!evidence) return;
  const selected = getSelectedEvidence();
  if (!selected || selected.file !== evidence.file) return;

  const parsedAddress = String(evidence.ocrParsed?.address || "").trim();
  if (!parsedAddress) return;
  if (evidence.ocrLatitude && evidence.ocrLongitude) return;
  if (evidence.ocrGeoStatus === "running" || evidence.ocrGeoStatus === "done") return;

  state.evidence = state.evidence.map((entry) =>
    entry.file === evidence.file
      ? { ...entry, ocrGeoStatus: "running", ocrGeoError: "" }
      : entry,
  );
  persistState();
  renderEvidenceDetail();

  try {
    const geo = await geocodeAddressText(parsedAddress);
    if (!geo) throw new Error("No geocode match found");

    state.evidence = state.evidence.map((entry) =>
      entry.file === evidence.file
        ? {
            ...entry,
            ocrLatitude: geo.latitude,
            ocrLongitude: geo.longitude,
            ocrGeoLabel: geo.label,
            ocrGeoStatus: "done",
            ocrGeoSource: geo.source,
            ocrGeoError: "",
          }
        : entry,
    );
    persistState();
    renderAll();
  } catch (error) {
    state.evidence = state.evidence.map((entry) =>
      entry.file === evidence.file
        ? { ...entry, ocrGeoStatus: "error", ocrGeoError: error?.message || "Geocode failed" }
        : entry,
    );
    persistState();
    renderEvidenceDetail();
  }
}

async function runEvidenceOcr(evidence) {
  if (!evidence) return;
  const browserEntry = getBrowserEntryForEvidence(evidence);
  if (!browserEntry || !isImageFile(browserEntry)) {
    state.evidence = state.evidence.map((entry) =>
      entry.file === evidence.file
        ? { ...entry, ocrStatus: "unsupported" }
        : entry,
    );
    persistState();
    renderEvidenceDetail();
    return;
  }

  if (evidence.ocrStatus === "running" || evidence.ocrStatus === "done") return;

  state.evidence = state.evidence.map((entry) =>
    entry.file === evidence.file
      ? { ...entry, ocrStatus: "running", ocrError: "", ocrText: entry.ocrText || "" }
      : entry,
  );
  persistState();
  renderEvidenceDetail();

  try {
    const Tesseract = await loadOcrRuntime();
    const result = await Tesseract.recognize(browserEntry.file, "eng", {
      logger: (message) => {
        if (!message) return;
        if (message.status && evidenceOcrStatus && getSelectedEvidence()?.file === evidence.file) {
          const progress = typeof message.progress === "number" ? Math.round(message.progress * 100) : null;
          evidenceOcrStatus.textContent = progress !== null
            ? `OCR ${message.status}${progress ? ` · ${progress}%` : ""}`
            : `OCR ${message.status}`;
        }
      },
    });

    const text = (result?.data?.text || "").trim();
    const parsed = parseEvidenceOcrText(text);
    state.evidence = state.evidence.map((entry) =>
      entry.file === evidence.file
        ? {
            ...entry,
            ocrText: text,
            ocrParsed: parsed.extracted,
            ocrMatchedCount: parsed.matchedCount,
            ocrStatus: "done",
            ocrSource: "tesseract-browser",
            ocrConfidence: result?.data?.confidence ?? null,
            ocrError: "",
            platform: parsed.extracted.platform || entry.platform || "DoorDash",
            ocrLatitude: "",
            ocrLongitude: "",
            ocrGeoLabel: "",
            ocrGeoStatus: parsed.extracted?.address ? "pending" : "empty",
            ocrGeoError: "",
          }
        : entry,
    );
    persistState();
    renderAll();
  } catch (error) {
    console.warn("OCR failed", error);
    state.evidence = state.evidence.map((entry) =>
      entry.file === evidence.file
        ? { ...entry, ocrStatus: "error", ocrError: error?.message || "OCR failed" }
        : entry,
    );
    persistState();
    renderEvidenceDetail();
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[index]}`;
}

function isImageFile(entry) {
  return Boolean(entry?.file?.type && entry.file.type.startsWith("image/"));
}

function getFileIcon(entry) {
  if (isImageFile(entry)) return "🖼";
  if (entry?.file?.type?.includes("pdf")) return "PDF";
  if (entry?.file?.type?.includes("csv")) return "CSV";
  return "FILE";
}

function getOrderMatchForEvidence(entry) {
  const fileName = normalizeKey(entry.name || entry.path || "");
  const path = normalizeKey(entry.path || "");
  const date = extractDateFromText(entry.name || entry.path || "");

  const exactIdMatch = state.orders.find((order) => {
    const orderId = normalizeKey(order.id);
    return orderId && (fileName.includes(orderId) || path.includes(orderId));
  });
  if (exactIdMatch) return exactIdMatch;

  const merchantDateMatch = state.orders.find((order) => {
    const merchant = normalizeKey(order.merchant);
    const orderDate = String(order.date || "").trim();
    return merchant && (fileName.includes(merchant) || path.includes(merchant)) && (!date || orderDate === date);
  });
  if (merchantDateMatch) return merchantDateMatch;

  const dateMatch = state.orders.find((order) => String(order.date || "").trim() === date);
  return dateMatch || null;
}

function getCaseMatchForEvidence(entry, linkedOrder) {
  const fileName = normalizeKey(entry.name || entry.path || "");
  const path = normalizeKey(entry.path || "");
  const date = extractDateFromText(entry.name || entry.path || "");

  const exactIdMatch = state.cases.find((caseFile) => {
    const caseId = normalizeKey(caseFile.id);
    return caseId && (fileName.includes(caseId) || path.includes(caseId));
  });
  if (exactIdMatch) return exactIdMatch;

  const merchantMatch = state.cases.find((caseFile) => {
    const merchant = normalizeKey(caseFile.merchant);
    return merchant && (fileName.includes(merchant) || path.includes(merchant));
  });
  if (merchantMatch) return merchantMatch;

  if (linkedOrder) {
    const linkedOrderMerchant = normalizeKey(linkedOrder.merchant);
    const linkedOrderDate = String(linkedOrder.date || "").trim();
    const relatedCase = state.cases.find((caseFile) => {
      const caseMerchant = normalizeKey(caseFile.merchant);
      const caseDate = String(caseFile.date || "").trim();
      return (
        (linkedOrderMerchant && caseMerchant && linkedOrderMerchant === caseMerchant) ||
        (date && caseDate === date) ||
        (linkedOrderDate && caseDate === linkedOrderDate)
      );
    });
    if (relatedCase) return relatedCase;
  }

  return null;
}

function getOrderLinkInfoForEvidence(entry) {
  const fileName = normalizeKey(entry.name || entry.path || "");
  const path = normalizeKey(entry.path || "");
  const date = extractDateFromText(entry.name || entry.path || "");

  const exactIdMatch = state.orders.find((order) => {
    const orderId = normalizeKey(order.id);
    return orderId && (fileName.includes(orderId) || path.includes(orderId));
  });
  if (exactIdMatch) {
    return { match: exactIdMatch, confidence: "high", reason: "order id in filename" };
  }

  const merchantDateMatch = state.orders.find((order) => {
    const merchant = normalizeKey(order.merchant);
    const orderDate = String(order.date || "").trim();
    return merchant && (fileName.includes(merchant) || path.includes(merchant)) && (!date || orderDate === date);
  });
  if (merchantDateMatch) {
    return { match: merchantDateMatch, confidence: "medium", reason: "merchant plus date" };
  }

  const dateMatch = state.orders.find((order) => String(order.date || "").trim() === date);
  if (dateMatch) {
    return { match: dateMatch, confidence: "low", reason: "date only" };
  }

  return { match: null, confidence: "none", reason: "no order match" };
}

function getCaseLinkInfoForEvidence(entry, linkedOrder) {
  const fileName = normalizeKey(entry.name || entry.path || "");
  const path = normalizeKey(entry.path || "");
  const date = extractDateFromText(entry.name || entry.path || "");

  const exactIdMatch = state.cases.find((caseFile) => {
    const caseId = normalizeKey(caseFile.id);
    return caseId && (fileName.includes(caseId) || path.includes(caseId));
  });
  if (exactIdMatch) {
    return { match: exactIdMatch, confidence: "high", reason: "case id in filename" };
  }

  const merchantMatch = state.cases.find((caseFile) => {
    const merchant = normalizeKey(caseFile.merchant);
    return merchant && (fileName.includes(merchant) || path.includes(merchant));
  });
  if (merchantMatch) {
    return { match: merchantMatch, confidence: "medium", reason: "merchant in filename" };
  }

  if (linkedOrder) {
    const linkedOrderMerchant = normalizeKey(linkedOrder.merchant);
    const linkedOrderDate = String(linkedOrder.date || "").trim();
    const relatedCase = state.cases.find((caseFile) => {
      const caseMerchant = normalizeKey(caseFile.merchant);
      const caseDate = String(caseFile.date || "").trim();
      return (
        (linkedOrderMerchant && caseMerchant && linkedOrderMerchant === caseMerchant) ||
        (date && caseDate === date) ||
        (linkedOrderDate && caseDate === linkedOrderDate)
      );
    });
    if (relatedCase) {
      return { match: relatedCase, confidence: "medium", reason: "linked order context" };
    }
  }

  const dateMatch = state.cases.find((caseFile) => String(caseFile.date || "").trim() === date);
  if (dateMatch) {
    return { match: dateMatch, confidence: "low", reason: "date only" };
  }

  return { match: null, confidence: "none", reason: "no case match" };
}

function getSelectedEvidence() {
  const selected = state.evidence.find((entry) => entry.file === state.selectedEvidenceFile);
  return selected || state.evidence[0] || null;
}

function getSelectedCaseId() {
  const evidence = getSelectedEvidence();
  return evidence?.caseId && evidence.caseId !== "-" ? evidence.caseId : "";
}

function getEvidenceForCaseId(caseId) {
  if (!caseId) return null;
  return state.evidence.find((entry) => entry.caseId === caseId) || null;
}

function getEvidenceForCase(caseRecord) {
  if (!caseRecord) return [];
  return state.evidence.filter((entry) => entry.caseId === caseRecord.id);
}

function getSelectedCaseRecord() {
  const selectedCaseId = getSelectedCaseId();
  return selectedCaseId ? state.cases.find((entry) => entry.id === selectedCaseId) || null : null;
}

function getVisibleCaseRows() {
  const activeFilter = caseFilter?.value || "all";
  const filterFn = caseFilters[activeFilter] || caseFilters.all;
  return state.cases.filter(filterFn);
}

function getBrowserEntryForEvidence(evidence) {
  if (!evidence) return null;
  const fileKey = normalizeKey(evidence.file);
  return browserState.entries.find(
    (entry) => normalizeKey(entry.name) === fileKey || normalizeKey(entry.path).endsWith(fileKey),
  ) || null;
}

function getConfidenceDisplay(confidence = "") {
  const label = String(confidence || "none");
  if (label.startsWith("manual")) return { tone: "good", label };
  if (label.includes("high")) return { tone: "good", label };
  if (label.includes("medium")) return { tone: "neutral", label };
  if (label.includes("low")) return { tone: "warn", label };
  return { tone: "neutral", label: "none" };
}

function buildBrowserEntries(files) {
  return files
    .map((file) => {
      const relativePath = file.foodGigRelativePath || file.webkitRelativePath || file.name;
      return {
        file,
        path: relativePath,
        name: file.name,
        size: file.size || 0,
        type: file.type || "",
        lastModified: file.lastModified || 0,
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function getVisibleBrowserEntries() {
  const query = normalizeKey(browserState.searchTerm);
  if (!query) return browserState.entries;
  return browserState.entries.filter((entry) => {
    const haystack = normalizeKey(`${entry.path} ${entry.name} ${entry.type}`);
    return haystack.includes(query);
  });
}

function buildBrowserTree(entries) {
  const root = { type: "folder", name: browserState.rootName, path: "", children: [] };

  const ensureFolder = (parent, name, path) => {
    let folder = parent.children.find((child) => child.type === "folder" && child.name === name);
    if (!folder) {
      folder = { type: "folder", name, path, children: [] };
      parent.children.push(folder);
    }
    return folder;
  };

  entries.forEach((entry) => {
    const parts = entry.path.split("/").filter(Boolean);
    const folderStartIndex = parts.length > 1 && parts[0] === browserState.rootName ? 1 : 0;
    const folders = parts.length > 1 ? parts.slice(folderStartIndex, -1) : [];
    const fileName = parts[parts.length - 1] || entry.name;
    let cursor = root;
    let currentPath = browserState.rootName;

    folders.forEach((folderName) => {
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      cursor = ensureFolder(cursor, folderName, currentPath);
    });

    cursor.children.push({
      type: "file",
      name: fileName,
      path: entry.path,
      entry,
    });
  });

  return root;
}

function renderFolderNode(node, isRoot = false) {
  if (node.type === "file") {
    const selected = node.path === browserState.selectedPath ? "selected" : "";
    return `
      <button type="button" class="file-node ${selected}" data-file-path="${escapeHtml(node.path)}">
        <span class="file-icon">${escapeHtml(getFileIcon(node.entry))}</span>
        <span class="file-label">
          <strong>${escapeHtml(node.name)}</strong>
          <span>${escapeHtml(node.entry.type || "unknown")} · ${formatBytes(node.entry.size)}</span>
        </span>
      </button>
    `;
  }

  const children = node.children
    .slice()
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((child) => renderFolderNode(child))
    .join("");

  const itemCount = node.children.length;
  return `
    <details class="folder-node" ${isRoot ? "open" : ""}>
      <summary>
        <span class="folder-icon">📁</span>
        <span class="file-label">
          <strong>${escapeHtml(node.name)}</strong>
          <span>${itemCount} item${itemCount === 1 ? "" : "s"}</span>
        </span>
      </summary>
      <div class="folder-children">
        ${children || `<div class="empty-state" style="min-height:120px;"><strong>Empty folder</strong><span>No files here.</span></div>`}
      </div>
    </details>
  `;
}

function renderBrowserPreview() {
  const selected = browserState.entries.find((entry) => entry.path === browserState.selectedPath);
  if (!selected) {
    browserPreview.innerHTML = `
      <div class="empty-state">
        <strong>No file selected.</strong>
        <span>Select a file from the browser tree to preview it here.</span>
      </div>
    `;
    return;
  }

  if (browserState.objectUrl) {
    URL.revokeObjectURL(browserState.objectUrl);
    browserState.objectUrl = "";
  }

  const isImage = isImageFile(selected);
  let previewMarkup = "";
  if (isImage) {
    browserState.objectUrl = URL.createObjectURL(selected.file);
    previewMarkup = `
      <div class="preview-thumb">
        <img src="${browserState.objectUrl}" alt="${escapeHtml(selected.name)}" />
      </div>
    `;
  }

  browserPreview.innerHTML = `
    ${previewMarkup}
    <div class="preview-meta">
      <h3>${escapeHtml(selected.name)}</h3>
      <p>${escapeHtml(selected.path)}</p>
      <p>${escapeHtml(selected.type || "unknown")} · ${formatBytes(selected.size)}</p>
      <p>Modified: ${selected.lastModified ? new Date(selected.lastModified).toLocaleString() : "unknown"}</p>
    </div>
    <div class="preview-meta">
      ${formatTag(isImage ? "good" : "neutral", isImage ? "image file" : "file")}
      <p>Root: ${escapeHtml(browserState.rootName)}</p>
    </div>
  `;
}

function renderEvidenceDetailPreview(evidence) {
  if (browserState.detailObjectUrl) {
    URL.revokeObjectURL(browserState.detailObjectUrl);
    browserState.detailObjectUrl = "";
  }

  const browserEntry = getBrowserEntryForEvidence(evidence);
  if (!browserEntry || !isImageFile(browserEntry)) {
    evidenceDetailPreview.innerHTML = `
      <div class="empty-state">
        <strong>No preview available.</strong>
        <span>This file is either not loaded in the browser or is not an image.</span>
      </div>
    `;
    return;
  }

  browserState.detailObjectUrl = URL.createObjectURL(browserEntry.file);
  evidenceDetailPreview.innerHTML = `
    <img src="${browserState.detailObjectUrl}" alt="${escapeHtml(evidence.file)}" />
  `;
}

function populateEvidenceSelect(select, rows, currentValue, placeholder) {
  if (!select) return;
  const options = rows
    .map((row) => {
      const label = row.id
        ? `${row.id} · ${row.merchant || "merchant"} · ${row.date || ""}`
        : `${row.id || "case"} · ${row.merchant || "merchant"} · ${row.date || ""}`;
      return `<option value="${escapeHtml(row.id)}" ${row.id === currentValue ? "selected" : ""}>${escapeHtml(label)}</option>`;
    })
    .join("");

  select.innerHTML = `
    <option value="">${escapeHtml(placeholder)}</option>
    ${options}
  `;
}

function renderEvidenceDetail() {
  const evidence = getSelectedEvidence();
  if (!evidence) {
    if (browserState.detailObjectUrl) {
      URL.revokeObjectURL(browserState.detailObjectUrl);
      browserState.detailObjectUrl = "";
    }
    evidenceDetailTitle.textContent = "Evidence Detail";
    evidenceDetailMeta.textContent = "Choose a file to inspect and relink it.";
    evidenceDetailReason.textContent = "No evidence selected.";
    evidenceManualNote.textContent = "Select a row in the inbox or browser.";
    evidenceDetailStatus.innerHTML = formatTag("neutral", "none");
    if (evidenceOrderSelect) evidenceOrderSelect.innerHTML = `<option value="">No linked order</option>`;
    if (evidenceCaseSelect) evidenceCaseSelect.innerHTML = `<option value="">No linked case</option>`;
    if (evidenceNotes) evidenceNotes.value = "";
    if (evidenceOcrText) evidenceOcrText.value = "";
    if (evidenceOcrStatus) evidenceOcrStatus.textContent = "No OCR text yet.";
    if (evidenceOcrFields) {
      evidenceOcrFields.innerHTML = `
        <div class="empty-state ocr-empty">
          <strong>No OCR fields extracted yet.</strong>
          <span>Paste screenshot text above to break it into usable fields.</span>
        </div>
      `;
    }
    if (evidenceSelectedPath) evidenceSelectedPath.textContent = "No file selected.";
    if (evidenceDetailSave) evidenceDetailSave.disabled = true;
    if (evidenceDetailAuto) evidenceDetailAuto.disabled = true;
    if (evidenceDetailClear) evidenceDetailClear.disabled = true;
    if (evidenceDetailCreateCase) evidenceDetailCreateCase.disabled = true;
    if (evidenceDetailCopyName) evidenceDetailCopyName.disabled = true;
    if (evidenceDetailCopyPath) evidenceDetailCopyPath.disabled = true;
    if (evidenceCopySelectedPath) evidenceCopySelectedPath.disabled = true;
    if (evidenceDetailExportCase) evidenceDetailExportCase.disabled = true;
    if (caseExportPacketBtn) caseExportPacketBtn.disabled = true;
    if (caseSummaryCopyBtn) caseSummaryCopyBtn.disabled = true;
    if (caseSummaryCopyPathBtn) caseSummaryCopyPathBtn.disabled = true;
    evidenceDetailPreview.innerHTML = `
      <div class="empty-state">
        <strong>No evidence selected.</strong>
        <span>Choose a file from the inbox or browser tree.</span>
      </div>
    `;
    return;
  }

  if (evidenceDetailSave) evidenceDetailSave.disabled = false;
  if (evidenceDetailAuto) evidenceDetailAuto.disabled = false;
  if (evidenceDetailClear) evidenceDetailClear.disabled = false;
  if (evidenceDetailCreateCase) evidenceDetailCreateCase.disabled = false;
  if (evidenceDetailCopyName) evidenceDetailCopyName.disabled = false;
  if (evidenceDetailCopyPath) evidenceDetailCopyPath.disabled = false;
  if (evidenceCopySelectedPath) evidenceCopySelectedPath.disabled = false;
  if (evidenceDetailExportCase) evidenceDetailExportCase.disabled = false;
  if (caseExportPacketBtn) caseExportPacketBtn.disabled = false;
  if (caseSummaryCopyBtn) caseSummaryCopyBtn.disabled = false;
  if (caseSummaryCopyPathBtn) caseSummaryCopyPathBtn.disabled = false;

  populateEvidenceSelect(
    evidenceOrderSelect,
    state.orders,
    evidence.order && evidence.order !== "-" ? evidence.order : "",
    "No linked order",
  );
  populateEvidenceSelect(
    evidenceCaseSelect,
    state.cases,
    evidence.caseId && evidence.caseId !== "-" ? evidence.caseId : "",
    "No linked case",
  );

  const confidence = getConfidenceDisplay(evidence.confidence);
  evidenceDetailTitle.textContent = evidence.file;
  evidenceDetailMeta.textContent = `${evidence.type || "unknown"} · ${evidence.date || "unknown date"} · ${evidence.folder || "unknown folder"}`;
  evidenceDetailReason.textContent = evidence.confidenceReason || "No link reason available.";
  evidenceDetailStatus.innerHTML = formatTag(confidence.tone, confidence.label);
  evidenceManualNote.textContent = evidence.orderMode === "manual" || evidence.caseMode === "manual"
    ? "Manual link override is active."
    : "Auto-link is active.";
  if (evidenceSelectedPath) {
    const browserEntry = getBrowserEntryForEvidence(evidence);
    evidenceSelectedPath.textContent = browserEntry?.path || evidence.file || "No file selected.";
  }
  if (evidenceNotes && document.activeElement !== evidenceNotes) {
    evidenceNotes.value = evidence.notes || "";
  }
  if (evidenceOcrText && document.activeElement !== evidenceOcrText) {
    evidenceOcrText.value = evidence.ocrText || "";
  }

  const parsedOcr = parseEvidenceOcrText(evidence.ocrText || "");
  if (evidenceOcrStatus) {
    if (evidence.ocrStatus === "running") {
      evidenceOcrStatus.textContent = "OCR running...";
    } else if (evidence.ocrStatus === "done" || evidence.ocrText?.trim()) {
      const geoText = evidence.ocrGeoStatus === "running"
        ? " Geocode running..."
        : evidence.ocrGeoStatus === "done" && evidence.ocrLatitude && evidence.ocrLongitude
          ? ` Geo:${evidence.ocrLatitude}, ${evidence.ocrLongitude}.`
          : evidence.ocrGeoStatus === "error"
            ? ` Geocode failed: ${evidence.ocrGeoError || "unknown error"}.`
            : evidence.ocrParsed?.address
              ? " Geocode pending."
              : "";
      evidenceOcrStatus.textContent = `${parsedOcr.matchedCount} field${parsedOcr.matchedCount === 1 ? "" : "s"} extracted from OCR text.${geoText}`;
    } else if (evidence.ocrStatus === "unsupported") {
      evidenceOcrStatus.textContent = "OCR is only available for image files.";
    } else if (evidence.ocrStatus === "error") {
      evidenceOcrStatus.textContent = evidence.ocrError || "OCR failed.";
    } else {
      evidenceOcrStatus.textContent = "Auto-OCR will run when an image file is selected.";
    }
  }
  renderOcrFields(parsedOcr);

  renderEvidenceDetailPreview(evidence);

  if (
    !evidence.ocrText?.trim() &&
    evidence.ocrStatus !== "running" &&
    evidence.ocrStatus !== "done" &&
    evidence.ocrStatus !== "unsupported" &&
    evidence.ocrStatus !== "error"
  ) {
    setTimeout(() => {
      const current = getSelectedEvidence();
      if (current?.file === evidence.file) {
        runEvidenceOcr(current);
      }
    }, 0);
  }

  if (
    (evidence.ocrStatus === "done" || evidence.ocrStatus === "manual") &&
    evidence.ocrParsed?.address &&
    !evidence.ocrLatitude &&
    !evidence.ocrLongitude &&
    evidence.ocrGeoStatus !== "running" &&
    evidence.ocrGeoStatus !== "done"
  ) {
    setTimeout(() => {
      const current = getSelectedEvidence();
      if (current?.file === evidence.file) {
        runEvidenceGeocode(current);
      }
    }, 0);
  }
}

function setSelectedEvidence(fileName) {
  if (!fileName) return;
  state.selectedEvidenceFile = fileName;
  persistState();
  const matchingBrowserEntry = browserState.entries.find((entry) => normalizeKey(entry.name) === normalizeKey(fileName));
  if (matchingBrowserEntry) {
    browserState.selectedPath = matchingBrowserEntry.path;
  }
  renderAll();
  renderFileBrowser();
}

function openEvidenceByFile(fileName) {
  if (!fileName) return;
  setSelectedEvidence(fileName);
  setView("evidence");
}

function updateEvidenceLink(mode) {
  const evidence = getSelectedEvidence();
  if (!evidence) return;

  const nextOrder = evidenceOrderSelect?.value || "";
  const nextCaseId = evidenceCaseSelect?.value || "";
  const nextEntry = {
    ...evidence,
    order: nextOrder || "-",
    caseId: nextCaseId || "-",
  };

  if (mode === "manual") {
    nextEntry.orderMode = "manual";
    nextEntry.caseMode = "manual";
    nextEntry.confidence = nextOrder || nextCaseId ? "manual" : "none";
    nextEntry.confidenceReason = nextOrder || nextCaseId ? "manual override" : "manual clear";
  } else if (mode === "auto") {
    nextEntry.order = "-";
    nextEntry.caseId = "-";
    delete nextEntry.orderMode;
    delete nextEntry.caseMode;
  }

  state.evidence = state.evidence.map((entry) => (entry.file === evidence.file ? nextEntry : entry));
  persistState();
  renderAll();
}

function updateEvidenceNotes(value) {
  const evidence = getSelectedEvidence();
  if (!evidence) return;

  state.evidence = state.evidence.map((entry) =>
    entry.file === evidence.file ? { ...entry, notes: value } : entry,
  );
  persistState();
}

async function copyEvidenceText(text, label) {
  if (!text) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "true");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      document.body.removeChild(helper);
    }

    if (evidenceManualNote) {
      evidenceManualNote.textContent = `${label} copied to clipboard.`;
    }
    return true;
  } catch (error) {
    console.warn(`Failed to copy ${label.toLowerCase()}`, error);
    if (evidenceManualNote) {
      evidenceManualNote.textContent = `Could not copy ${label.toLowerCase()}.`;
    }
    return false;
  }
}

function createCaseIdFromEvidence(evidence) {
  const baseDate = evidence?.date || new Date().toISOString().slice(0, 10);
  const baseId = `case-${baseDate}`;
  let suffix = 1;
  let candidate = `${baseId}-${String(suffix).padStart(2, "0")}`;

  while (state.cases.some((caseFile) => normalizeKey(caseFile.id) === normalizeKey(candidate))) {
    suffix += 1;
    candidate = `${baseId}-${String(suffix).padStart(2, "0")}`;
  }

  return candidate;
}

function createCaseFromSelectedEvidence() {
  const evidence = getSelectedEvidence();
  if (!evidence) return;

  const linkedOrder = state.orders.find((order) => order.id === evidence.order);
  const caseId = createCaseIdFromEvidence(evidence);
  const caseRecord = {
    id: caseId,
    date: evidence.date || linkedOrder?.date || "",
    merchant: linkedOrder?.merchant || evidence.folder || "unknown",
    issue: evidence.type || "evidence-review",
    status: "open",
    outcome: evidence.notes?.trim() || "created from evidence",
  };

  state.cases = [caseRecord, ...state.cases];
  state.evidence = state.evidence.map((entry) =>
    entry.file === evidence.file
      ? {
          ...entry,
          caseId,
          caseMode: "manual",
          confidence: entry.confidence && entry.confidence !== "none" ? `${entry.confidence.split("/")[0]}/manual` : "manual",
          confidenceReason: "case created from evidence",
        }
      : entry,
  );

  state.selectedEvidenceFile = evidence.file;
  persistState();
  renderAll();
}

function buildEvidenceSummary(evidence) {
  if (!evidence) return "";

  const linkedOrder = state.orders.find((order) => order.id === evidence.order);
  const linkedCase = state.cases.find((caseFile) => caseFile.id === evidence.caseId);
  const browserEntry = getBrowserEntryForEvidence(evidence);
  const ocrLines = [];
  const ocr = evidence.ocrParsed || null;
  if (ocr) {
    Object.entries(ocr).forEach(([key, value]) => {
      if (value && String(value).trim()) {
        ocrLines.push(`${prettifyOcrFieldName(key)}: ${value}`);
      }
    });
  }
  const lines = [
    "# Evidence Summary",
    "",
    `File: ${evidence.file || "unknown"}`,
    `Path: ${browserEntry?.path || evidence.file || "unknown"}`,
    `Platform: ${evidence.platform || "DoorDash"}`,
    `Type: ${evidence.type || "unknown"}`,
    `Date: ${evidence.date || "unknown"}`,
    `Folder: ${evidence.folder || "unknown"}`,
    `Confidence: ${evidence.confidence || "none"}`,
    `Match Reason: ${evidence.confidenceReason || "none"}`,
    `Notes: ${evidence.notes || "none"}`,
    `OCR Text: ${evidence.ocrText?.trim() ? "present" : "none"}`,
    `Latitude: ${evidence.ocrLatitude || "none"}`,
    `Longitude: ${evidence.ocrLongitude || "none"}`,
    `Geo Label: ${evidence.ocrGeoLabel || "none"}`,
    `Bonus Amount: ${evidence.bonusAmount || "none"}`,
    `Bonus Title: ${evidence.bonusTitle || "none"}`,
    `Bonus Rule: ${evidence.bonusRule || "none"}`,
    `Bonus Period: ${evidence.bonusPeriod || "none"}`,
    "",
    "## Linked Order",
    `Order ID: ${linkedOrder?.id || evidence.order || "-"}`,
    `Merchant: ${linkedOrder?.merchant || "unknown"}`,
    `Gross: ${linkedOrder?.gross || "unknown"}`,
    `Miles: ${linkedOrder?.miles || "unknown"}`,
    `Minutes: ${linkedOrder?.minutes || "unknown"}`,
    "",
    "## Linked Case",
    `Case ID: ${linkedCase?.id || evidence.caseId || "-"}`,
    `Status: ${linkedCase?.status || "unknown"}`,
    `Issue: ${linkedCase?.issue || "unknown"}`,
    `Outcome: ${linkedCase?.outcome || "unknown"}`,
    "",
    "## OCR Extracted Fields",
  ];

  if (!ocrLines.length) {
    lines.push("- none");
  } else {
    lines.push(...ocrLines.map((line) => `- ${line}`));
  }

  lines.push(
    "",
    "## Bonus / Promotion",
  );

  if (evidence.bonusAmount || evidence.bonusTitle || evidence.bonusRule || evidence.bonusPeriod) {
    lines.push(
      `- Amount: ${evidence.bonusAmount || "none"}`,
      `- Title: ${evidence.bonusTitle || "none"}`,
      `- Rule: ${evidence.bonusRule || "none"}`,
      `- Period: ${evidence.bonusPeriod || "none"}`,
    );
  } else {
    lines.push("- none");
  }

  lines.push(
    "",
    "## Action Notes",
    "- Review the file and keep the original evidence stored.",
    "- Add any related screenshots or chat messages.",
    "- Use this summary for dispute follow-up or dashboard review.",
  );

  return lines.join("\n");
}

function buildCasePacket(caseRecord) {
  if (!caseRecord) return "";

  const linkedEvidence = getEvidenceForCase(caseRecord);
  const primaryEvidence = linkedEvidence[0] || null;
  const primaryBrowserEntry = getBrowserEntryForEvidence(primaryEvidence);
  const primaryOcr = primaryEvidence?.ocrParsed || null;
  const primaryOcrLines = [];
  if (primaryOcr) {
    Object.entries(primaryOcr).forEach(([key, value]) => {
      if (value && String(value).trim()) {
        primaryOcrLines.push(`${prettifyOcrFieldName(key)}: ${value}`);
      }
    });
  }
  const lines = [
    "# Case Packet",
    "",
    `Case ID: ${caseRecord.id || "unknown"}`,
    `Date: ${caseRecord.date || "unknown"}`,
    `Merchant: ${caseRecord.merchant || "unknown"}`,
    `Platform: ${primaryEvidence?.platform || "DoorDash"}`,
    `Issue: ${caseRecord.issue || "unknown"}`,
    `Status: ${caseRecord.status || "unknown"}`,
    `Outcome: ${caseRecord.outcome || "unknown"}`,
    `Primary Evidence Path: ${primaryBrowserEntry?.path || primaryEvidence?.file || "none"}`,
    `Primary OCR Text: ${primaryEvidence?.ocrText?.trim() ? "present" : "none"}`,
    `Primary Latitude: ${primaryEvidence?.ocrLatitude || "none"}`,
    `Primary Longitude: ${primaryEvidence?.ocrLongitude || "none"}`,
    `Primary Geo Label: ${primaryEvidence?.ocrGeoLabel || "none"}`,
    `Primary Bonus Amount: ${primaryEvidence?.bonusAmount || "none"}`,
    `Primary Bonus Title: ${primaryEvidence?.bonusTitle || "none"}`,
    `Primary Bonus Rule: ${primaryEvidence?.bonusRule || "none"}`,
    `Primary Bonus Period: ${primaryEvidence?.bonusPeriod || "none"}`,
    "",
    "## Primary OCR Fields",
  ];

  if (!primaryOcrLines.length) {
    lines.push("- none");
  } else {
    lines.push(...primaryOcrLines.map((line) => `- ${line}`));
  }

  lines.push(
    "",
    "## Bonus / Promotion",
  );

  if (primaryEvidence?.bonusAmount || primaryEvidence?.bonusTitle || primaryEvidence?.bonusRule || primaryEvidence?.bonusPeriod) {
    lines.push(
      `- Amount: ${primaryEvidence?.bonusAmount || "none"}`,
      `- Title: ${primaryEvidence?.bonusTitle || "none"}`,
      `- Rule: ${primaryEvidence?.bonusRule || "none"}`,
      `- Period: ${primaryEvidence?.bonusPeriod || "none"}`,
    );
  } else {
    lines.push("- none");
  }

  lines.push(
    "",
    "## Linked Evidence",
  );

  if (!linkedEvidence.length) {
    lines.push("- none");
  } else {
    linkedEvidence.forEach((evidence) => {
      const browserEntry = getBrowserEntryForEvidence(evidence);
      lines.push(
        `- ${evidence.file} | ${browserEntry?.path || evidence.file} | ${evidence.type || "unknown"} | ${evidence.confidence || "none"} | OCR: ${evidence.ocrText?.trim() ? "yes" : "no"}`,
      );
    });
  }

  lines.push(
    "",
    "## Notes",
    "- Keep originals in the evidence folder.",
    "- Add screenshots, chats, or timestamps as needed.",
    "- Use this packet when reviewing or fighting the issue.",
  );

  return lines.join("\n");
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportSelectedEvidenceSummary() {
  const evidence = getSelectedEvidence();
  if (!evidence) return;
  const summary = buildEvidenceSummary(evidence);
  const safeName = evidence.file.replace(/[^a-z0-9._-]+/gi, "_").replace(/_+/g, "_");
  downloadTextFile(`${safeName}.md`, summary);
  if (evidenceManualNote) {
    evidenceManualNote.textContent = "Case summary exported.";
  }
}

function exportSelectedCasePacket() {
  const caseRecord = getSelectedCaseRecord();
  if (!caseRecord) {
    if (evidenceManualNote) {
      evidenceManualNote.textContent = "Select evidence with a linked case first.";
    }
    return;
  }

  const packet = buildCasePacket(caseRecord);
  const safeName = caseRecord.id.replace(/[^a-z0-9._-]+/gi, "_").replace(/_+/g, "_");
  downloadTextFile(`${safeName}-packet.md`, packet);
  if (evidenceManualNote) {
    evidenceManualNote.textContent = "Case packet exported.";
  }
}

async function copyCasePacketToClipboard() {
  const caseRecord = getSelectedCaseRecord();
  if (!caseRecord) {
    if (evidenceManualNote) {
      evidenceManualNote.textContent = "Select evidence with a linked case first.";
    }
    return;
  }

  const packet = buildCasePacket(caseRecord);
  const copied = await copyEvidenceText(packet, "Case packet");
  if (copied && evidenceManualNote) {
    evidenceManualNote.textContent = "Case packet copied.";
  }
}

async function copySelectedCasePrimaryPath() {
  const caseRecord = getSelectedCaseRecord();
  if (!caseRecord) {
    if (evidenceManualNote) {
      evidenceManualNote.textContent = "Select evidence with a linked case first.";
    }
    return;
  }

  const linkedEvidence = getEvidenceForCase(caseRecord);
  const primaryEvidence = linkedEvidence[0] || null;
  const primaryPath = getBrowserEntryForEvidence(primaryEvidence)?.path || primaryEvidence?.file || "";
  if (!primaryPath) {
    if (evidenceManualNote) {
      evidenceManualNote.textContent = "No primary path available.";
    }
    return;
  }

  const copied = await copyEvidenceText(primaryPath, "Case path");
  if (copied && evidenceManualNote) {
    evidenceManualNote.textContent = "Case path copied.";
  }
}

function renderFileBrowser() {
  const visibleEntries = getVisibleBrowserEntries();
  browserRootLabel.textContent = browserState.entries.length
    ? `${browserState.rootName} · ${visibleEntries.length} visible of ${browserState.entries.length} file${browserState.entries.length === 1 ? "" : "s"}`
    : "No folder selected";

  if (!browserState.entries.length) {
    browserTree.innerHTML = `
      <div class="empty-state">
        <strong>No folder loaded yet.</strong>
        <span>Choose a folder to browse its files.</span>
      </div>
    `;
    renderBrowserPreview();
    return;
  }

  if (!visibleEntries.length) {
    browserTree.innerHTML = `
      <div class="empty-state">
        <strong>No matching files.</strong>
        <span>Try a different search term.</span>
      </div>
    `;
    renderBrowserPreview();
    return;
  }

  const tree = buildBrowserTree(visibleEntries);
  browserTree.innerHTML = renderFolderNode(tree, true);
  renderBrowserPreview();
}

function loadBrowserFiles(files) {
  if (browserState.objectUrl) {
    URL.revokeObjectURL(browserState.objectUrl);
    browserState.objectUrl = "";
  }
  if (browserState.detailObjectUrl) {
    URL.revokeObjectURL(browserState.detailObjectUrl);
    browserState.detailObjectUrl = "";
  }

  browserState.entries = buildBrowserEntries(files);
  const firstEntry = browserState.entries[0];
  const firstPathParts = firstEntry?.path.split("/").filter(Boolean) || [];
  browserState.rootName = firstPathParts.length > 1 ? firstPathParts[0] : "Selected Files";
  browserState.selectedPath = firstEntry?.path || "";
  renderFileBrowser();
}

async function walkDirectoryHandle(handle, prefix = "") {
  const collected = [];
  for await (const [name, child] of handle.entries()) {
    const nextPath = prefix ? `${prefix}/${name}` : name;
    if (child.kind === "file") {
      const file = await child.getFile();
      file.foodGigRelativePath = nextPath;
      collected.push(file);
    } else if (child.kind === "directory") {
      const nested = await walkDirectoryHandle(child, nextPath);
      collected.push(...nested);
    }
  }
  return collected;
}

async function walkFileEntry(entry, prefix = "") {
  if (!entry) return [];

  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file) => {
        file.foodGigRelativePath = prefix || file.name;
        resolve([file]);
      });
    });
  }

  if (entry.isDirectory) {
    return new Promise((resolve) => {
      const reader = entry.createReader();
      const collected = [];

      const readBatch = () => {
        reader.readEntries(async (entries) => {
          if (!entries.length) {
            resolve(collected);
            return;
          }

          for (const child of entries) {
            const nextPath = prefix ? `${prefix}/${child.name}` : child.name;
            const nested = await walkFileEntry(child, nextPath);
            collected.push(...nested);
          }

          readBatch();
        });
      };

      readBatch();
    });
  }

  return [];
}

async function collectDroppedFiles(event) {
  const transferItems = Array.from(event.dataTransfer?.items || []);
  const hasEntries = transferItems.some((item) => typeof item.webkitGetAsEntry === "function");

  if (hasEntries) {
    const collected = [];
    for (const item of transferItems) {
      const entry = item.webkitGetAsEntry?.();
      if (!entry) continue;
      const nested = await walkFileEntry(entry, entry.name);
      collected.push(...nested);
    }
    if (collected.length) return collected;
  }

  return Array.from(event.dataTransfer?.files || []);
}

async function walkFileEntry(entry, prefix = "") {
  if (!entry) return [];
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file) => {
        file.foodGigRelativePath = prefix || file.name;
        resolve([file]);
      });
    });
  }

  if (entry.isDirectory) {
    return new Promise((resolve) => {
      const reader = entry.createReader();
      const collected = [];

      const readBatch = () => {
        reader.readEntries(async (entries) => {
          if (!entries.length) {
            resolve(collected);
            return;
          }

          for (const child of entries) {
            const nextPath = prefix ? `${prefix}/${child.name}` : child.name;
            const nested = await walkFileEntry(child, nextPath);
            collected.push(...nested);
          }

          readBatch();
        });
      };

      readBatch();
    });
  }

  return [];
}

async function collectDroppedFiles(event) {
  const transferItems = Array.from(event.dataTransfer?.items || []);
  const hasEntries = transferItems.some((item) => typeof item.webkitGetAsEntry === "function");

  if (hasEntries) {
    const collected = [];
    for (const item of transferItems) {
      const entry = item.webkitGetAsEntry?.();
      if (!entry) continue;
      const nested = await walkFileEntry(entry, entry.name);
      collected.push(...nested);
    }
    if (collected.length) return collected;
  }

  return Array.from(event.dataTransfer?.files || []);
}

async function openFolderPicker() {
  if (window.showDirectoryPicker) {
    try {
      const directoryHandle = await window.showDirectoryPicker({ mode: "read" });
      const files = await walkDirectoryHandle(directoryHandle, directoryHandle.name);
      loadBrowserFiles(files);
      return;
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.warn("Directory picker failed, falling back to input picker", error);
      } else {
        return;
      }
    }
  }

  folderInput?.click();
}

function getPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getPersistedUiState() {
  try {
    const raw = localStorage.getItem(UI_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUiState() {
  const payload = {
    evidenceFilter: evidenceFilter?.value || "all",
    caseFilter: caseFilter?.value || "all",
  };

  try {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Could not persist dashboard UI state", error);
  }
}

function persistState() {
  const payload = {
    orders: state.orders,
    shifts: state.shifts,
    weekly: state.weekly,
    merchants: state.merchants,
    zones: state.zones,
    cases: state.cases,
    evidence: state.evidence,
    selectedEvidenceFile: state.selectedEvidenceFile,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Could not persist dashboard state", error);
  }
}

function applyPersistedState(saved) {
  if (!saved || typeof saved !== "object") return;
  if (Array.isArray(saved.orders)) state.orders = saved.orders;
  if (Array.isArray(saved.shifts)) state.shifts = saved.shifts;
  if (Array.isArray(saved.weekly)) state.weekly = saved.weekly;
  if (Array.isArray(saved.merchants)) state.merchants = saved.merchants;
  if (Array.isArray(saved.zones)) state.zones = saved.zones;
  if (Array.isArray(saved.cases)) state.cases = saved.cases;
  if (Array.isArray(saved.evidence)) state.evidence = saved.evidence;
  if (typeof saved.selectedEvidenceFile === "string") state.selectedEvidenceFile = saved.selectedEvidenceFile;
}

function applyPersistedUiState(saved) {
  if (!saved || typeof saved !== "object") return;
  if (evidenceFilter && typeof saved.evidenceFilter === "string") {
    evidenceFilter.value = saved.evidenceFilter;
  }
  if (caseFilter && typeof saved.caseFilter === "string") {
    caseFilter.value = saved.caseFilter;
  }
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      if (current.length || row.length) {
        row.push(current.trim());
        rows.push(row);
        row = [];
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current.length || row.length) {
    row.push(current.trim());
    rows.push(row);
  }

  const [headers, ...dataRows] = rows;
  if (!headers) return [];

  return dataRows
    .filter((dataRow) => dataRow.some((value) => value !== ""))
    .map((dataRow) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = dataRow[index] ?? "";
      });
      return record;
    });
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function coerceNumber(value) {
  const cleaned = String(value ?? "").replace(/[$,]/g, "").trim();
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values) {
  return values.length ? sum(values) / values.length : 0;
}

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

function setIfPresent(target, key, value) {
  if (value !== undefined && value !== null && String(value).trim() !== "") {
    target[key] = value;
  }
}

function loadOrderRows(rows) {
  state.orders = rows.map((row, index) => ({
    id: row.order_id || `order-${index + 1}`,
    platform: inferPlatform(row.platform || row.app || row.source || "DoorDash"),
    date: row.date || "",
    merchant: row.merchant || "",
    gross: row.final_payout || row.payout_shown || "",
    bonus: row.bonus_amount || row.promotion_bonus || row.challenge_reward || row.bonus || "",
    miles: row.actual_miles || row.shown_miles || "",
    minutes: row.total_minutes || "",
    issue: String(row.issue_flag || "").toLowerCase() === "yes" || String(row.issue_flag || "") === "1" ? "Yes" : "No",
  }));
  persistState();
}

function loadShiftRows(rows) {
  state.shifts = rows.map((row) => ({
    date: row.shift_date || "",
    platform: inferPlatform(row.platform || row.app || row.source || "DoorDash"),
    zone: row.end_zone || row.start_zone || "",
    hours: row.total_hours || "",
    gross: row.gross_earnings || "",
    bonus: row.bonus_earnings || row.bonus_amount || row.promotion_bonus || "",
    perHour: row.earnings_per_hour || "",
    perMile: row.earnings_per_mile || "",
    notes: row.notes || "",
  }));
  persistState();
}

function loadWeeklyRows(rows) {
  state.weekly = rows.map((row) => ({
    week: `${row.week_start || ""} - ${row.week_end || ""}`.trim().replace(/^ - | - $/g, ""),
    gross: row.gross_earnings || "",
    bonus: row.bonus_earnings || row.bonus_amount || row.promotion_bonus || "",
    hours: row.total_hours || "",
    perHour: row.earnings_per_hour || "",
    perMile: row.earnings_per_mile || "",
    issues: row.issue_count || "",
    notes: row.notes || "",
  }));
  persistState();
}

function loadMerchantRows(rows) {
  state.merchants = rows.map((row) => ({
    merchant: row.merchant || "",
    orders: row.total_orders || "",
    problemOrders: row.problem_orders || "",
    wait: row.avg_wait_minutes || "",
    bestZone: row.best_zone || "",
    worstZone: row.worst_zone || "",
  }));
  persistState();
}

function loadZoneRows(rows) {
  state.zones = rows.map((row) => ({
    zone: row.zone || "",
    orders: row.total_orders || "",
    gross: row.gross_earnings || "",
    perHour: row.earnings_per_hour || "",
    perMile: row.earnings_per_mile || "",
    wait: row.avg_wait_minutes || "",
    issues: row.issue_count || "",
  }));
  persistState();
}

function loadCaseRows(rows) {
  state.cases = rows.map((row) => ({
    id: row.case_id || "",
    date: row.date_opened || "",
    merchant: row.merchant || "",
    issue: row.issue_type || "",
    status: row.status || "",
    outcome: row.what_outcome_you_want || row.follow_up || row.what_happened || "",
  }));
  persistState();
}

function syncEvidenceLinks() {
  let changed = false;

  state.evidence = state.evidence.map((entry) => {
    const hasManualOrder = entry.orderMode === "manual";
    const hasManualCase = entry.caseMode === "manual";
    const orderInfo = hasManualOrder
      ? {
          match: entry.order && entry.order !== "-" ? state.orders.find((order) => order.id === entry.order) || null : null,
          confidence: entry.order && entry.order !== "-" ? "manual" : "none",
          reason: entry.order && entry.order !== "-" ? "manual link" : "manual clear",
        }
      : getOrderLinkInfoForEvidence(entry);
    const linkedOrder = orderInfo.match;
    const caseInfo = hasManualCase
      ? {
          match: entry.caseId && entry.caseId !== "-" ? state.cases.find((caseFile) => caseFile.id === entry.caseId) || null : null,
          confidence: entry.caseId && entry.caseId !== "-" ? "manual" : "none",
          reason: entry.caseId && entry.caseId !== "-" ? "manual link" : "manual clear",
        }
      : getCaseLinkInfoForEvidence(entry, linkedOrder);
    const linkedCase = caseInfo.match;
    const orderMode = hasManualOrder ? "manual" : "auto";
    const caseMode = hasManualCase ? "manual" : "auto";
    const nextEntry = {
      ...entry,
      order: orderMode === "manual" ? (entry.order || "-") : linkedOrder?.id || entry.order || "-",
      caseId: caseMode === "manual" ? (entry.caseId || "-") : linkedCase?.id || entry.caseId || "-",
      orderMode,
      caseMode,
      confidence:
        orderMode === "manual" || caseMode === "manual"
          ? `${orderInfo.confidence}/${caseInfo.confidence}`.replace(/^\/|\/$/g, "") || "manual"
          : linkedOrder || linkedCase
            ? `${orderInfo.confidence}/${caseInfo.confidence}`
            : "none",
      confidenceReason:
        orderMode === "manual" || caseMode === "manual"
          ? `${orderInfo.reason}; ${caseInfo.reason}`.replace(/; $/, "").replace(/^; /, "") || "manual override"
          : linkedOrder || linkedCase
            ? `${orderInfo.reason}; ${caseInfo.reason}`
            : "no links",
    };

    if (nextEntry.order !== entry.order || nextEntry.caseId !== entry.caseId) {
      changed = true;
    }

    return nextEntry;
  });

  if (changed) persistState();
}

function recalcSummaryTiles() {
  const totalHours = sum(state.shifts.map((shift) => coerceNumber(shift.hours)));
  const totalGross = sum(state.shifts.map((shift) => coerceNumber(shift.gross)));
  const shiftBonusTotal = sum(state.shifts.map((shift) => coerceNumber(shift.bonus)));
  const totalMiles = sum(state.orders.map((order) => coerceNumber(order.miles)));
  const issueCount = sum(state.orders.map((order) => (order.issue === "Yes" ? 1 : 0)));
  const orderBonusTotal = sum(state.orders.map((order) => coerceNumber(order.bonus)));
  const evidenceBonusTotal = sum(state.evidence.map((entry) => coerceNumber(entry.bonusAmount)));
  const bonusTotal = shiftBonusTotal || orderBonusTotal || evidenceBonusTotal;
  const completedOrders = state.orders.length;
  const weeklyDeliveryGross = totalGross || sum(state.weekly.map((week) => coerceNumber(week.gross)));
  const weeklyGrossWithBonus = weeklyDeliveryGross + bonusTotal;
  const weeklyHours = totalHours || sum(state.weekly.map((week) => coerceNumber(week.hours)));
  const earningsPerHour = weeklyHours ? weeklyDeliveryGross / weeklyHours : 0;
  const earningsPerMile = totalMiles ? weeklyDeliveryGross / totalMiles : 0;
  const todayGross = state.shifts[0]?.gross || money(0);

  state.tiles = [
    { label: "Today Gross", value: todayGross, meta: "Latest shift snapshot", tone: "good" },
    { label: "Week Gross", value: money(weeklyDeliveryGross), meta: "Delivery earnings only", tone: "good" },
    { label: "Bonus Total", value: money(bonusTotal), meta: "Promotion / challenge rewards", tone: "neutral" },
    { label: "Week Total", value: money(weeklyGrossWithBonus), meta: "Delivery + bonus", tone: "good" },
    { label: "Earnings / Hour", value: money(earningsPerHour), meta: "Delivery earnings only", tone: "good" },
    { label: "Earnings / Mile", value: money(earningsPerMile), meta: "Delivery earnings only", tone: "neutral" },
    { label: "Completed Orders", value: String(completedOrders), meta: "Loaded order records", tone: "neutral" },
    { label: "Issue Count", value: String(issueCount), meta: "Loaded issue flags", tone: "warn" },
  ];
}

function renderTiles() {
  document.getElementById("tiles").innerHTML = state.tiles
    .map(
      (tile) => `
        <article class="tile">
          <div class="tile-label">${tile.label}</div>
          <div class="tile-value">${tile.value}</div>
          <div class="tile-meta">${formatTag(tile.tone, tile.meta)}</div>
        </article>
      `,
    )
    .join("");
}

function renderLatestShift() {
  const row = state.shifts[0]
    ? {
        date: state.shifts[0].date,
        platform: state.shifts[0].platform || "DoorDash",
        hours: state.shifts[0].hours,
        gross: state.shifts[0].gross,
        bonus: state.shifts[0].bonus || "$0.00",
        perHour: state.shifts[0].perHour,
        perMile: state.shifts[0].perMile,
        issues: state.shifts[0].notes ? "1" : "0",
      }
    : state.latestShift;
  document.getElementById("latest-shift-row").innerHTML = `
    <tr>
      <td>${row.date}</td>
      <td>${row.platform}</td>
      <td>${row.hours}</td>
      <td>${row.gross}</td>
      <td>${row.bonus}</td>
      <td>${row.perHour}</td>
      <td>${row.perMile}</td>
      <td>${row.issues}</td>
    </tr>
  `;
}

function renderList(target, items) {
  document.getElementById(target).innerHTML = items
    .map(
      (item) => `
        <li>
          <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
            <div>
              <strong>${item.label || item.file || item.merchant || item.id || item.zone || item.week}</strong>
              <div style="color:var(--muted); margin-top:6px;">${item.detail || item.notes || item.outcome || item.status || ""}</div>
            </div>
            ${item.tone ? formatTag(item.tone, item.tone.toUpperCase()) : ""}
          </div>
        </li>
      `,
    )
    .join("");
}

function renderTable(target, rows, columns) {
  document.getElementById(target).innerHTML = rows
    .map(
      (row) => `
        <tr>
          ${columns.map((key) => `<td>${row[key]}</td>`).join("")}
        </tr>
      `,
    )
    .join("");
}

function getVisibleEvidenceRows() {
  const activeFilter = evidenceFilter?.value || "all";
  const filterFn = evidenceFilters[activeFilter] || evidenceFilters.all;
  return state.evidence.filter(filterFn);
}

function renderEvidenceCount(visibleCount, totalCount) {
  if (!evidenceCount) return;
  evidenceCount.textContent = `${visibleCount} of ${totalCount} shown`;
}

function renderEvidenceTypeChips() {
  if (!evidenceTypeChips) return;

  const buckets = {
    offer: 0,
    "dropoff-proof": 0,
    "final-payout": 0,
    other: 0,
  };

  state.evidence.forEach((entry) => {
    if (buckets[entry.type] !== undefined) {
      buckets[entry.type] += 1;
    } else {
      buckets.other += 1;
    }
  });

  evidenceTypeChips.innerHTML = `
    <span class="count-chip subtle">Offer ${buckets.offer}</span>
    <span class="count-chip subtle">Proof ${buckets["dropoff-proof"]}</span>
    <span class="count-chip subtle">Payout ${buckets["final-payout"]}</span>
    <span class="count-chip subtle">Other ${buckets.other}</span>
  `;
}

function renderEvidenceTable() {
  const visibleEvidence = getVisibleEvidenceRows();
  renderEvidenceCount(visibleEvidence.length, state.evidence.length);
  renderEvidenceTypeChips();
  if (!visibleEvidence.length) {
    evidenceTable.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state" style="min-height:140px;">
            <strong>No matching evidence.</strong>
            <span>Try a different filter or clear the search.</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  const rows = visibleEvidence
    .map(
      (row) => {
        const selected = row.file === state.selectedEvidenceFile ? "selected" : "";
        const noteClass = row.notes?.trim() ? "has-note" : "";
        const caseClass = row.caseId && row.caseId !== "-" ? "has-case" : "";
        const confidence = getConfidenceDisplay(row.confidence);
        return `
        <tr class="evidence-row ${selected} ${noteClass} ${caseClass}" data-evidence-file="${escapeHtml(row.file)}">
          <td>${escapeHtml(row.file)}</td>
          <td>${escapeHtml(row.type)}</td>
          <td>${escapeHtml(row.date)}</td>
          <td>${escapeHtml(row.order)}</td>
          <td>${escapeHtml(row.caseId)}</td>
          <td>${formatTag(confidence.tone, confidence.label)}</td>
          <td>${escapeHtml((row.notes || "").slice(0, 44) || "—")}</td>
          <td>${escapeHtml(row.folder)}</td>
        </tr>
      `;
      },
    )
    .join("");

  evidenceTable.innerHTML = rows;
}

function renderCaseTable() {
  const selectedCaseId = getSelectedCaseId();
  const visibleCases = getVisibleCaseRows();
  const totalOpen = state.cases.filter((entry) => String(entry.status || "").toLowerCase() === "open").length;
  const totalClosed = state.cases.filter((entry) => String(entry.status || "").toLowerCase() === "closed").length;
  if (caseStatusCount) {
    caseStatusCount.textContent = `${totalOpen} open / ${totalClosed} closed`;
  }
  if (!visibleCases.length) {
    caseTable.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state" style="min-height:140px;">
            <strong>No matching cases.</strong>
            <span>Try a different case filter.</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const rows = visibleCases
    .map(
      (row) => `
        <tr class="${row.id === selectedCaseId ? "selected" : ""}" data-case-id="${escapeHtml(row.id)}">
          <td>${escapeHtml(row.id)}</td>
          <td>${escapeHtml(row.date)}</td>
          <td>${escapeHtml(row.merchant)}</td>
          <td>${escapeHtml(row.issue)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.outcome)}</td>
        </tr>
      `,
    )
    .join("");

  caseTable.innerHTML = rows;
}

function renderCaseSummary() {
  const selectedCaseId = getSelectedCaseId();
  const caseRecord = selectedCaseId ? state.cases.find((entry) => entry.id === selectedCaseId) : null;

  if (!caseRecord) {
    if (caseEvidenceCount) caseEvidenceCount.textContent = "0 evidence";
    if (casePathStatus) {
      casePathStatus.className = "count-chip warn";
      casePathStatus.textContent = "Path missing";
    }
    caseSummary.innerHTML = `
      <div class="empty-state">
        <strong>No case selected.</strong>
        <span>Select evidence with a linked case to see a summary here.</span>
      </div>
    `;
    return;
  }

  const linkedEvidence = getEvidenceForCase(caseRecord);
  if (caseEvidenceCount) {
    caseEvidenceCount.textContent = `${linkedEvidence.length} evidence${linkedEvidence.length === 1 ? "" : "s"}`;
  }
  if (casePathStatus) {
    const primaryPath = getBrowserEntryForEvidence(linkedEvidence[0])?.path || linkedEvidence[0]?.file || "";
    const hasPath = Boolean(primaryPath);
    casePathStatus.className = `count-chip ${hasPath ? "good" : "warn"}`;
    casePathStatus.textContent = hasPath ? "Path present" : "Path missing";
  }
  if (caseSummaryCopyPathBtn) {
    const primaryPath = getBrowserEntryForEvidence(linkedEvidence[0])?.path || linkedEvidence[0]?.file || "";
    const hasPath = Boolean(primaryPath);
    caseSummaryCopyPathBtn.className = hasPath ? "ghost-button" : "ghost-button disabled-like";
    caseSummaryCopyPathBtn.textContent = hasPath ? "Copy Path" : "Path Missing";
    caseSummaryCopyPathBtn.title = hasPath ? "Copy the primary evidence path" : "No path available for the selected case";
  }
  const firstEvidence = linkedEvidence[0] || null;
  const firstEvidencePath = getBrowserEntryForEvidence(firstEvidence)?.path || firstEvidence?.file || "none";
  caseSummary.innerHTML = `
    <div class="summary-card">
      <div class="summary-row">
        <strong>Case ID</strong>
        <span>${escapeHtml(caseRecord.id)}</span>
      </div>
      <div class="summary-row">
        <strong>Date</strong>
        <span>${escapeHtml(caseRecord.date)}</span>
      </div>
      <div class="summary-row">
        <strong>Merchant</strong>
        <span>${escapeHtml(caseRecord.merchant)}</span>
      </div>
      <div class="summary-row">
        <strong>Issue</strong>
        <span>${escapeHtml(caseRecord.issue)}</span>
      </div>
      <div class="summary-row">
        <strong>Status</strong>
        <span>${escapeHtml(caseRecord.status)}</span>
      </div>
      <div class="summary-row">
        <strong>Outcome</strong>
        <span>${escapeHtml(caseRecord.outcome)}</span>
      </div>
      <div class="summary-row">
        <strong>Primary Path</strong>
        <span>${escapeHtml(firstEvidencePath)}</span>
      </div>
      <div class="summary-row">
        <strong>First Evidence</strong>
        <button type="button" class="summary-link" data-evidence-file="${escapeHtml(firstEvidence?.file || "")}" ${firstEvidence ? "" : "disabled"}>${escapeHtml(firstEvidence?.file || "none")}</button>
      </div>
      <div class="summary-row">
        <strong>Evidence Count</strong>
        <span>${linkedEvidence.length}</span>
      </div>
      <div class="summary-list">
        <strong>Linked Evidence</strong>
        <ul>
          ${
            linkedEvidence.length
              ? linkedEvidence
                  .map((entry) => {
                    const browserEntry = getBrowserEntryForEvidence(entry);
                    return `<li><strong>${escapeHtml(entry.file)}</strong><span>${escapeHtml(browserEntry?.path || entry.file)}</span></li>`;
                  })
                  .join("")
              : "<li>None linked yet.</li>"
          }
        </ul>
      </div>
    </div>
  `;
}

caseSummary?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-evidence-file]");
  if (!button) return;
  openEvidenceByFile(button.dataset.evidenceFile || "");
});

function setView(view) {
  state.view = view;
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  views.forEach((section) => section.classList.toggle("active", section.id === `${view}-view`));
  viewTitle.textContent = viewMeta[view].title;
  viewDescription.textContent = viewMeta[view].description;
}

browserTree?.addEventListener("click", (event) => {
  const fileButton = event.target.closest("[data-file-path]");
  if (!fileButton) return;
  browserState.selectedPath = fileButton.dataset.filePath || "";
  const browserFileName = browserState.selectedPath.split("/").pop() || "";
  const matchingEvidence = state.evidence.find((entry) => normalizeKey(entry.file) === normalizeKey(browserFileName));
  if (matchingEvidence) {
    state.selectedEvidenceFile = matchingEvidence.file;
    persistState();
  }
  renderAll();
  renderFileBrowser();
});

browserDropzone?.addEventListener("dragenter", (event) => {
  event.preventDefault();
  browserDropzone.classList.add("dragover");
});

browserDropzone?.addEventListener("dragover", (event) => {
  event.preventDefault();
  browserDropzone.classList.add("dragover");
});

browserDropzone?.addEventListener("dragleave", () => {
  browserDropzone.classList.remove("dragover");
});

browserDropzone?.addEventListener("drop", async (event) => {
  event.preventDefault();
  browserDropzone.classList.remove("dragover");
  const files = await collectDroppedFiles(event);
  if (files.length) {
    loadBrowserFiles(files);
  }
});

browserSearch?.addEventListener("input", (event) => {
  browserState.searchTerm = event.target.value || "";
  renderFileBrowser();
});

evidenceFilter?.addEventListener("change", () => {
  persistUiState();
  renderEvidenceTable();
});

caseFilter?.addEventListener("change", () => {
  persistUiState();
  renderCaseTable();
  renderCaseSummary();
});

evidenceTable?.addEventListener("click", (event) => {
  const row = event.target.closest("[data-evidence-file]");
  if (!row) return;
  setSelectedEvidence(row.dataset.evidenceFile || "");
});

caseTable?.addEventListener("click", (event) => {
  const row = event.target.closest("[data-case-id]");
  if (!row) return;
  const linkedEvidence = getEvidenceForCaseId(row.dataset.caseId || "");
  if (linkedEvidence) {
    setSelectedEvidence(linkedEvidence.file);
  }
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.getElementById("refresh-btn").addEventListener("click", () => {
  renderAll();
});

browseFolderBtn?.addEventListener("click", () => {
  openFolderPicker().catch((error) => {
    console.error("Failed to open folder picker", error);
  });
});

clearBrowserBtn?.addEventListener("click", () => {
  if (browserState.objectUrl) {
    URL.revokeObjectURL(browserState.objectUrl);
    browserState.objectUrl = "";
  }
  if (browserState.detailObjectUrl) {
    URL.revokeObjectURL(browserState.detailObjectUrl);
    browserState.detailObjectUrl = "";
  }
  browserState.entries = [];
  browserState.selectedPath = "";
  browserState.rootName = "No folder selected";
  browserState.searchTerm = "";
  if (browserSearch) browserSearch.value = "";
  renderFileBrowser();
});

evidenceDetailSave?.addEventListener("click", () => updateEvidenceLink("manual"));
evidenceDetailAuto?.addEventListener("click", () => updateEvidenceLink("auto"));
evidenceDetailClear?.addEventListener("click", () => {
  const evidence = getSelectedEvidence();
  if (!evidence) return;
  state.evidence = state.evidence.map((entry) =>
    entry.file === evidence.file
      ? { ...entry, order: "-", caseId: "-", orderMode: "manual", caseMode: "manual", confidence: "manual", confidenceReason: "manual clear" }
      : entry,
  );
  persistState();
  renderAll();
});
evidenceDetailCreateCase?.addEventListener("click", () => createCaseFromSelectedEvidence());
evidenceDetailCopyName?.addEventListener("click", () => {
  const evidence = getSelectedEvidence();
  if (!evidence) return;
  copyEvidenceText(evidence.file, "File name");
});
evidenceDetailCopyPath?.addEventListener("click", () => {
  const evidence = getSelectedEvidence();
  if (!evidence) return;
  const browserEntry = getBrowserEntryForEvidence(evidence);
  copyEvidenceText(browserEntry?.path || evidence.file, "File path");
});
evidenceCopySelectedPath?.addEventListener("click", () => {
  const evidence = getSelectedEvidence();
  if (!evidence) return;
  const browserEntry = getBrowserEntryForEvidence(evidence);
  copyEvidenceText(browserEntry?.path || evidence.file, "Selected path");
});
evidenceDetailExportCase?.addEventListener("click", () => exportSelectedEvidenceSummary());
caseExportPacketBtn?.addEventListener("click", () => exportSelectedCasePacket());
caseSummaryCopyBtn?.addEventListener("click", () => copyCasePacketToClipboard());
caseSummaryCopyPathBtn?.addEventListener("click", () => copySelectedCasePrimaryPath());

evidenceNotes?.addEventListener("input", (event) => {
  updateEvidenceNotes(event.target.value || "");
});

evidenceOcrText?.addEventListener("input", (event) => {
  updateEvidenceOcrText(event.target.value || "");
});

function renderAll() {
  syncEvidenceLinks();
  if (state.selectedEvidenceFile && !state.evidence.some((entry) => entry.file === state.selectedEvidenceFile)) {
    state.selectedEvidenceFile = state.evidence[0]?.file || "";
  }
  if (!state.selectedEvidenceFile && state.evidence.length) {
    state.selectedEvidenceFile = state.evidence[0].file;
  }
  recalcSummaryTiles();
  renderTiles();
  renderLatestShift();
  renderList("friction-list", state.friction);
  renderEvidenceTable();
  renderEvidenceDetail();
  renderTable("order-table", state.orders, ["id", "date", "merchant", "gross", "bonus", "miles", "minutes", "issue"]);
  renderTable("shift-table", state.shifts, ["date", "zone", "hours", "gross", "perHour", "perMile", "notes"]);
  renderTable("weekly-table", state.weekly, ["week", "gross", "bonus", "hours", "perHour", "perMile", "issues", "notes"]);
  renderTable("merchant-table", state.merchants, ["merchant", "orders", "problemOrders", "wait", "bestZone", "worstZone"]);
  renderTable("zone-table", state.zones, ["zone", "orders", "gross", "perHour", "perMile", "wait", "issues"]);
  renderCaseTable();
  renderCaseSummary();
}

async function handleCsvUpload(key, file) {
  if (!file) return;
  const text = await readFileAsText(file);
  const rows = parseCSV(text);

  switch (key) {
    case "orders":
      loadOrderRows(rows);
      break;
    case "shifts":
      loadShiftRows(rows);
      break;
    case "weekly":
      loadWeeklyRows(rows);
      break;
    case "merchants":
      loadMerchantRows(rows);
      break;
    case "zones":
      loadZoneRows(rows);
      break;
    case "cases":
      loadCaseRows(rows);
      break;
    default:
      break;
  }

  renderAll();
}

document.getElementById("clear-storage-btn")?.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(UI_STATE_KEY);
  location.reload();
});

Object.entries(csvInputs).forEach(([key, input]) => {
  input?.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    handleCsvUpload(key, file).catch((error) => {
      console.error(`Failed to load ${key} CSV`, error);
    });
  });
});

folderInput?.addEventListener("change", (event) => {
  const files = Array.from(event.target.files || []);
  loadBrowserFiles(files);
  folderInput.value = "";
});

const savedState = getPersistedState();
applyPersistedUiState(getPersistedUiState());
if (savedState) {
  applyPersistedState(savedState);
}

renderAll();
setView("home");
