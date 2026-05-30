import { motion } from 'framer-motion';

function ScaleQuestion({ question, value, prompt, onChange }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{prompt}</p>
        <p className="text-[13px] text-[var(--color-text-secondary)] sm:text-sm">
          {question.subtitle ?? '请选择最接近您最近状态的一项。'}
        </p>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {question.options.map((option) => {
          const selected = value === option.value;

          return (
            <motion.button
              key={option.label}
              type="button"
              onClick={() => onChange(question.id, option.value)}
              aria-pressed={selected}
              whileTap={{ scale: 0.99 }}
              className={`option-card ${selected ? 'selected' : ''}`}
            >
              <span className="block pl-3 text-[14px] text-[var(--color-text-primary)] sm:pl-4 sm:text-[15px]">
                {option.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default ScaleQuestion;
