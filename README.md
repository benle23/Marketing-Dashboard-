# Marketing Funnel Intelligence Dashboard

An interview-ready, AI-assisted marketing conversion dashboard built with React and Vite. The prototype helps marketing and GTM teams quickly understand campaign performance, funnel drop-off, lead quality, and the next actions most likely to improve conversion.

The dashboard uses realistic mock data only. It has no login, backend, database, or external API dependency.

## Business Problem

Marketing teams often have plenty of campaign data but no simple way to connect it to decisions. This dashboard brings the most useful signals into one view so a team can answer:

- Are campaigns converting?
- Which channels bring high-quality leads?
- Where are users dropping off?
- Which users show the strongest intent?
- What should the team do next?

## Dashboard Sections

- **KPI overview:** Visitors, leads, conversion rate, demo requests, and customers
- **Funnel analysis:** Stage-by-stage conversion and the largest drop-off opportunity
- **Channel performance:** Traffic, leads, conversion rate, cost per lead, and customers by channel
- **User segments:** Behavioral audiences paired with a recommended action and priority
- **AI recommendations:** Plain-English actions ranked by confidence and supported by metrics

## How AI Would Work in a Real Version

In production, AI could monitor connected CRM and campaign data, identify meaningful changes, score user intent, explain funnel anomalies, and recommend the highest-impact next action. A human marketing or GTM owner would review recommendations before launching changes.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Build the production version with:

```bash
npm run build
```

## Future Improvements

- Connect to HubSpot or Salesforce
- Pull live campaign data
- Automate lead scoring
- Track whether recommendations improve conversion
- Add A/B testing results
