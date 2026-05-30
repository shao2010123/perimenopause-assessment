const GROUPS = [
  { key: 'essential', label: '⭐ 强烈建议' },
  { key: 'recommended', label: '📋 建议检测' },
  { key: 'optional', label: '💡 可以考虑' },
];

const TONE_CLASS = {
  urgent: 'border-[var(--color-accent-coral)] bg-[rgba(232,147,126,0.08)]',
  recommended: 'border-[var(--color-primary-start)] bg-[rgba(184,169,212,0.08)]',
  suggested: 'border-[rgba(184,169,212,0.4)] bg-[rgba(255,255,255,0.6)]',
  optional: 'border-[rgba(181,173,188,0.35)] bg-[rgba(255,255,255,0.6)]',
};

function RecommendationGroup({ title, items }) {
  if (!items.length) return null;

  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article key={item.name} className="rounded-[18px] border border-white/65 bg-white/66 p-4">
            <p className="font-semibold text-[var(--color-text-primary)]">{item.name}</p>
            {item.timing ? (
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">📅 {item.timing}</p>
            ) : null}
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
              💡 {item.reason}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TestRecommendations({ bundle }) {
  return (
    <div className="space-y-5">
      <div
        className={`rounded-[20px] border-l-4 px-5 py-4 text-sm leading-7 text-[var(--color-text-secondary)] ${TONE_CLASS[bundle.urgency.tone]}`}
      >
        <p className="font-semibold text-[var(--color-text-primary)]">{bundle.urgency.title}</p>
        {bundle.summary ? <p className="mt-2">{bundle.summary}</p> : null}
      </div>

      {GROUPS.map((group) => (
        <RecommendationGroup
          key={group.key}
          title={group.label}
          items={bundle[group.key] ?? []}
        />
      ))}
    </div>
  );
}

export default TestRecommendations;
