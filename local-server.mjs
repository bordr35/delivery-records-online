import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 8080);
const openAIApiKey = process.env.OPENAI_API_KEY || "";
const openAIModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8",
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...headers,
  });
  res.end(body);
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toNumber(value) {
  const numeric = Number(String(value).replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function summarizeResponse(payload) {
  const context = payload?.context || {};
  const latestShift = context.latestShift || {};
  const merchants = Array.isArray(context.merchants) ? context.merchants : [];
  const weekly = context.weekly || {};
  const scenario = String(payload?.scenario || "");

  if (scenario === "summary_shift") {
    return {
      title: "Shift Summary",
      bullets: [
        `Gross: $${toNumber(latestShift.gross).toFixed(2)} over ${toNumber(latestShift.hours).toFixed(2)} hours.`,
        `Earnings per hour: $${toNumber(latestShift.perHour).toFixed(2)}.`,
        `Issues flagged: ${latestShift.issues ?? 0}.`,
        `Primary friction: ${Array.isArray(context.friction) && context.friction[0] ? context.friction[0] : "none noted"}.`,
        "Next step: prioritize faster merchants and keep the best zone.",
      ],
      confidence: "high",
    };
  }

  if (scenario === "merchant_friction") {
    const ranked = [...merchants].sort((a, b) => toNumber(b.waitMinutes) - toNumber(a.waitMinutes));
    return {
      title: "Merchant Friction",
      bullets: [
        `Worst merchant: ${ranked[0]?.name || "unknown"} with ${toNumber(ranked[0]?.waitMinutes).toFixed(1)} minute waits.`,
        `Best merchant: ${ranked[ranked.length - 1]?.name || "unknown"}.`,
        `Problem orders are concentrated where waits are longest.`,
        "Change: reduce time at the slowest merchant or avoid it when possible.",
      ],
      confidence: "medium",
    };
  }

  if (scenario === "case_note") {
    const evidence = Array.isArray(context.evidence) ? context.evidence : [];
    return {
      title: "Case Note Draft",
      bullets: [
        `Issue date: ${context.date || latestShift.date || "unknown"}.`,
        `Issue type: ${context.cases?.[0]?.issue || "customer-access"}.`,
        `Evidence: ${evidence.slice(0, 3).join(", ") || "none provided"}.`,
        "Outcome: evidence preserved for follow-up.",
      ],
      confidence: "high",
    };
  }

  if (scenario === "weekly_review") {
    return {
      title: "Weekly Review",
      bullets: [
        `Latest shift: $${toNumber(latestShift.gross).toFixed(2)}.`,
        `Weekly gross: $${toNumber(weekly.gross).toFixed(2)}.`,
        `Weekly hours: ${toNumber(weekly.hours).toFixed(2)}.`,
        "Improve: remove slow pickup friction and keep the strongest zone.",
      ],
      confidence: "medium",
    };
  }

  return {
    title: "Hermes Mock Response",
    bullets: [
      `Scenario: ${scenario || "unknown"}.`,
      "This is the local mock endpoint for testing the harness.",
    ],
    confidence: "low",
  };
}

function summarizePhotoResponse(payload) {
  const context = payload?.context || {};
  const latestShift = context.latestShift || {};
  const note = String(payload?.note || "").trim();
  const image = payload?.image || {};
  const imageName = String(image.name || "photo");
  const noteText = note || "No note provided.";
  const lower = `${imageName} ${noteText}`.toLowerCase();

  let title = "Photo Review";
  let tags = ["photo", "shift"];
  let nextAction = "Keep the image as supporting evidence and continue the shift.";
  let confidence = "medium";

  if (/wingstop|wait|delay|slow/i.test(lower)) {
    title = "Merchant Delay";
    tags = ["merchant-delay", "friction"];
    nextAction = "Use this as evidence of a slow pickup and note the merchant wait time.";
  } else if (/gate|customer|access|apartment|door/i.test(lower)) {
    title = "Dropoff Access Issue";
    tags = ["customer-access", "dropoff"];
    nextAction = "Keep the photo with the case file and note the access problem.";
  } else if (/proof|dropoff|delivered|handed/i.test(lower)) {
    title = "Proof Photo";
    tags = ["proof", "delivery"];
    nextAction = "Store this as delivery proof and link it to the order record.";
    confidence = "high";
  }

  return {
    title,
    confidence,
    note: noteText,
    tags,
    summary: `Photo received for ${context.platform || "delivery work"} on ${context.date || latestShift.date || "unknown date"}.`,
    bullets: [
      `File: ${imageName}`,
      `Shift gross: $${toNumber(latestShift.gross).toFixed(2)}`,
      `Shift issues: ${latestShift.issues ?? 0}`,
      `Context zone: ${context.zone || "unknown"}`,
      `Next action: ${nextAction}`,
    ],
  };
}

const photoResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    summary: { type: "string" },
    note: { type: "string" },
    issueType: { type: "string", enum: ["merchant-delay", "customer-access", "proof", "bonus", "other"] },
    merchant: { type: "string" },
    priority: { type: "string", enum: ["low", "medium", "high"] },
    tags: { type: "array", items: { type: "string" } },
    bullets: { type: "array", items: { type: "string" } },
    nextAction: { type: "string" },
  },
  required: ["title", "confidence", "summary", "note", "issueType", "merchant", "priority", "tags", "bullets", "nextAction"],
};

function extractOpenAIResponseText(responseJson) {
  if (typeof responseJson?.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text;
  }

  const output = Array.isArray(responseJson?.output) ? responseJson.output : [];
  for (const item of output) {
    if (item?.type !== "message" || !Array.isArray(item.content)) continue;
    const textPart = item.content.find((part) => part?.type === "output_text" && typeof part.text === "string");
    if (textPart?.text) return textPart.text;
  }

  return "";
}

async function analyzePhotoWithOpenAI(payload) {
  const imageDataUrl = String(payload?.image?.dataUrl || "");
  if (!imageDataUrl) {
    throw new Error("No image data provided.");
  }

  const context = payload?.context || {};
  const note = String(payload?.note || "").trim();
  const instructions = [
    "You are Hermes, a delivery-shift photo intake assistant for gig work.",
    "Analyze the photo and the note, then return a concise structured JSON object.",
    "Use the photo and note to infer the issue type, merchant if visible, and the best next action.",
    "Keep the response short, practical, and suitable for evidence intake.",
  ].join(" ");

  const body = {
    model: openAIModel,
    instructions,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Context:\n${JSON.stringify(
              {
                date: context.date || "unknown",
                platform: context.platform || "DoorDash",
                zone: context.zone || "unknown",
                latestShift: context.latestShift || {},
                note,
              },
              null,
              2,
            )}\n\nAnalyze this delivery photo and return the structured result.`,
          },
          {
            type: "input_image",
            image_url: imageDataUrl,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "photo_intake_response",
        strict: true,
        schema: photoResponseSchema,
      },
    },
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseJson = await response.json();
  if (!response.ok) {
    const message = responseJson?.error?.message || `OpenAI request failed with status ${response.status}`;
    throw new Error(message);
  }

  const text = extractOpenAIResponseText(responseJson);
  const parsed = safeJsonParse(text);
  if (!parsed) {
    throw new Error("OpenAI returned an unreadable JSON payload.");
  }

  return {
    ...parsed,
    provider: "openai",
    model: openAIModel,
  };
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(path.join(__dirname, pathname));

  if (!safePath.startsWith(__dirname)) {
    send(res, 403, "Forbidden");
    return;
  }

  try {
    const data = await readFile(safePath);
    const ext = path.extname(safePath).toLowerCase();
    send(res, 200, data, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
    });
  } catch {
    send(res, 404, "Not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    send(res, 204, "");
    return;
  }

  if (url.pathname === "/api/hermes") {
    if (req.method !== "POST") {
      send(
        res,
        200,
        JSON.stringify({
          ok: true,
          message: "POST JSON to this endpoint with { scenario, prompt, context }.",
        }, null, 2),
        { "Content-Type": "application/json; charset=utf-8" },
      );
      return;
    }

    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    const payload = safeJsonParse(body);
    const response = summarizeResponse(payload);
    send(
      res,
      200,
      JSON.stringify(
        {
          ok: true,
          ...response,
          echo: {
            scenario: payload?.scenario || null,
            prompt: payload?.prompt || null,
          },
        },
        null,
        2,
      ),
      { "Content-Type": "application/json; charset=utf-8" },
    );
    return;
  }

  if (url.pathname === "/api/hermes/photo") {
    if (req.method !== "POST") {
      send(
        res,
        200,
        JSON.stringify({
          ok: true,
          message: "POST JSON to this endpoint with { image, note, context }.",
        }, null, 2),
        { "Content-Type": "application/json; charset=utf-8" },
      );
      return;
    }

    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    const payload = safeJsonParse(body);
    let response;
    try {
      if (openAIApiKey && payload?.image?.dataUrl) {
        response = await analyzePhotoWithOpenAI(payload);
      } else {
        response = {
          ...summarizePhotoResponse(payload),
          provider: "mock",
          model: null,
        };
      }
    } catch (error) {
      response = {
        ...summarizePhotoResponse(payload),
        provider: "mock-fallback",
        model: null,
        fallbackReason: error?.message || "OpenAI request failed",
      };
    }
    send(
      res,
      200,
      JSON.stringify(
        {
          ok: true,
          ...response,
          echo: {
            imageName: payload?.image?.name || null,
            note: payload?.note || null,
          },
        },
        null,
        2,
      ),
      { "Content-Type": "application/json; charset=utf-8" },
    );
    return;
  }

  await serveStatic(req, res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Food Gig Dashboard server running at http://127.0.0.1:${port}`);
});
