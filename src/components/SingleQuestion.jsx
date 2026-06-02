import { motion } from 'framer-motion';

function SingleQuestion({ question, value, prompt, onChange }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{prompt}</p>
        {question.subtitle ? (
          <p className="text-[13px] text-[var(--color-text-secondary)] sm:text-sm">
            {question.subtitle}
          </p>
        ) : null}
      </div>
      <div className="space-y-2.5 sm:space-y-3">
        {question.options.map((option) => {
          const selected = value === option.value;

          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => onChange(question.id, option.value)}
              aria-pressed={selected}
              whileTap={{ scale: 0.99 }}
              className={`option-card flex items-start gap-3 sm:gap-4 ${selected ? 'selected' : ''}`}
            >
              <span
                className={[
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold sm:h-6 sm:w-6 sm:text-xs',
                  selected
                    ? 'border-transparent bg-[var(--color-primary-start)] text-white'
                    : 'border-[rgba(184,169,212,0.34)] text-transparent',
                ].join(' ')}
              >
                ✓
              </span>
              <span className="flex-1 text-[14px] leading-[1.5] text-[var(--color-text-primary)] sm:text-[15px]">
                {option.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default SingleQuestion;
