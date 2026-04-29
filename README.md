# Food Gig Dashboard Prototype

This is a self-contained HTML/CSS/JS scaffold for the first dashboard UI.

## What It Includes

- home dashboard
- evidence inbox
- order records
- shift reviews
- weekly reviews
- merchant log
- zone log
- order packets
- settings
- Hermes test harness
- Quick Log page for 2-second during-shift taps
- Shift Packet page for one-end-of-shift ChatGPT review
- Batch Import page for end-of-night order/customer photo cataloging
- Evidence Packet page for printable order packets and PDF export
- ChatGPT workflow page for a no-API prompt-paste flow
- Delivery Records page for daily logs, receipts, mileage, expenses, proof notes, disputes, weekly reviews, text exports, and JSON backup/import

## Always-Online Deployment

This app is static-hosting ready. To keep it available online at all times, deploy the `food-gig-evidence/dashboard-app` folder to a static host.

Fast options:

- Netlify: drag this folder into Netlify Drop, or connect a repo. `netlify.toml` is already included.
- Vercel: import this folder/project. `vercel.json` is already included.
- GitHub Pages: publish this folder as the site root, then open `delivery-records.html`.

Important: Delivery Records is local-first and can also cloud-sync through the `Cloud Sync` page when a Vercel Blob store is connected. The main path is now a real account sign-in flow, and the browser encrypts the sync payload before upload. JSON backup remains a device restore file, not a violation/dispute evidence file.

Primary shift URL after deployment:

- `/delivery-records.html`
- `/delivery-records` on Netlify/Vercel

## Local Preview Only

1. Start the local server from this folder:
   - `npm start`
2. Open the app in your browser:
   - `http://127.0.0.1:8080/index.html`
   - `http://127.0.0.1:8080/hermes-harness.html`
  - `http://127.0.0.1:8080/photo-intake.html`
  - `http://127.0.0.1:8080/batch-import.html`
  - `http://127.0.0.1:8080/quick-log.html`
  - `http://127.0.0.1:8080/shift-packet.html`
   - `http://127.0.0.1:8080/evidence-packet.html`
   - `http://127.0.0.1:8080/chatgpt-workflow.html`
   - `http://127.0.0.1:8080/delivery-records.html`
3. In the dashboard, make changes normally.
4. In the Hermes harness, click `Use Dashboard Data` to load the saved dashboard state.
5. Pick a scenario and click `Run Test`.

The local server also includes mock `POST /api/hermes` and `POST /api/hermes/photo` endpoints so you can test the full flow even if you do not have a real Hermes service yet.

On the photo intake page, `Save to Evidence` writes the photo metadata into the dashboard's saved state so it shows up in the Evidence Inbox after refresh.

The new `quick-log.html` page is the fastest on-road capture surface. Tap `Start Shift`, hit one of the issue buttons, add a short note if needed, and it gets stored for the packet later. When you are done, tap `End Shift`.

The new `shift-packet.html` page is the real low-friction path: it pulls the current dashboard summary plus the active shift logs into one packet, gives you one end-of-shift prompt, and avoids the 5-minute photo-by-photo loop.

The new `batch-import.html` page is the end-of-night cataloging flow. Drop in a folder or a group of files, assign the order/customer once, add a shared note, and save the whole batch into the evidence store.

The new `evidence-packet.html` page is the printable order-packet view. It keeps all photos for the same customer/order together, collects unassigned items into suggested buckets, and is meant to be printed or saved as PDF once you want to send a violation response packet.

If you want the ChatGPT-only version, open `chatgpt-workflow.html`. That page does not need an API key. It builds a copyable prompt package and context JSON so you can upload the same photo directly inside ChatGPT, paste the prompt, and keep working without any backend billing.

If you want the photo intake page to call OpenAI for real analysis, set `OPENAI_API_KEY` before starting the server. The server will use `OPENAI_MODEL` if you want to override the default `gpt-4o-mini` model.

If port `8080` is already taken, run `PORT=3001 npm start` and open `http://127.0.0.1:3001/` instead.

## Purpose

This is the first scaffold for the dashboard app. It is intentionally simple, static-hosting friendly, and privacy-first.
