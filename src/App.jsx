import { useState } from "react";
import { Icon, KpiCard, PriorityBadge, SectionHeader } from "@/components/DashboardComponents";
import {
  channels,
  defaultAnalysis,
  funnelStages,
  kpis,
  segments,
} from "@/data/dashboardData";
import "@/styles/dashboard.css";

const kpiIcons = ["visitors", "leads", "conversion", "customers"];
const number = new Intl.NumberFormat("en-US");

function AiBrief() {
  const [analysis, setAnalysis] = useState(defaultAnalysis);
  const [status, setStatus] = useState("ready");
  const [error, setError] = useState("");

  async function analyzeData() {
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kpis, funnelStages, channels, segments }),
      });
      const result = response.headers.get("content-type")?.includes("application/json")
        ? await response.json()
        : { error: "The AI analysis endpoint is unavailable on this host." };

      if (!response.ok) {
        throw new Error(result.error || "The analysis could not be completed.");
      }

      setAnalysis(result.analysis);
      setStatus("complete");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("error");
    }
  }

  return (
    <section className="ai-brief" aria-live="polite">
      <div className="ai-brief-heading">
        <div>
          <span className="section-eyebrow">OpenAI decision brief</span>
          <h2>{analysis.headline}</h2>
          <p>{analysis.summary}</p>
        </div>
        <button
          className="primary-button"
          disabled={status === "loading"}
          onClick={analyzeData}
          type="button"
        >
          <Icon name="sparkle" size={16} />
          {status === "loading" ? "Analyzing data..." : "Analyze with AI"}
        </button>
      </div>

      {error && (
        <div className="api-notice">
          <strong>AI analysis is not configured yet.</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="priority-grid">
        {analysis.priorities.map((priority, index) => (
          <article className="priority-card" key={`${priority.action}-${index}`}>
            <div className="priority-card-topline">
              <span>0{index + 1}</span>
              <PriorityBadge value={priority.confidence} />
            </div>
            <h3>{priority.action}</h3>
            <p>{priority.evidence}</p>
            <strong>{priority.impact}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function FunnelAnalysis() {
  const max = funnelStages[0].value;

  return (
    <section className="panel">
      <SectionHeader title="Where users drop off" description="Conversion between each funnel step." />
      <div className="funnel-list">
        {funnelStages.map((stage, index) => {
          const previous = funnelStages[index - 1]?.value;
          const stepRate = previous ? (stage.value / previous) * 100 : 100;

          return (
            <div className="funnel-row" key={stage.label}>
              <div className="funnel-label">
                <span>{stage.label}</span>
                <strong>{number.format(stage.value)}</strong>
              </div>
              <div className="funnel-track">
                <i style={{ "--funnel-width": `${Math.max((stage.value / max) * 100, 1.2)}%` }} />
              </div>
              <span className={stepRate < 30 ? "drop" : ""}>
                {index === 0 ? "Start" : `${stepRate.toFixed(1)}%`}
              </span>
            </div>
          );
        })}
      </div>
      <div className="plain-insight">
        <Icon name="target" size={17} />
        <p><strong>Largest opportunity:</strong> Only 27.3% of landing page viewers start the form.</p>
      </div>
    </section>
  );
}

function ChannelPerformance() {
  return (
    <section className="panel">
      <SectionHeader title="Which channels perform best" description="Quality and efficiency by acquisition source." />
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Conversion</th>
              <th>Cost / lead</th>
              <th>Customers</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.name}>
                <td>
                  <span className="channel-name"><i style={{ background: channel.color }} />{channel.name}</span>
                </td>
                <td><strong>{channel.conversionRate}%</strong></td>
                <td>${channel.cpl}</td>
                <td>{channel.customers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="plain-insight">
        <Icon name="conversion" size={17} />
        <p><strong>Email is most efficient.</strong> LinkedIn creates the most customers.</p>
      </div>
    </section>
  );
}

function AudienceActions() {
  return (
    <section className="panel audience-panel">
      <SectionHeader title="Who the team should act on" description="Behavior-based audiences with one clear next step." />
      <div className="audience-list">
        {segments.map((segment) => (
          <article className="audience-row" key={segment.segment}>
            <div>
              <strong>{segment.segment}</strong>
              <span>{segment.signal}</span>
            </div>
            <b>{number.format(segment.count)}</b>
            <p>{segment.action}</p>
            <PriorityBadge value={segment.priority} />
          </article>
        ))}
      </div>
    </section>
  );
}

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-mark">MF</div>
        <strong>Marketing Funnel Intelligence</strong>
        <span className="freshness"><i /> Mock data · Last 30 days</span>
      </header>

      <main>
        <section className="hero">
          <div>
            <span className="section-eyebrow">Performance overview</span>
            <h1>Turn marketing data into the next best action.</h1>
            <p>See what is converting, where prospects drop off, and what the team should do next.</p>
          </div>
        </section>

        <section className="kpi-grid" aria-label="Key performance indicators">
          {kpis.map((item, index) => <KpiCard item={item} icon={kpiIcons[index]} key={item.label} />)}
        </section>

        <AiBrief />

        <div className="analysis-grid">
          <FunnelAnalysis />
          <ChannelPerformance />
        </div>

        <AudienceActions />

        <footer>
          <span>Marketing Funnel Intelligence</span>
          <p>OpenAI-assisted analysis · Mock dashboard data</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
