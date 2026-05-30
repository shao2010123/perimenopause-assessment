function TextQuestion({ question, value, prompt, onChange }) {
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

      <label className="field-shell">
        <input
          type="text"
          value={value ?? ''}
          maxLength={question.maxLength}
          placeholder={question.placeholder}
          onChange={(event) => onChange(question.id, event.target.value)}
          className="field-input"
        />
      </label>
    </div>
  );
}

export default TextQuestion;
