import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { patternRefMap, references } from '../data/references.js';
import { useCountUp } from '../hooks/useCountUp.js';

function PatternRing({ patternId, label, value, color, active }) {
  const [showRefs, setShowRefs] = useState(false);
  const radius = active ? 50 : 46;
  const strokeWidth = active ? 10 : 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  const displayValue = useCountUp(value, 1.2);
  const refIds = patternRefMap[patternId] ?? [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        'glass-card relative flex flex-col items-center justify-center p-4 text-center',
        active ? 'shadow-[0_16px_48px_rgba(184,169,212,0.26)]' : '',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => setShowRefs((current) => !current)}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-white/90"
        aria-label="查看参考文献"
      >
        ⓘ
      </button>

      <AnimatePresence>
        {showRefs ? (
          <motion.div
            className="absolute right-3 top-10 z-50 w-72 rounded-xl border border-white/50 bg-white/92 p-4 text-left shadow-lg backdrop-blur-md"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">相关研究文献</p>
            <div className="mt-3 space-y-3">
              {refIds.map((id) => {
                const ref = references[id];
                if (!ref) return null;

                return (
                  <div key={id}>
                    <p className="text-xs text-[var(--color-text-primary)]">{ref.displayShort}</p>
                    {ref.keyFinding ? (
                      <p className="mt-1 text-xs italic text-[var(--color-text-secondary)]">
                        → {ref.keyFinding}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowRefs(false)}
              className="mt-3 text-xs text-[var(--color-accent-coral)] hover:underline"
            >
              关闭
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="rgba(184,169,212,0.14)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.05, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            吻合度
          </span>
          <span className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {displayValue}%
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
      {active ? (
        <span className="mt-2 rounded-full bg-[rgba(184,169,212,0.12)] px-3 py-1 text-xs font-semibold text-[var(--color-text-primary)]">
          最吻合
        </span>
      ) : null}
    </motion.article>
  );
}

export default PatternRing;
