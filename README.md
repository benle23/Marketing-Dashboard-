# Marketing Funnel Intelligence Dashboard

An interview-ready marketing conversion dashboard built with React, Vite, and the OpenAI Responses API. It helps marketing and GTM teams understand campaign performance, upload business data, and turn it into practical next actions.

The dashboard uses realistic mock marketing data and can analyze files selected from your computer. It has no login or database.

## Business Problem

Marketing teams often have plenty of campaign data but no simple way to connect it to decisions. This dashboard brings the most useful signals into one view so a team can answer:

- Are campaigns converting?
- Which channels bring high-quality leads?
- Where are users dropping off?
- Which users show the strongest intent?
- What should the team do next?

## Dashboard Sections

- **KPI overview:** Visitors, leads, conversion rate, and customers
- **Funnel analysis:** Stage-by-stage conversion and the largest drop-off opportunity
- **Channel performance:** Traffic, leads, conversion rate, cost per lead, and customers by channel
- **User segments:** Behavioral audiences paired with a recommended action and priority
- **OpenAI decision brief:** Three plain-English priorities ranked by confidence and supported by dashboard metrics
- **Desktop file analysis:** Upload Excel, CSV, PDF, Word, PowerPoint, JSON, text, code, and chart images

## How AI Would Work in a Real Version

The server sends the dashboard context and selected files to the OpenAI Responses API and requests a concise, structured decision brief. The API key stays on the server and is never exposed to browser code. Files are sent only after clicking **Analyze with AI**.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

To enable live OpenAI analysis, create a local `.env` file:

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-mini
```

The dashboard still works without an API key and shows the built-in example analysis. `OPENAI_MODEL` is optional and defaults to `gpt-5.4-mini`. Never commit `.env`.

Live analysis works through `server.js` locally and through the included Vercel functions in `api/` when deployed.

## Upload Limits

- Up to 5 files per analysis
- Up to 3 MB per file and 3 MB combined on the hosted dashboard
- Archives, applications, and executable binary files are rejected
- OpenAI validates whether the selected model can read each uploaded format

Build and run the production server with:

```bash
npm run build
npm start
```

## Deploy on Vercel

1. Import this GitHub repository into Vercel or redeploy the latest `main` branch.
2. In Vercel Project Settings, add `OPENAI_API_KEY` for Production, Preview, and Development.
3. Optionally add `OPENAI_MODEL`; it defaults to `gpt-5.4-mini`.
4. Redeploy after changing environment variables.

The included `vercel.json` builds the Vite frontend and deploys `/api/status` and `/api/analyze` as serverless functions.

## Future Improvements

- Connect to HubSpot or Salesforce
- Pull live campaign data
- Automate lead scoring
- Track whether recommendations improve conversion
- Add A/B testing results
