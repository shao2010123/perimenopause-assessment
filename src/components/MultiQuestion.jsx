import { motion } from 'framer-motion';

function MultiQuestion({ question, value = [], prompt, onChange }) {
  function toggleOption(option) {
    const currentValues = Array.isArray(value) ? value : [];

    if (option.exclusive) {
      onChange(question.id, [option.value]);
      return;
    }

    const withoutExclusive = currentValues.filter((item) => item !== 'none');
    const nextValues = withoutExclusive.includes(option.value)
      ? withoutExclusive.filter((item) => item !== option.value)
      : [...withoutExclusive, option.value];

    onChange(question.id, nextValues);
  }

  return (
    <div className="space-y-3">
      <p className="text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">{prompt}</p>
      <div className="space-y-2.5 sm:space-y-3">
        {question.options.map((option) => {
          const selected = value.includes(option.value);

          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option)}
              aria-pressed={selected}
              whileTap={{ scale: 0.99 }}
              className={`option-card flex items-start gap-3 sm:gap-4 ${selected ? 'selected' : ''}`}
            >
              <span className={`checkbox-mark mt-0.5 ${selected ? 'checked' : ''}`}>
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

export default MultiQuestion;
