export const kpis = [
  { label: "Visitors", value: "12,480", trend: "+12%" },
  { label: "Leads", value: "1,245", trend: "+8.4%" },
  { label: "Conversion Rate", value: "9.98%", trend: "+1.2 pts" },
  { label: "Customers", value: "74", trend: "+9.8%" },
];

export const funnelStages = [
  { label: "Website Visitors", value: 12480 },
  { label: "Landing Page Views", value: 7820 },
  { label: "Form Starts", value: 2140 },
  { label: "Form Submissions", value: 1245 },
  { label: "Demo Requests", value: 318 },
  { label: "Customers", value: 74 },
];

export const channels = [
  { name: "LinkedIn Ads", visitors: 2400, leads: 310, conversionRate: 12.9, cpl: 42, customers: 28, color: "#2563eb" },
  { name: "Google Search", visitors: 4100, leads: 355, conversionRate: 8.7, cpl: 29, customers: 22, color: "#7c3aed" },
  { name: "Email Campaign", visitors: 1800, leads: 290, conversionRate: 16.1, cpl: 8, customers: 18, color: "#0f9f6e" },
  { name: "Organic Social", visitors: 3200, leads: 140, conversionRate: 4.4, cpl: 14, customers: 4, color: "#f59e0b" },
  { name: "Referral", visitors: 980, leads: 150, conversionRate: 15.3, cpl: 5, customers: 2, color: "#db2777" },
];

export const segments = [
  {
    segment: "High Intent Users",
    signal: "Visited pricing page + requested demo",
    count: 186,
    action: "Send sales follow-up",
    priority: "High",
  },
  {
    segment: "Warm Leads",
    signal: "Downloaded guide + opened emails",
    count: 420,
    action: "Add to nurture sequence",
    priority: "Medium",
  },
  {
    segment: "Low Intent Users",
    signal: "One visit, no CTA click",
    count: 2100,
    action: "Retarget with awareness content",
    priority: "Low",
  },
  {
    segment: "Product Qualified Users",
    signal: "Signed up + used key feature",
    count: 94,
    action: "Offer upgrade or demo",
    priority: "High",
  },
  {
    segment: "Re-Engagement Needed",
    signal: "Signed up but inactive",
    count: 275,
    action: "Send reactivation email",
    priority: "Medium",
  },
];

export const defaultAnalysis = {
  headline: "Fix the form-start drop-off first",
  summary: "The clearest growth opportunity is between landing page views and form starts. Focus the team on that leak before adding more traffic.",
  dataSummary: "Example analysis based on the dashboard's mock marketing funnel, channel, and segment data.",
  priorities: [
    {
      action: "Shorten the lead form",
      evidence: "Only 27.3% of landing page viewers start the form.",
      impact: "Increase lead volume from existing traffic.",
      confidence: "High",
    },
    {
      action: "Prioritize high-intent users",
      evidence: "186 users visited pricing and requested a demo.",
      impact: "Create near-term sales conversations.",
      confidence: "High",
    },
    {
      action: "Favor email and LinkedIn",
      evidence: "Email converts best; LinkedIn creates the most customers.",
      impact: "Improve acquisition efficiency.",
      confidence: "Medium",
    },
  ],
};
