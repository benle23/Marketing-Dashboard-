const icons = {
  visitors: (
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87m-1-12a4 4 0 0 1 0 7.75" />
  ),
  leads: <path d="M3 3v18h18M7 15l4-4 3 3 5-7" />,
  conversion: <path d="m3 12 4-4 4 4 8-8m0 0v6m0-6h-6M5 20h14" />,
  demos: <path d="M4 5h16v11H4zM8 20h8m-4-4v4M8 9h8m-8 3h5" />,
  customers: <path d="M20 21a8 8 0 1 0-16 0m8-9a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm6 3 2 2 4-4" />,
  sparkle: <path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Zm7 11 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14ZM5 15l.7 1.8L8 17.5l-2.3.7L5 20l-.7-1.8-2.3-.7 2.3-.7L5 15Z" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  target: <path d="M22 12A10 10 0 1 1 12 2m10 0-10 10m4-10h6v6" />,
  download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />,
};

export function Icon({ name, size = 18 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {icons[name]}
    </svg>
  );
}

export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <header className="section-header">
      <div>
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function KpiCard({ item, icon }) {
  return (
    <article className={`kpi-card ${item.tone}`}>
      <div className="kpi-topline">
        <span className="kpi-icon"><Icon name={icon} /></span>
        <span className="positive-trend">{item.trend}</span>
      </div>
      <strong>{item.value}</strong>
      <div className="kpi-label">{item.label}</div>
      <span className="kpi-context">{item.context}</span>
    </article>
  );
}

export function InsightCard({ children, label = "Opportunity", icon = "sparkle" }) {
  return (
    <div className="insight-card">
      <span className="insight-icon"><Icon name={icon} size={17} /></span>
      <div>
        <strong>{label}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}

export function PriorityBadge({ value }) {
  return <span className={`priority priority-${value.toLowerCase()}`}>{value}</span>;
}
