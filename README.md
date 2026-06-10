# Marketing Funnel Intelligence Dashboard

An interview-ready marketing conversion dashboard built with React, Vite, and the OpenAI Responses API. It helps marketing and GTM teams quickly understand campaign performance, funnel drop-off, lead quality, and the next actions most likely to improve conversion.

The dashboard uses realistic mock marketing data and sends it to a small local server endpoint for optional AI analysis. It has no login or database.

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

## How AI Would Work in a Real Version

The server sends the dashboard's mock data to the OpenAI Responses API and requests a concise, structured decision brief. The API key stays on the server and is never exposed to browser code. In production, the same flow could analyze connected CRM and campaign data.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

To enable live OpenAI analysis, create a local `.env` file:

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.5
```

The dashboard still works without an API key and shows the built-in example analysis. `OPENAI_MODEL` is optional and defaults to `gpt-5.5`. Never commit `.env`.

Live analysis requires a Node.js host that runs `server.js`; a static-only host will display the built-in analysis.

Build and run the production server with:

```bash
npm run build
npm start
```

## Future Improvements

- Connect to HubSpot or Salesforce
- Pull live campaign data
- Automate lead scoring
- Track whether recommendations improve conversion
- Add A/B testing results
