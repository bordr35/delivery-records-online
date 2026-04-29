const APP_VERSION = "2.1.0";
const STORE = "delivery_records_online_v2";
const LEGACY_STORE = "delivery_records_online_v1";
const DRAFTS = "delivery_records_drafts_v2";
const PROOFS = "delivery_records_proof_shots_v1";
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const apps = ["", "Uber Eats", "DoorDash", "Grubhub", "Instacart", "Spark", "Roadie", "Amazon Flex", "Other"];
const issueTypes = ["", "Missing Pay", "Wrong Pay", "Customer Claim", "Non-delivery Claim", "Contract Violation", "Deactivation Warning", "Merchant Issue", "Safety Issue", "App Bug", "Other"];
let currentPage = "dashboard";
let currentExport = { filename: "record.txt", text: "" };

const safeJson = (text, fallback) => {
  if (text == null || text === "") return fallback;
  try {
    const parsed = JSON.parse(text);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
};
const todayIso = () => new Date().toISOString().slice(0, 10);
const fmtDate = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString() : "";
const fmtDateTime = value => value ? new Date(value).toLocaleString() : "";
const slug = value => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 34);
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
const appCode = value => ({
  "Uber Eats": "ue",
  DoorDash: "dd",
  Grubhub: "gh",
  Instacart: "ic",
  Spark: "spark",
  Roadie: "roadie",
  "Amazon Flex": "flex",
  Other: "other"
}[value] || slug(value) || "app");
const money = value => {
  const n = Number(value);
  return Number.isFinite(n) && value !== "" ? `$${n.toFixed(2)}` : "";
};
const num = value => {
  const n = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const titleCase = value => String(value || "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const field = (id, label, type = "text", attrs = "") =>
  `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" ${attrs}></div>`;
const textarea = (id, label, attrs = "") =>
  `<div class="field full"><label for="${id}">${label}</label><textarea id="${id}" name="${id}" ${attrs}></textarea></div>`;
const select = (id, label, opts = apps) =>
  `<div class="field"><label for="${id}">${label}</label><select id="${id}" name="${id}">${opts.map(opt => `<option value="${opt}">${opt}</option>`).join("")}</select></div>`;
const toggle = (id, label, opts = ["Yes", "No"]) =>
  `<div class="field"><label>${label}</label><div class="toggle" data-name="${id}">${opts.map(opt => `<button class="pill" type="button" data-val="${opt}">${opt}</button>`).join("")}</div></div>`;
const panel = (title, description, body) => `
  <section class="panel">
    <div class="panel-head"><div><h3>${title}</h3>${description ? `<p>${description}</p>` : ""}</div></div>
    <div class="panel-body"><div class="field-grid">${body}</div></div>
  </section>`;

const formDefs = {
  daily: {
    label: "Daily Log",
    folder: "01_Daily_Logs",
    filename: data => `${data["dl-date"] || todayIso()}_${appCode(data["dl-app"])}_${slug(data["dl-zone"]) || "zone"}_dailylog.txt`,
    fields: ["dl-date","dl-app","dl-zone","dl-start","dl-end","dl-online","dl-active","dl-deliveries","dl-odo-start","dl-odo-end","dl-miles","dl-gas","dl-tolls","dl-parking","dl-other-exp","dl-other-note","dl-base","dl-tips","dl-bonus","dl-adjust","dl-cash","dl-total","dl-payout","dl-pay-ss","dl-order-screen","dl-pickup","dl-dropoff","dl-payout-proof","dl-orders","dl-merchants","dl-case","dl-support","dl-safety","dl-issues","dl-made-money","dl-wasted","dl-remember"],
    labels: {
      "dl-date":"Date","dl-app":"App","dl-zone":"Zone","dl-start":"Start Time","dl-end":"End Time","dl-online":"Online Time","dl-active":"Active Time","dl-deliveries":"Delivery Count","dl-odo-start":"Start Odometer","dl-odo-end":"End Odometer","dl-miles":"Miles Driven","dl-gas":"Gas","dl-tolls":"Tolls","dl-parking":"Parking","dl-other-exp":"Other Expense","dl-other-note":"Other Expense Note","dl-base":"Base Pay","dl-tips":"Tips","dl-bonus":"Bonus / Promo","dl-adjust":"Adjustment","dl-cash":"Cash Collected","dl-total":"Total Earnings","dl-payout":"Payout Method","dl-pay-ss":"Payout Screenshot Saved","dl-order-screen":"Order Screen Saved","dl-pickup":"Pickup Proof Saved","dl-dropoff":"Dropoff Proof Saved","dl-payout-proof":"Payout Screenshot Saved","dl-orders":"Important Order Numbers","dl-merchants":"Merchants With Issues","dl-case":"Case Number","dl-support":"Support Contacted","dl-safety":"Safety Concern","dl-issues":"Issue Notes","dl-made-money":"What Made Money","dl-wasted":"What Wasted Time","dl-remember":"Remember Next Time"
    },
    render: () => `
      <div class="filename-bar"><span>Filename</span><b data-filename="daily"></b></div>
      ${panel("Shift Info", "Enough detail to reconstruct your day later.", field("dl-date","Date","date")+select("dl-app","App")+field("dl-zone","Zone")+field("dl-start","Start Time","time")+field("dl-end","End Time","time")+field("dl-online","Online Time")+field("dl-active","Active Time")+field("dl-deliveries","Delivery Count","number","min='0'"))}
      ${panel("Mileage & Costs", "Odometer math auto-fills miles when possible.", field("dl-odo-start","Start Odometer","number")+field("dl-odo-end","End Odometer","number")+field("dl-miles","Miles Driven","number","step='0.1'")+field("dl-gas","Gas","number","step='0.01'")+field("dl-tolls","Tolls","number","step='0.01'")+field("dl-parking","Parking","number","step='0.01'")+field("dl-other-exp","Other Expense","number","step='0.01'")+field("dl-other-note","Other Expense Note"))}
      ${panel("Earnings", "Total earnings auto-fills from base, tips, bonus, and adjustment.", field("dl-base","Base Pay","number","step='0.01'")+field("dl-tips","Tips","number","step='0.01'")+field("dl-bonus","Bonus / Promo","number","step='0.01'")+field("dl-adjust","Adjustment","number","step='0.01'")+field("dl-cash","Cash Collected","number","step='0.01'")+field("dl-total","Total Earnings","number","step='0.01'")+select("dl-payout","Payout Method",["","Instant deposit","Weekly deposit","Stripe","Direct deposit","Other"])+toggle("dl-pay-ss","Payout Screenshot Saved"))}
      ${panel("Proof & Issues", "This is the part that saves you when memory gets fuzzy.", toggle("dl-order-screen","Order Screen Saved")+toggle("dl-pickup","Pickup Proof Saved")+toggle("dl-dropoff","Dropoff Proof Saved")+toggle("dl-payout-proof","Payout Screenshot Saved")+field("dl-orders","Important Order Numbers")+field("dl-merchants","Merchants With Issues")+field("dl-case","Case Number")+toggle("dl-support","Support Contacted")+toggle("dl-safety","Safety Concern")+textarea("dl-issues","Issue Notes")+field("dl-made-money","What Made Money")+field("dl-wasted","What Wasted Time")+field("dl-remember","Remember Next Time"))}`
  },
  proof: {
    label: "Proof Note",
    folder: "03_Proof_Photos",
    filename: data => `${data["pf-date"] || todayIso()}_${appCode(data["pf-app"])}_${slug(data["pf-zone"]) || "zone"}_${slug(data["pf-order"]) || "proof"}_proofnote.txt`,
    fields: ["pf-date","pf-app","pf-zone","pf-order","pf-merch","pf-cust","pf-pickup","pf-dropoff","pf-addr","pf-ts","pf-link","pf-notes"],
    labels: {"pf-date":"Date","pf-app":"App","pf-zone":"Zone","pf-order":"Order Number","pf-merch":"Merchant","pf-cust":"Customer Tag","pf-pickup":"Pickup Proof Saved","pf-dropoff":"Dropoff Proof Saved","pf-addr":"Address Visible","pf-ts":"Timestamp Visible","pf-link":"Linked Support Issue","pf-notes":"Notes"},
    render: () => `<div class="filename-bar"><span>Filename</span><b data-filename="proof"></b></div>${panel("Proof Photo Note", "Track what the proof image proves, not just that it exists.", field("pf-date","Date","date")+select("pf-app","App")+field("pf-zone","Zone")+field("pf-order","Order Number")+field("pf-merch","Merchant")+field("pf-cust","Customer Tag")+toggle("pf-pickup","Pickup Proof Saved")+toggle("pf-dropoff","Dropoff Proof Saved")+toggle("pf-addr","Address Visible")+toggle("pf-ts","Timestamp Visible")+field("pf-link","Linked Support Issue")+textarea("pf-notes","Notes"))}`
  },
  dispute: {
    label: "Dispute / Support",
    folder: "04_Disputes_Support",
    filename: data => `${data["ds-date"] || todayIso()}_${appCode(data["ds-app"])}_${slug(data["ds-order"] || data["ds-zone"]) || "case"}_support_issue.txt`,
    fields: ["ds-date","ds-app","ds-zone","ds-order","ds-merch","ds-cust","ds-type","ds-what","ds-time","ds-contacted","ds-method","ds-rep","ds-case","ds-money","ds-proof","ds-screenshots","ds-followup","ds-request","ds-outcome","ds-notes"],
    labels: {"ds-date":"Date","ds-app":"App","ds-zone":"Zone","ds-order":"Order Number","ds-merch":"Merchant","ds-cust":"Customer Tag","ds-type":"Issue Type","ds-what":"What Happened","ds-time":"Time Issue Started","ds-contacted":"Support Contacted","ds-method":"Support Method","ds-rep":"Support Rep","ds-case":"Case Number","ds-money":"Money At Stake","ds-proof":"Proof Saved","ds-screenshots":"Screenshots Saved","ds-followup":"Need Follow-Up","ds-request":"Requested Outcome","ds-outcome":"Actual Outcome","ds-notes":"Notes"},
    render: () => `<div class="filename-bar"><span>Filename</span><b data-filename="dispute"></b></div>${panel("Support Issue", "Write this like future-you is building a case file.", field("ds-date","Date","date")+select("ds-app","App")+field("ds-zone","Zone")+field("ds-order","Order Number")+field("ds-merch","Merchant")+field("ds-cust","Customer Tag")+select("ds-type","Issue Type",issueTypes)+textarea("ds-what","What Happened")+field("ds-time","Time Issue Started","time")+toggle("ds-contacted","Support Contacted")+toggle("ds-method","Support Method",["Chat","Phone","Email"])+field("ds-rep","Support Rep")+field("ds-case","Case Number")+field("ds-money","Money At Stake","number","step='0.01'")+toggle("ds-proof","Proof Saved")+toggle("ds-screenshots","Screenshots Saved")+toggle("ds-followup","Need Follow-Up")+field("ds-request","Requested Outcome")+field("ds-outcome","Actual Outcome")+textarea("ds-notes","Notes"))}`
  },
  receipt: {
    label: "Receipt / Invoice",
    folder: "02_Receipts_Invoices",
    filename: data => `${data["rc-date"] || todayIso()}_${appCode(data["rc-app"])}_${slug(data["rc-merch"]) || "merchant"}_receipt.txt`,
    fields: ["rc-date","rc-merch","rc-app","rc-zone","rc-type","rc-amount","rc-payment","rc-tax","rc-folder","rc-item","rc-sub","rc-tax-amt","rc-tip","rc-total","rc-order","rc-ss","rc-link","rc-notes"],
    labels: {"rc-date":"Date","rc-merch":"Merchant / Sender","rc-app":"App","rc-zone":"Zone","rc-type":"Type","rc-amount":"Amount","rc-payment":"Payment Method","rc-tax":"Tax-Related","rc-folder":"Saved To Folder","rc-item":"Item Or Service","rc-sub":"Subtotal","rc-tax-amt":"Tax","rc-tip":"Tip","rc-total":"Total","rc-order":"Order Number","rc-ss":"Screenshot / PDF Saved","rc-link":"Linked Daily Log","rc-notes":"Notes"},
    render: () => `<div class="filename-bar"><span>Filename</span><b data-filename="receipt"></b></div>${panel("Receipt Details", "Capture tax and reimbursement context while it is fresh.", field("rc-date","Date","date")+field("rc-merch","Merchant / Sender")+select("rc-app","App")+field("rc-zone","Zone")+toggle("rc-type","Type",["Receipt","Invoice","Bill","Estimate"])+field("rc-amount","Amount","number","step='0.01'")+field("rc-payment","Payment Method")+toggle("rc-tax","Tax-Related",["Yes","No","Maybe"])+field("rc-folder","Saved To Folder"))}${panel("Line Items & Links", "", field("rc-item","Item Or Service")+field("rc-sub","Subtotal","number","step='0.01'")+field("rc-tax-amt","Tax","number","step='0.01'")+field("rc-tip","Tip","number","step='0.01'")+field("rc-total","Total","number","step='0.01'")+field("rc-order","Order Number")+toggle("rc-ss","Screenshot / PDF Saved")+field("rc-link","Linked Daily Log")+textarea("rc-notes","Notes"))}`
  },
  mileage: {
    label: "Mileage",
    folder: "06_Mileage_Expenses",
    filename: data => `${data["ml-date"] || todayIso()}_${appCode(data["ml-app"])}_${slug(data["ml-zone"]) || "zone"}_mileage.txt`,
    fields: ["ml-date","ml-app","ml-zone","ml-odo-start","ml-odo-end","ml-miles","ml-reason","ml-link"],
    labels: {"ml-date":"Date","ml-app":"App","ml-zone":"Zone","ml-odo-start":"Start Odometer","ml-odo-end":"End Odometer","ml-miles":"Miles Driven","ml-reason":"Reason / Shift Note","ml-link":"Linked Daily Log"},
    render: () => `<div class="filename-bar"><span>Log file</span><b>06_Mileage_Expenses / mileage_log.txt</b></div>${panel("Mileage Entry", "Odometer math auto-fills miles.", field("ml-date","Date","date")+select("ml-app","App")+field("ml-zone","Zone")+field("ml-odo-start","Start Odometer","number")+field("ml-odo-end","End Odometer","number")+field("ml-miles","Miles Driven","number","step='0.1'")+field("ml-reason","Reason / Shift Note")+field("ml-link","Linked Daily Log"))}`
  },
  expense: {
    label: "Expense",
    folder: "06_Mileage_Expenses",
    filename: data => `${data["ex-date"] || todayIso()}_${slug(data["ex-merch"]) || "merchant"}_expense.txt`,
    fields: ["ex-date","ex-type","ex-merch","ex-amount","ex-payment","ex-tax","ex-receipt","ex-reason","ex-notes"],
    labels: {"ex-date":"Date","ex-type":"Type","ex-merch":"Merchant","ex-amount":"Amount","ex-payment":"Payment Method","ex-tax":"Tax-Related","ex-receipt":"Receipt File","ex-reason":"Business Reason","ex-notes":"Notes"},
    render: () => `<div class="filename-bar"><span>Log file</span><b>06_Mileage_Expenses / expense_log.txt</b></div>${panel("Expense Entry", "Useful for taxes, reimbursements, and weekly profitability.", field("ex-date","Date","date")+select("ex-type","Type",["","Gas / Fuel","Vehicle maintenance","Phone / Service","Supplies","Food during shift","Parking","Tolls","Insurance","Other"])+field("ex-merch","Merchant")+field("ex-amount","Amount","number","step='0.01'")+field("ex-payment","Payment Method")+toggle("ex-tax","Tax-Related",["Yes","No","Maybe"])+field("ex-receipt","Receipt File")+field("ex-reason","Business Reason")+textarea("ex-notes","Notes"))}`
  },
  weekly: {
    label: "Weekly Review",
    folder: "05_Weekly_Reviews",
    filename: data => `${data["wk-date"] || todayIso()}_weeklyreview.txt`,
    fields: ["wk-date","wk-apps","wk-zones","wk-days","wk-earn","wk-miles","wk-gas","wk-tolls","wk-parking","wk-other","wk-net","wk-adjust","wk-best-app","wk-best-zone","wk-best-time","wk-worst-time","wk-slow","wk-avoid","wk-notes","wk-keep","wk-less","wk-watch","wk-fix"],
    labels: {"wk-date":"Week Of","wk-apps":"Apps Used","wk-zones":"Main Zones","wk-days":"Days Worked","wk-earn":"Total Earnings","wk-miles":"Total Miles","wk-gas":"Gas","wk-tolls":"Tolls","wk-parking":"Parking","wk-other":"Other Expenses","wk-net":"Net Before Taxes","wk-adjust":"Adjustments / Missing Pay","wk-best-app":"Best App","wk-best-zone":"Best Zone","wk-best-time":"Best Time","wk-worst-time":"Worst Time","wk-slow":"Slow Merchants","wk-avoid":"Zones To Avoid","wk-notes":"Notes For Later Analysis","wk-keep":"Keep Doing","wk-less":"Do Less Of","wk-watch":"Watch Out For","wk-fix":"Fix Next Week"},
    render: () => `<div class="filename-bar"><span>Filename</span><b data-filename="weekly"></b></div>${panel("Week Overview", "Turn scattered days into decisions.", field("wk-date","Week Of","date")+field("wk-apps","Apps Used")+field("wk-zones","Main Zones")+field("wk-days","Days Worked","number","min='0' max='7'"))}${panel("Totals", "Net auto-fills from earnings minus listed expenses.", field("wk-earn","Total Earnings","number","step='0.01'")+field("wk-miles","Total Miles","number","step='0.1'")+field("wk-gas","Gas","number","step='0.01'")+field("wk-tolls","Tolls","number","step='0.01'")+field("wk-parking","Parking","number","step='0.01'")+field("wk-other","Other Expenses","number","step='0.01'")+field("wk-net","Net Before Taxes","number","step='0.01'")+field("wk-adjust","Adjustments / Missing Pay"))}${panel("Patterns & Next Week", "", field("wk-best-app","Best App")+field("wk-best-zone","Best Zone")+field("wk-best-time","Best Time")+field("wk-worst-time","Worst Time")+field("wk-slow","Slow Merchants")+field("wk-avoid","Zones To Avoid")+textarea("wk-notes","Notes For Later Analysis")+field("wk-keep","Keep Doing")+field("wk-less","Do Less Of")+field("wk-watch","Watch Out For")+field("wk-fix","Fix Next Week"))}`
  }
};

function rawRecords() {
  const records = safeJson(localStorage.getItem(STORE), null);
  if (Array.isArray(records)) return records;
  const legacy = safeJson(localStorage.getItem(LEGACY_STORE), []);
  if (!Array.isArray(legacy) || !legacy.length) return [];
  const migrated = legacy.map(item => ({
    id: item.id || crypto.randomUUID(),
    type: item.form || "legacy",
    filename: item.filename || "legacy-record.txt",
    folder: formDefs[item.form]?.folder || "Imported",
    data: item.data || {},
    text: item.text || "",
    createdAt: item.saved || new Date().toISOString(),
    updatedAt: item.saved || new Date().toISOString(),
    status: "saved",
    tags: []
  }));
  localStorage.setItem(STORE, JSON.stringify(migrated));
  return migrated;
}
function saveRecords(records) {
  localStorage.setItem(STORE, JSON.stringify(records));
}
function drafts() {
  return safeJson(localStorage.getItem(DRAFTS), {});
}
function saveDrafts(value) {
  localStorage.setItem(DRAFTS, JSON.stringify(value));
}
function proofShots() {
  const shots = safeJson(localStorage.getItem(PROOFS), []);
  return Array.isArray(shots) ? shots : [];
}
function saveProofShots(value) {
  localStorage.setItem(PROOFS, JSON.stringify(value));
}
function getRecord(id) {
  return rawRecords().find(record => String(record.id) === String(id));
}

function collectData(type) {
  const page = $(`#page-${type}`);
  const data = {};
  $$("input, select, textarea", page).forEach(el => {
    data[el.name || el.id] = el.value.trim();
  });
  $$(".toggle", page).forEach(el => {
    data[el.dataset.name] = $(".pill.on", el)?.dataset.val || "";
  });
  return data;
}
function fillForm(type, data = {}) {
  const page = $(`#page-${type}`);
  if (!page) return;
  $$("input, select, textarea", page).forEach(el => {
    const key = el.name || el.id;
    el.value = data[key] ?? (el.type === "date" ? todayIso() : "");
  });
  $$(".toggle", page).forEach(group => {
    $$(".pill", group).forEach(pill => pill.classList.toggle("on", data[group.dataset.name] === pill.dataset.val));
  });
  autoCalc();
  updateFilenames();
}
function saveDraft(type) {
  if (!formDefs[type]) return;
  const next = drafts();
  next[type] = collectData(type);
  saveDrafts(next);
}
function clearDraft(type) {
  const next = drafts();
  delete next[type];
  saveDrafts(next);
}
function hasUsefulData(type) {
  const data = collectData(type);
  return Object.entries(data).some(([key, value]) => value && !key.endsWith("-date") && !["dl-date","pf-date","ds-date","rc-date","ml-date","ex-date","wk-date"].includes(key));
}
function buildText(type, data) {
  const def = formDefs[type];
  const lines = [
    def.label.toUpperCase(),
    "=".repeat(58),
    `File name: ${def.filename(data)}`,
    `Folder: ${def.folder}`,
    `Created: ${new Date().toLocaleString()}`,
    ""
  ];
  def.fields.forEach(key => lines.push(`${def.labels[key] || titleCase(key)}: ${data[key] || ""}`));
  return lines.join("\n");
}
function saveForm(type, options = {}) {
  autoCalc();
  if (!hasUsefulData(type)) {
    toast("Fill in at least one non-date field first.", "err");
    return null;
  }
  const data = collectData(type);
  const def = formDefs[type];
  const record = {
    id: crypto.randomUUID(),
    type,
    filename: def.filename(data),
    folder: def.folder,
    data,
    text: buildText(type, data),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: data["ds-followup"] === "Yes" ? "follow-up" : "saved",
    tags: buildTags(type, data)
  };
  saveRecords([record, ...rawRecords()]);
  clearDraft(type);
  updateAll();
  toast(options.toast || `Saved ${record.filename}`);
  return record;
}
function buildTags(type, data) {
  const tags = [type];
  ["ds-type","dl-safety","rc-tax","ex-tax"].forEach(key => {
    if (data[key]) tags.push(slug(data[key]));
  });
  if (data["ds-followup"] === "Yes") tags.push("follow-up");
  return [...new Set(tags)].filter(Boolean);
}

function autoCalc() {
  const pairs = [
    ["dl-odo-start", "dl-odo-end", "dl-miles"],
    ["ml-odo-start", "ml-odo-end", "ml-miles"]
  ];
  pairs.forEach(([start, end, target]) => {
    const el = $(`#${target}`);
    const miles = num($(`#${end}`)?.value) - num($(`#${start}`)?.value);
    if (el && miles > 0 && (!el.value || document.activeElement?.id !== target)) el.value = miles.toFixed(1);
  });
  const dailyTotal = num($("#dl-base")?.value) + num($("#dl-tips")?.value) + num($("#dl-bonus")?.value) + num($("#dl-adjust")?.value);
  if ($("#dl-total") && dailyTotal > 0 && document.activeElement?.id !== "dl-total") $("#dl-total").value = dailyTotal.toFixed(2);
  const receiptTotal = num($("#rc-sub")?.value) + num($("#rc-tax-amt")?.value) + num($("#rc-tip")?.value);
  if ($("#rc-total") && receiptTotal > 0 && document.activeElement?.id !== "rc-total") $("#rc-total").value = receiptTotal.toFixed(2);
  const weeklyNet = num($("#wk-earn")?.value) - num($("#wk-gas")?.value) - num($("#wk-tolls")?.value) - num($("#wk-parking")?.value) - num($("#wk-other")?.value);
  if ($("#wk-net") && weeklyNet !== 0 && document.activeElement?.id !== "wk-net") $("#wk-net").value = weeklyNet.toFixed(2);
}
function filenameFor(type) {
  const def = formDefs[type];
  return def ? def.filename(collectData(type)) : "";
}
function updateFilenames() {
  $$("[data-filename]").forEach(el => {
    el.textContent = filenameFor(el.dataset.filename);
  });
}

function metrics() {
  const records = rawRecords();
  const today = todayIso();
  const todays = records.filter(record => (record.data?.[`${prefix(record.type)}-date`] || record.createdAt?.slice(0, 10)) === today);
  const moneyToday = todays.reduce((sum, record) => sum + num(record.data?.["dl-total"]) + num(record.data?.["ex-amount"]) * -1, 0);
  const milesToday = todays.reduce((sum, record) => sum + num(record.data?.["dl-miles"]) + num(record.data?.["ml-miles"]), 0);
  const followUps = records.filter(record => record.status === "follow-up" || record.data?.["ds-followup"] === "Yes").length;
  const disputes = records.filter(record => record.type === "dispute").length;
  return { records, todays, moneyToday, milesToday, followUps, disputes };
}
function prefix(type) {
  return { daily:"dl", proof:"pf", dispute:"ds", receipt:"rc", mileage:"ml", expense:"ex", weekly:"wk" }[type] || type;
}
function renderDashboard() {
  const m = metrics();
  return `
    <section class="hero">
      <div class="hero-card">
        <div class="eyebrow">Shift command center · v${APP_VERSION}</div>
        <h3>Capture now.<br>Fight clean later.</h3>
        <p>This is built for the ugly real-world stuff: missing pay, support chats, customer claims, proof photos, mileage, taxes, and the packet you need when a platform says you did something wrong.</p>
        <div class="hero-actions">
          <a class="btn primary" href="#quick" data-page-jump="quick">Start Quick Capture</a>
          <a class="btn ghost" href="#dispute" data-page-jump="dispute">Log Dispute</a>
          <a class="btn ghost" href="#packet" data-page-jump="packet">Build Violation Packet</a>
        </div>
      </div>
      <div class="status-card panel">
        <div class="eyebrow">Today</div>
        <div class="status-list">
          <div class="status-chip"><span>Saved today</span><strong>${m.todays.length}</strong></div>
          <div class="status-chip"><span>Follow-ups</span><strong>${m.followUps}</strong></div>
          <div class="status-chip"><span>Dispute records</span><strong>${m.disputes}</strong></div>
          <div class="status-chip"><span>Storage</span><strong>Browser private</strong></div>
        </div>
      </div>
    </section>
    <section class="metrics">
      <div class="metric"><span class="metric-label">Total Records</span><strong class="metric-value">${m.records.length}</strong></div>
      <div class="metric"><span class="metric-label">Today Net</span><strong class="metric-value blue">${money(m.moneyToday) || "$0.00"}</strong></div>
      <div class="metric"><span class="metric-label">Today Miles</span><strong class="metric-value yellow">${m.milesToday.toFixed(1)}</strong></div>
      <div class="metric"><span class="metric-label">Open Follow-Up</span><strong class="metric-value red">${m.followUps}</strong></div>
    </section>
    <div class="rule yellow"><h3>JSON is not the fight file</h3>JSON backup only restores this app. For a violation, save Dispute / Support and Proof Notes, then use Violation Packet for the copy/paste appeal and evidence timeline.</div>
    ${renderRecentRecords(m.records.slice(0, 5), "Latest Records")}`;
}
function renderQuick() {
  return `
    <section class="panel">
      <div class="panel-head"><div><h3>Quick Capture</h3><p>Fast buttons for the middle of a shift. Each one saves a useful starter record.</p></div></div>
      <div class="panel-body quick-grid">
        ${quickCard("Merchant Delay", "Log wait time, merchant, order, and whether support was contacted.", "delay")}
        ${quickCard("Missing / Wrong Pay", "Start a dispute record with money at stake and requested outcome.", "pay")}
        ${quickCard("Dropoff Proof", "Open the proof-shot vault and add a screenshot/photo.", "proofshot")}
        ${quickCard("Safety / Access Issue", "Capture safety, gate, building, or customer-access issue fast.", "safety")}
      </div>
    </section>
    ${renderRecentRecords(rawRecords().slice(0, 4), "Recent Context")}`;
}
function quickCard(title, text, action) {
  return `<article class="quick-card"><h4>${title}</h4><p>${text}</p><button class="btn primary" type="button" data-quick="${action}">Capture</button></article>`;
}
function renderFormPage(type) {
  const def = formDefs[type];
  return `${def.render()}<div class="form-actions"><button class="btn primary" type="button" data-save="${type}">Save Record</button><button class="btn ghost" type="button" data-preview="${type}">Preview</button><button class="btn ghost" type="button" data-copy-form="${type}">Copy Text</button><button class="btn ghost" type="button" data-clear="${type}">Clear</button></div>`;
}
function renderRecords() {
  return `
    <section class="panel">
      <div class="panel-head">
        <div><h3>Saved Records</h3><p>Search, filter, preview, export, or add records to a violation packet.</p></div>
        <div class="panel-actions">
          <a class="btn primary small" href="#packet" data-page-jump="packet">Build Packet</a>
          <button class="btn ghost small" type="button" data-export-all="txt">Export All TXT</button>
        </div>
      </div>
      <div class="panel-body">
        <div class="filters">
          <input id="record-search" type="search" placeholder="Search filename, text, order, merchant, case">
          <select id="record-type-filter"><option value="">All types</option>${Object.entries(formDefs).map(([key, def]) => `<option value="${key}">${def.label}</option>`).join("")}</select>
          <select id="record-status-filter"><option value="">All status</option><option value="follow-up">Follow-up</option><option value="saved">Saved</option></select>
        </div>
        <div id="record-list"></div>
      </div>
    </section>`;
}
function renderPacket() {
  return `
    <div class="rule red"><h3>Guided Violation Case Builder</h3>This is the human-readable appeal file. Fill the basics, add proof shots, then preview/copy/download. It includes saved records and your proof-shot inventory.</div>
    <section class="case-steps">
      <div class="case-step"><b>1. Claim</b><span>Write what the app/platform says happened.</span></div>
      <div class="case-step"><b>2. Facts</b><span>Write what actually happened in plain English.</span></div>
      <div class="case-step"><b>3. Proof</b><span>Add normal screenshots/photos and label what each one proves.</span></div>
      <div class="case-step"><b>4. Ask</b><span>State the correction you want: pay, account standing, or review.</span></div>
    </section>
    ${panel("Appeal Basics", "Keep this direct and factual.", field("vp-date","Packet Date","date")+select("vp-app","Platform")+field("vp-case","Case / Ticket Number")+field("vp-order","Order ID(s)")+select("vp-type","Violation / Issue Type",issueTypes)+field("vp-money","Money At Stake","number","step='0.01'")+field("vp-request","Requested Outcome"))}
    ${panel("Plain-English Response", "Write it like a human support reviewer has sixty seconds.", textarea("vp-accused","What They Say Happened")+textarea("vp-response","Your Response / What Actually Happened")+textarea("vp-proof","Proof You Have")+textarea("vp-extra","Anything Else Support Should Know"))}
    ${renderProofUploader("Proof Shots For This Packet", "Use your normal screenshots/photos. On mobile this can open camera or photo library; the app compresses shots and keeps them in this browser.")}
    <div class="form-actions"><button class="btn primary" type="button" id="packet-preview">Preview Packet</button><button class="btn ghost" type="button" id="packet-copy">Copy Appeal Text</button><button class="btn ghost" type="button" id="packet-download">Download Packet .txt</button></div>`;
}
function renderProofVault() {
  return `
    <div class="rule"><h3>Proof Shots</h3>Use this for normal screenshots, dropoff photos, payout screenshots, support chats, and receipt images. Add a note that says what each image proves.</div>
    ${renderProofUploader("Add Proof Shots", "Tip: save only the useful shots. Browser storage is private but limited, so export/download anything critical.")}
    ${renderProofLibrary()}`;
}
function renderBackup() {
  return `
    <div class="rule yellow"><h3>Device Backup Only</h3>Use JSON to move or restore app data. Do not send JSON to support. Use Violation Packet for disputes.</div>
    <section class="panel">
      <div class="panel-head"><div><h3>Backup / Restore</h3><p>Keep a private copy of your browser records.</p></div></div>
      <div class="panel-body">
        <div class="form-actions">
          <button class="btn primary" type="button" id="backup-json">Download Device Backup JSON</button>
          <label class="btn ghost">Restore JSON<input id="restore-json" type="file" accept="application/json,.json" hidden></label>
          <button class="btn ghost" type="button" data-export-all="txt">Export All Human-Readable TXT</button>
          <button class="btn danger" type="button" id="clear-all">Clear Browser Records</button>
        </div>
      </div>
    </section>`;
}
function renderGuide() {
  return `
    <div class="rule"><h3>1. Capture right away</h3>Order screens, pickup/dropoff proof, support chats, payout screens, receipts, mileage, and anything tied to money or safety.</div>
    <div class="rule blue"><h3>2. If a platform claims a violation</h3>Save a Dispute / Support record first. Add Proof Notes for screenshots/photos. Then build the Violation Packet and send the plain text appeal plus files.</div>
    <div class="rule yellow"><h3>3. End-of-shift habit</h3>Save Daily Log, export any important records, and download a device backup if the day involved money or account risk.</div>
    <div class="rule red"><h3>4. Privacy boundary</h3>This static app does not upload your records to a database. That is intentional until you decide you want authenticated cloud sync.</div>`;
}
function renderProofUploader(title, description) {
  return `
    <section class="panel">
      <div class="panel-head"><div><h3>${title}</h3><p>${description}</p></div></div>
      <div class="panel-body">
        <label class="upload-box">
          <strong>Add screenshots/photos</strong>
          <p class="record-meta">Images are compressed before saving locally. They are not uploaded to a server by this static app.</p>
          <input id="proof-files" type="file" accept="image/*" capture="environment" multiple>
        </label>
        <div class="proof-library">${renderProofCards()}</div>
      </div>
    </section>`;
}
function renderProofLibrary() {
  return `<section class="panel"><div class="panel-head"><div><h3>Proof Library</h3><p>Everything currently saved in this browser.</p></div></div><div class="panel-body proof-library">${renderProofCards()}</div></section>`;
}
function renderProofCards() {
  const shots = proofShots();
  if (!shots.length) return `<div class="empty"><strong>No proof shots yet.</strong><span>Add screenshots/photos when there is money, safety, proof, or account risk.</span></div>`;
  return `<div class="proof-grid">${shots.map(shot => `
    <article class="proof-card">
      <img src="${esc(shot.dataUrl)}" alt="${esc(shot.name)}">
      <div class="proof-card-body">
        <div class="proof-card-title">${esc(shot.name)}</div>
        <div class="record-meta">${fmtDateTime(shot.createdAt)} · ${((shot.originalSize || 0) / 1024).toFixed(0)} KB original</div>
        <textarea data-proof-note="${esc(shot.id)}" placeholder="What does this image prove?">${esc(shot.note || "")}</textarea>
        <div class="proof-actions">
          <button class="btn ghost small" type="button" data-proof-download="${esc(shot.id)}">Download</button>
          <button class="btn danger small" type="button" data-proof-delete="${esc(shot.id)}">Delete</button>
        </div>
      </div>
    </article>`).join("")}</div>`;
}
function renderRecentRecords(records, title) {
  return `<section class="panel"><div class="panel-head"><div><h3>${title}</h3><p>${records.length ? "Most recent saved evidence." : "Nothing saved yet."}</p></div></div><div class="panel-body">${records.length ? records.map(recordMarkup).join("") : `<div class="empty"><strong>No records yet.</strong><span>Use Quick Capture or Daily Log to start.</span></div>`}</div></section>`;
}
function recordMarkup(record) {
  const def = formDefs[record.type];
  return `
    <article class="record">
      <span class="record-type">${esc(def?.label || titleCase(record.type))}</span>
      <div>
        <div class="record-title">${esc(record.filename)}</div>
        <div class="record-meta">${fmtDateTime(record.createdAt)} · ${esc(record.folder || "Records")}${record.status === "follow-up" ? " · Follow-up" : ""}</div>
      </div>
      <div class="record-actions">
        <button class="btn ghost small" type="button" data-view="${esc(record.id)}">View</button>
        <button class="btn ghost small" type="button" data-download="${esc(record.id)}">TXT</button>
        <button class="btn danger small" type="button" data-delete="${esc(record.id)}">Delete</button>
      </div>
    </article>`;
}

function renderRecordList() {
  const container = $("#record-list");
  if (!container) return;
  const query = ($("#record-search")?.value || "").toLowerCase();
  const type = $("#record-type-filter")?.value || "";
  const status = $("#record-status-filter")?.value || "";
  const filtered = rawRecords().filter(record => {
    const haystack = `${record.filename} ${record.text} ${JSON.stringify(record.data || {})}`.toLowerCase();
    return (!query || haystack.includes(query)) && (!type || record.type === type) && (!status || record.status === status);
  });
  container.innerHTML = filtered.length ? filtered.map(recordMarkup).join("") : `<div class="empty"><strong>No matching records.</strong><span>Try a broader search or clear filters.</span></div>`;
}

function buildViolationPacket() {
  const data = collectPacketData();
  const records = rawRecords().filter(record => ["dispute","proof","daily","receipt","mileage","expense"].includes(record.type));
  const shots = proofShots();
  const type = data["vp-type"] || "Delivery platform violation / support issue";
  const app = data["vp-app"] || "Delivery platform";
  const requested = data["vp-request"] || "Please review the attached evidence, correct the record, and restore/confirm my standing and pay as appropriate.";
  const lines = [
    "VIOLATION / DISPUTE RESPONSE PACKET",
    "=".repeat(64),
    `Packet date: ${data["vp-date"] || todayIso()}`,
    `Platform: ${app}`,
    `Case / ticket number: ${data["vp-case"] || "Not provided yet"}`,
    `Order ID(s): ${data["vp-order"] || "Not provided yet"}`,
    `Issue type: ${type}`,
    `Money at stake: ${money(data["vp-money"]) || "Not listed"}`,
    `Requested outcome: ${requested}`,
    "",
    "COPY/PASTE APPEAL MESSAGE",
    "-".repeat(64),
    `Hello, I am requesting a manual review of this ${type.toLowerCase()}.`,
    "",
    `What the platform says happened: ${data["vp-accused"] || "The platform reported an issue or violation. See response and saved records below."}`,
    "",
    `My response: ${data["vp-response"] || "I dispute the issue based on my saved shift records, proof notes, support notes, and related timestamps."}`,
    "",
    `Proof available: ${data["vp-proof"] || "Saved screenshots/photos/receipts/support notes are listed in the evidence timeline below."}`,
    "",
    `Requested outcome: ${requested}`,
    "",
    `Additional context: ${data["vp-extra"] || "I can provide additional screenshots or files if requested."}`,
    "",
    "Please review the timeline and saved records below before making or keeping any adverse action on my account.",
    "",
    "EVIDENCE CHECKLIST",
    "-".repeat(64),
    "[ ] Order / offer screen saved",
    "[ ] Pickup proof saved",
    "[ ] Dropoff proof saved",
    "[ ] Support chat / call notes saved",
    "[ ] Payout / earnings screenshot saved",
    "[ ] Receipt / expense proof saved if relevant",
    "[ ] Mileage / shift log saved if relevant",
    "",
    "PROOF SHOTS SAVED IN THIS APP",
    "-".repeat(64),
    shots.length ? "" : "No proof shots saved in the app yet.",
    ...shots.flatMap((shot, index) => [`${index + 1}. ${shot.name}`, `Saved: ${fmtDateTime(shot.createdAt)}`, `Note: ${shot.note || "No note added yet."}`, ""]),
    "SAVED RECORD TIMELINE",
    "-".repeat(64),
    records.length ? "" : "No saved records are attached yet. Save a Dispute / Support record and any Proof Notes before sending this packet.",
    ...records.flatMap((record, index) => [`${index + 1}. ${formDefs[record.type]?.label || record.type} | ${record.filename}`, `Saved: ${fmtDateTime(record.createdAt)}`, record.text, ""]),
    "END OF PACKET",
    "-".repeat(64),
    "Note: JSON backup files are only for restoring the app. Send this plain text packet, screenshots, photos, PDFs, or exported records to support instead."
  ];
  return { filename: `${data["vp-date"] || todayIso()}_${appCode(app)}_${slug(type) || "violation"}_response_packet.txt`, text: lines.join("\n") };
}
function collectPacketData() {
  const data = {};
  $$("#page-packet input, #page-packet select, #page-packet textarea").forEach(el => data[el.id] = el.value.trim());
  return data;
}

function renderPage(page) {
  if (page === "dashboard") return renderDashboard();
  if (page === "quick") return renderQuick();
  if (page === "records") return renderRecords();
  if (page === "packet") return renderPacket();
  if (page === "proofshots") return renderProofVault();
  if (page === "backup") return renderBackup();
  if (page === "guide") return renderGuide();
  if (formDefs[page]) return renderFormPage(page);
  return renderDashboard();
}
function show(page) {
  if ((location.hash || "#dashboard").slice(1) !== page) {
    history.replaceState(null, "", `#${page}`);
  }
  currentPage = page;
  $("#pages").innerHTML = `<section class="page active" id="page-${page}">${renderPage(page)}</section>`;
  $$(".nav").forEach(btn => btn.classList.toggle("active", btn.dataset.page === page));
  $("#page-title").textContent = formDefs[page]?.label || ({ dashboard: "Dashboard", quick: "Quick Capture", records: "Records", packet: "Violation Packet", proofshots: "Proof Shots", backup: "Backup / Restore", guide: "Guide" }[page] || "Dashboard");
  closeSidebar();
  hydratePage(page);
  updateAll(false);
  scrollTo(0, 0);
}
function hydratePage(page) {
  if (formDefs[page]) {
    fillForm(page, drafts()[page]);
  }
  if (page === "packet") {
    $("#vp-date").value ||= todayIso();
  }
  if (page === "records") renderRecordList();
  bindPageControls();
}
function updateAll(rerenderDashboard = true) {
  const records = rawRecords();
  $("#nav-count").textContent = records.length;
  $("#today-chip").textContent = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  updateFilenames();
  if (currentPage === "records") renderRecordList();
  if (currentPage === "dashboard" && rerenderDashboard) show("dashboard");
}

function openExport(exportObj) {
  currentExport = exportObj;
  $("#modal-title").textContent = exportObj.filename;
  $("#export-box").textContent = exportObj.text;
  $("#modal").hidden = false;
}
function closeExport() {
  $("#modal").hidden = true;
}
function download(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function toast(message, type = "") {
  const el = $("#toast");
  el.textContent = message;
  el.className = `toast show ${type}`;
  clearTimeout(window.__deliveryToast);
  window.__deliveryToast = setTimeout(() => { el.className = "toast"; }, 2800);
}
function openSidebar() {
  $("#side").classList.add("open");
  $("#overlay").hidden = false;
}
function closeSidebar() {
  $("#side").classList.remove("open");
  $("#overlay").hidden = true;
}

function bindPageControls() {
  $$("[data-page], [data-page-jump]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      show(btn.dataset.page || btn.dataset.pageJump);
    };
  });
  $$("[data-save]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      saveForm(btn.dataset.save);
    };
  });
  $$("[data-preview]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      autoCalc();
      const type = btn.dataset.preview;
      openExport({ filename: filenameFor(type), text: buildText(type, collectData(type)) });
    };
  });
  $$("[data-copy-form]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      const type = btn.dataset.copyForm;
      navigator.clipboard.writeText(buildText(type, collectData(type))).then(() => toast("Record text copied."));
    };
  });
  $$("[data-clear]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      if (!confirm("Clear this form draft? Unsaved fields will be lost.")) return;
      clearDraft(btn.dataset.clear);
      fillForm(btn.dataset.clear, {});
      toast("Draft cleared.");
    };
  });
  $$("[data-quick]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      quickCapture(btn.dataset.quick);
    };
  });
  $$("[data-view]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      const record = getRecord(btn.dataset.view);
      if (record) openExport({ filename: record.filename, text: record.text });
    };
  });
  $$("[data-download]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      const record = getRecord(btn.dataset.download);
      if (record) download(record.filename, record.text);
    };
  });
  $$("[data-delete]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      if (!confirm("Delete this saved record? This cannot be undone.")) return;
      saveRecords(rawRecords().filter(record => String(record.id) !== String(btn.dataset.delete)));
      updateAll();
      toast("Record deleted.");
    };
  });
  $$("[data-export-all]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      exportAllText();
    };
  });
  $$("[data-proof-download]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      const shot = proofShots().find(item => item.id === btn.dataset.proofDownload);
      if (shot) downloadDataUrl(shot.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg", shot.dataUrl);
    };
  });
  $$("[data-proof-delete]").forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      if (!confirm("Delete this proof shot from browser storage?")) return;
      saveProofShots(proofShots().filter(item => item.id !== btn.dataset.proofDelete));
      refreshProofLibrary();
      toast("Proof shot deleted.");
    };
  });
}

function quickCapture(kind) {
  const now = new Date();
  const date = todayIso();
  if (kind === "proofshot") {
    show("proofshots");
    toast("Proof vault open. Add the screenshot/photo, then write what it proves.");
    return;
  }
  show("dispute");
  const presets = {
    delay: { "ds-date": date, "ds-type": "Merchant Issue", "ds-contacted": "No", "ds-what": `Merchant delay started around ${now.toLocaleTimeString()}.`, "ds-request": "Document wait time and preserve proof if pay or rating is affected." },
    pay: { "ds-date": date, "ds-type": "Missing Pay", "ds-contacted": "No", "ds-followup": "Yes", "ds-request": "Review payout and correct missing or incorrect pay." },
    safety: { "ds-date": date, "ds-type": "Safety Issue", "ds-contacted": "No", "ds-followup": "Yes", "ds-what": `Safety/access issue started around ${now.toLocaleTimeString()}.`, "ds-request": "Document safety/access issue and prevent account penalty." }
  };
  fillForm("dispute", presets[kind] || presets.delay);
  toast("Dispute starter loaded. Fill the key facts, then save.");
}
function exportAllText() {
  const records = rawRecords();
  const text = records.length ? records.map(record => record.text).join("\n\n" + "=".repeat(72) + "\n\n") : "No records saved.";
  download(`delivery-records-human-readable-${todayIso()}.txt`, text);
  toast("Human-readable records exported.");
}
function refreshProofLibrary() {
  $$(".proof-library").forEach(el => {
    el.innerHTML = renderProofCards();
  });
  bindPageControls();
}
function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => resolve(reader.result);
      image.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
async function addProofFiles(files) {
  const incoming = [...files].filter(file => file.type.startsWith("image/"));
  if (!incoming.length) return;
  const existing = proofShots();
  const additions = [];
  for (const file of incoming) {
    const dataUrl = await resizeImageFile(file);
    additions.push({
      id: crypto.randomUUID(),
      name: file.name || `proof-shot-${new Date().toISOString()}.jpg`,
      type: "image/jpeg",
      originalSize: file.size || 0,
      createdAt: new Date().toISOString(),
      note: "",
      dataUrl
    });
  }
  try {
    saveProofShots([...additions, ...existing]);
    refreshProofLibrary();
    toast(`${additions.length} proof shot${additions.length === 1 ? "" : "s"} saved.`);
  } catch {
    toast("Browser storage is full. Download/delete older proof shots, then try again.", "err");
  }
}
function downloadDataUrl(name, dataUrl) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

document.addEventListener("click", event => {
  const pageBtn = event.target.closest("[data-page], [data-page-jump]");
  if (pageBtn) show(pageBtn.dataset.page || pageBtn.dataset.pageJump);

  const pill = event.target.closest(".pill");
  if (pill) {
    $$(".pill", pill.parentElement).forEach(btn => btn.classList.remove("on"));
    pill.classList.add("on");
    const formPage = pill.closest(".page")?.id?.replace("page-", "");
    if (formDefs[formPage]) saveDraft(formPage);
  }

  const saveBtn = event.target.closest("[data-save]");
  if (saveBtn) saveForm(saveBtn.dataset.save);

  const previewBtn = event.target.closest("[data-preview]");
  if (previewBtn) {
    autoCalc();
    const type = previewBtn.dataset.preview;
    openExport({ filename: filenameFor(type), text: buildText(type, collectData(type)) });
  }

  const copyBtn = event.target.closest("[data-copy-form]");
  if (copyBtn) {
    const type = copyBtn.dataset.copyForm;
    navigator.clipboard.writeText(buildText(type, collectData(type))).then(() => toast("Record text copied."));
  }

  const clearBtn = event.target.closest("[data-clear]");
  if (clearBtn && confirm("Clear this form draft? Unsaved fields will be lost.")) {
    clearDraft(clearBtn.dataset.clear);
    fillForm(clearBtn.dataset.clear, {});
    toast("Draft cleared.");
  }

  const viewBtn = event.target.closest("[data-view]");
  if (viewBtn) {
    const record = getRecord(viewBtn.dataset.view);
    if (record) openExport({ filename: record.filename, text: record.text });
  }

  const dlBtn = event.target.closest("[data-download]");
  if (dlBtn) {
    const record = getRecord(dlBtn.dataset.download);
    if (record) download(record.filename, record.text);
  }

  const delBtn = event.target.closest("[data-delete]");
  if (delBtn && confirm("Delete this saved record? This cannot be undone.")) {
    saveRecords(rawRecords().filter(record => String(record.id) !== String(delBtn.dataset.delete)));
    updateAll();
    toast("Record deleted.");
  }

  const quickBtn = event.target.closest("[data-quick]");
  if (quickBtn) quickCapture(quickBtn.dataset.quick);

  if (event.target.closest("[data-export-all]")) exportAllText();
});

document.addEventListener("input", event => {
  const formPage = event.target.closest(".page")?.id?.replace("page-", "");
  autoCalc();
  updateFilenames();
  if (formDefs[formPage]) saveDraft(formPage);
  if (["record-search", "record-type-filter", "record-status-filter"].includes(event.target.id)) renderRecordList();
  if (event.target.matches("[data-proof-note]")) {
    saveProofShots(proofShots().map(shot => shot.id === event.target.dataset.proofNote ? { ...shot, note: event.target.value } : shot));
  }
});
document.addEventListener("change", event => {
  if (["record-type-filter", "record-status-filter"].includes(event.target.id)) renderRecordList();
  if (event.target.id === "proof-files") {
    addProofFiles(event.target.files).finally(() => {
      event.target.value = "";
    });
  }
});

window.addEventListener("hashchange", () => {
  show((location.hash || "#dashboard").slice(1));
});

$("#menu").addEventListener("click", openSidebar);
$("#overlay").addEventListener("click", closeSidebar);
$("#modal-close").addEventListener("click", closeExport);
$("#modal").addEventListener("click", event => { if (event.target.id === "modal") closeExport(); });
$("#copy-btn").addEventListener("click", () => navigator.clipboard.writeText(currentExport.text).then(() => toast("Copied.")));
$("#download-btn").addEventListener("click", () => download(currentExport.filename, currentExport.text));
$("#print-btn").addEventListener("click", () => window.print());
$("#reload-app").addEventListener("click", () => location.reload());

document.addEventListener("click", event => {
  if (event.target.id === "packet-preview") openExport(buildViolationPacket());
  if (event.target.id === "packet-copy") navigator.clipboard.writeText(buildViolationPacket().text).then(() => toast("Appeal packet copied."));
  if (event.target.id === "packet-download") {
    const packet = buildViolationPacket();
    download(packet.filename, packet.text);
    toast("Violation packet downloaded.");
  }
  if (event.target.id === "backup-json") {
    const payload = { version: APP_VERSION, exportedAt: new Date().toISOString(), records: rawRecords() };
    download(`delivery-records-device-backup-${todayIso()}.json`, JSON.stringify(payload, null, 2), "application/json");
  }
  if (event.target.id === "clear-all" && confirm("Delete ALL browser records? Download a backup first if you need one.")) {
    localStorage.removeItem(STORE);
    updateAll();
    toast("All browser records cleared.", "err");
  }
});
document.addEventListener("change", event => {
  if (event.target.id !== "restore-json") return;
  const file = event.target.files?.[0];
  if (!file) return;
  file.text().then(text => {
    const payload = safeJson(text, null);
    if (!payload || !Array.isArray(payload.records)) throw new Error("Bad backup");
    saveRecords(payload.records);
    updateAll();
    toast("Backup restored.");
  }).catch(() => toast("Could not restore that JSON backup.", "err"));
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").then(reg => {
    reg.addEventListener("updatefound", () => {
      const worker = reg.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) $("#update-banner").hidden = false;
      });
    });
  }).catch(() => {});
}

bindPageControls();
show((location.hash || "#dashboard").slice(1));
