# Selah Trip Planner

A mobile-friendly web app to manage your itinerary, upload receipts, and split trip expenses with a journey secret.

## Features

- Add and edit itinerary items with day, time, location, and notes
- Add participants and track who paid for each receipt
- Upload receipt text or CSV files for automatic amount extraction
- Upload itinerary PDFs or text files and import extracted itinerary items
- Store data in browser localStorage so your trip details persist locally
- View a split summary with per-person balances

## Run locally

Install dependencies and start the local server:

```bash
npm install
npm start
```

Then open `http://localhost:3000` in your browser.

## Deploy to Netlify

This project is ready to publish as a static front-end site. Connect the repository to Netlify and use the default publish directory `.`.

Netlify will run:

```bash
npm run build
```

which is a no-op because the front-end is static.

Note that backend save/load via secret requires a server. For a free, serverless setup you can use Netlify Functions + Supabase — I added example functions in `netlify/functions/load.js` and `netlify/functions/save.js`.

See the **Serverless backend (Supabase + Netlify Functions)** section below for setup steps.

## Backend save/load with secret

The app supports saving a single journey to the backend with a unique secret.
- Enter the same journey secret on any device to load that saved journey
- `Save` uploads only the current journey to the backend
- `Load` fetches the journey stored under that secret

This is not a full user login system; anyone with the secret can access the shared journey.

## Notes

- Image receipts are stored for reference only. If you upload an image, enter the amount and payer manually.
- The app is built as a static client-side page with no backend.

## Upload sample

The app can read text-based itinerary files with sections like `Base`, `Activities`, `Transport`, and `Notes`.

Example text file structure is available in `itinerary-sample.txt`, and a text-based PDF example is available as `itinerary-sample.pdf`.

Sample text format:

```txt
24 May (Sun) Lausanne Old Town & Ouchy
Base Lausanne — Swiss Chocolate by Fassbind
Activities
• Arrive Zurich 13:20
• Train to Lausanne
• Hotel check-in
• Evening walk along Ouchy promenade by Lake Geneva
Transport Train Zurich Airport > Lausanne (~2h10)
Notes Buy point-to-point ticket Zurich Airport > Lausanne
```

If your PDF is text-based, upload it directly. If the PDF is image-only, paste its text into the preview box.

## Serverless backend (Supabase + Netlify Functions)

To make backend save/load work on Netlify you can use Netlify Functions + Supabase (free tier). The repository includes two functions under `netlify/functions` that call Supabase's REST API.

Quick setup:

1. Create a free Supabase project at https://app.supabase.com
2. Open the SQL editor and run the following to create the table:

```sql
create table journeys (
	secret text primary key,
	trip jsonb,
	updated_at timestamptz default now()
);
```

3. In Supabase → Settings → API, copy your `SUPABASE_URL` and the `service_role` key (keep this secret).
4. In your Netlify site settings → Build & deploy → Environment, add the environment variables:
	 - `SUPABASE_URL` = your Supabase URL
	 - `SUPABASE_KEY` = your Supabase `service_role` key

5. Commit & push the repo and connect it in Netlify. Netlify will detect `netlify/functions` and deploy the functions.

Local testing with Netlify CLI:

```bash
npm install -g netlify-cli
# copy .env.example to .env and set SUPABASE_URL and SUPABASE_KEY for local testing
netlify login
netlify dev
```

`netlify dev` serves the site at `http://localhost:8888` and runs functions locally. Example `curl` to test save:

```bash
curl -X POST http://localhost:8888/.netlify/functions/save \
	-H 'Content-Type: application/json' \
	-d '{"secret":"my-secret","trip": {"id":"test","name":"Demo"}}'
```

Security notes:
- Do not commit the `service_role` key. Set it only in Netlify environment settings or a local `.env` kept out of version control.
- Netlify Functions include CORS headers so front-end calls will work from the deployed site.

If you'd rather host the existing `server.js`, deploy to a host that supports Node (Render, Railway, Fly, or a VM) — note that many free plans have storage or uptime limits.
