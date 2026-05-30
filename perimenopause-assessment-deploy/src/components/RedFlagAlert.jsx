function RedFlagAlert({ redFlags }) {
  if (!redFlags.length) return null;

  return (
    <div className="fade-slide-in rounded-[16px] border-l-[3px] border-[var(--color-accent-coral)] bg-[rgba(232,147,126,0.08)] px-3.5 py-3.5 text-[13px] text-[var(--color-text-primary)] sm:rounded-[18px] sm:px-4 sm:py-4 sm:text-sm">
      <p className="font-semibold">温馨提示</p>
      <div className="mt-2.5 space-y-2.5 sm:mt-3 sm:space-y-3">
        {redFlags.map((flag) => (
          <article key={`${flag.message}-${flag.department}`} className="space-y-1">
            <p className="font-medium">{flag.message}</p>
            <p className="text-[11px] text-[var(--color-text-secondary)] sm:text-xs">
              建议科室：{flag.department}。这不影响您继续完成测评。
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default RedFlagAlert;
