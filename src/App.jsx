import {
  Icon,
  InsightCard,
  KpiCard,
  PriorityBadge,
  SectionHeader,
} from "@/components/DashboardComponents";
import {
  channels,
  funnelStages,
  kpis,
  recommendations,
  segments,
} from "@/data/dashboardData";
import "@/styles/dashboard.css";

const kpiIcons = ["visitors", "leads", "conversion", "demos", "customers"];
const number = new Intl.NumberFormat("en-US");

function FunnelAnalysis() {
  const max = funnelStages[0].value;

  return (
    <section className="panel funnel-panel">
      <SectionHeader
        eyebrow="Journey health"
        title="Funnel analysis"
        description="See where demand turns into pipeline, and where it gets stuck."
        action={<span className="period-chip">Last 30 days</span>}
      />
      <div className="funnel-list" aria-label="Marketing funnel stages">
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
                <div
                  className="funnel-fill"
                  style={{ "--funnel-width": `${Math.max((stage.value / max) * 100, 1.2)}%` }}
                />
              </div>
              <span className={`step-rate ${stepRate < 30 ? "drop" : ""}`}>
                {index === 0 ? "Entry" : `${stepRate.toFixed(1)}%`}
              </span>
            </div>
          );
        })}
      </div>
      <InsightCard>
        Biggest drop-off: <strong>Landing Page Views to Form Starts.</strong> Test a clearer
        CTA and reduce form friction.
      </InsightCard>
    </section>
  );
}

function RecommendationPanel() {
  return (
    <aside className="panel recommendations-panel">
      <SectionHeader
        eyebrow="Action plan"
        title="AI recommendations"
        description="Prioritized next steps based on the strongest signals."
      />
      <div className="recommendation-list">
        {recommendations.map((recommendation, index) => (
          <article className="recommendation-card" key={recommendation.title}>
            <div className="recommendation-heading">
              <span className="recommendation-number">0{index + 1}</span>
              <PriorityBadge value={recommendation.confidence} />
            </div>
            <h3>{recommendation.title}</h3>
            <p>{recommendation.issue}</p>
            <div className="recommendation-metric">{recommendation.metric}</div>
            <div className="recommendation-action">
              <Icon name="arrow" size={15} />
              <span>{recommendation.action}</span>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}

function ChannelPerformance() {
  return (
    <section className="panel">
      <SectionHeader
        eyebrow="Acquisition quality"
        title="Channel performance"
        description="Compare traffic volume with the leads and customers each channel creates."
        action={<span className="period-chip">5 active channels</span>}
      />
      <div className="channel-summary">
        <div>
          <span>Best conversion</span>
          <strong>Email Campaign</strong>
          <small>16.1% visitor-to-lead</small>
        </div>
        <div>
          <span>Most customers</span>
          <strong>LinkedIn Ads</strong>
          <small>28 customers acquired</small>
        </div>
        <div>
          <span>Lowest cost</span>
          <strong>Referral</strong>
          <small>$5 cost per lead</small>
        </div>
      </div>
      <div className="table-scroll">
        <table className="data-table channel-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Visitors</th>
              <th>Leads</th>
              <th>Conversion rate</th>
              <th>Cost per lead</th>
              <th>Customers</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.name}>
                <td>
                  <span className="channel-name">
                    <i style={{ background: channel.color }} />
                    {channel.name}
                  </span>
                </td>
                <td>{number.format(channel.visitors)}</td>
                <td>{number.format(channel.leads)}</td>
                <td>
                  <div className="conversion-cell">
                    <span>{channel.conversionRate}%</span>
                    <span className="mini-track">
                      <i style={{ "--rate": `${channel.conversionRate * 5.5}%`, background: channel.color }} />
                    </span>
                  </div>
                </td>
                <td>${channel.cpl}</td>
                <td><strong>{channel.customers}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <InsightCard label="Channel insight" icon="target">
        Email has the strongest conversion rate and lowest scalable cost per lead, while
        LinkedIn produces the most customers.
      </InsightCard>
    </section>
  );
}

function UserSegments() {
  return (
    <section className="panel">
      <SectionHeader
        eyebrow="Audience strategy"
        title="User segments"
        description="Turn behavioral signals into a clear next action for every audience."
      />
      <div className="table-scroll">
        <table className="data-table segment-table">
          <thead>
            <tr>
              <th>Segment</th>
              <th>Behavior signal</th>
              <th>User count</th>
              <th>Recommended action</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((segment) => (
              <tr key={segment.segment}>
                <td><strong>{segment.segment}</strong></td>
                <td>{segment.signal}</td>
                <td>{number.format(segment.count)}</td>
                <td>
                  <span className="action-link">{segment.action} <Icon name="arrow" size={14} /></span>
                </td>
                <td><PriorityBadge value={segment.priority} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-mark">MF</div>
        <div className="topbar-copy">
          <span>Growth intelligence</span>
          <strong>Overview</strong>
        </div>
        <div className="topbar-actions">
          <span className="freshness"><i /> Data refreshed 8 min ago</span>
          <button className="secondary-button" type="button" onClick={() => window.print()}>
            <Icon name="download" size={16} /> Export brief
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <div className="badge"><Icon name="sparkle" size={14} /> Prototype Demo</div>
            <h1>Marketing Funnel<br /><span>Intelligence Dashboard</span></h1>
            <p>AI-assisted view of funnel performance, user intent, and conversion opportunities.</p>
          </div>
          <div className="hero-decision">
            <span>Top decision this period</span>
            <strong>Improve landing page to form conversion</strong>
            <p>Recovering just 5% of lost visitors could create approximately 391 additional form starts.</p>
          </div>
        </section>

        <section className="kpi-grid" aria-label="Key performance indicators">
          {kpis.map((item, index) => <KpiCard item={item} icon={kpiIcons[index]} key={item.label} />)}
        </section>

        <div className="primary-grid">
          <FunnelAnalysis />
          <RecommendationPanel />
        </div>

        <ChannelPerformance />
        <UserSegments />

        <footer>
          <span>Marketing Funnel Intelligence</span>
          <p>Mock data for interview demonstration. Built to turn signals into clear decisions.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
