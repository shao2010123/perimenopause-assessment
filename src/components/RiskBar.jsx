import { motion } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp.js';

function RiskBar({ item }) {
  const displayValue = useCountUp(item.value, 1.1);

  return (
    <article className="glass-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-base font-semibold text-[var(--color-text-primary)]">{item.label}</h4>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.statusLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-[var(--color-text-primary)]">{displayValue}%</p>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/70">
        <motion.div
          className="h-full rounded-full"
          style={{ background: item.color }}
          initial={{ width: 0 }}
          animate={{ width: `${item.value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {item.showDetails ? (
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">{item.description}</p>
      ) : null}
    </article>
  );
}

export default RiskBar;
