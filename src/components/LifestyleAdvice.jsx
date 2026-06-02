function LifestyleAdvice({ cards }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((card, index) => (
        <article key={card.title} className="glass-card p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(184,169,212,0.1)] text-sm font-semibold text-[var(--color-text-primary)]">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h4 className="font-semibold text-[var(--color-text-primary)]">{card.title}</h4>
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">{card.text}</p>
          {card.relatedLabels?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                与您的关联：
              </span>
              {card.relatedLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-[rgba(184,169,212,0.12)] px-3 py-1 text-xs font-medium text-[var(--color-text-primary)]"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export default LifestyleAdvice;
