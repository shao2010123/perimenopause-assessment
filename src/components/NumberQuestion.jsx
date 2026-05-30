function NumberQuestion({ question, value, prompt, onChange, compact = false }) {
  const numericValue = value ?? '';
  const min = question.min ?? 0;
  const max = question.max ?? 100;

  function handleNumericChange(nextValue) {
    if (nextValue === '') {
      onChange(question.id, '');
      return;
    }

    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed)) return;
    onChange(question.id, parsed);
  }

  return (
    <div className={`space-y-3 ${compact ? 'h-full' : ''}`}>
      <div className={`space-y-1.5 ${compact ? 'mb-0.5' : ''}`}>
        <p
          className={`font-semibold text-[var(--color-text-primary)] ${compact ? 'text-[15px] sm:text-base' : 'text-base sm:text-lg'}`}
        >
          {prompt}
        </p>
        {!question.showSlider ? (
          <p className="text-[13px] text-[var(--color-text-secondary)] sm:text-sm">
            请输入最接近的数字。
          </p>
        ) : null}
      </div>

      <label className={`field-shell ${compact ? 'gap-2' : ''}`}>
        <div className={`flex items-end ${compact ? 'gap-2' : 'gap-3'}`}>
          <input
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={question.step ?? 1}
            value={numericValue}
            placeholder={question.placeholder}
            onChange={(event) => handleNumericChange(event.target.value)}
            className="field-input field-input-number"
          />
          {question.unit ? (
            <span
              className={`text-[var(--color-text-secondary)] ${compact ? 'pb-0.5 text-[13px]' : 'pb-1 text-sm font-medium'}`}
            >
              {question.unit}
            </span>
          ) : null}
        </div>
      </label>

      {question.showSlider ? (
        <div className={`space-y-2 ${compact ? 'pt-0.5' : 'sm:space-y-2.5'}`}>
          <input
            type="range"
            min={min}
            max={max}
            step={question.step ?? 1}
            value={numericValue === '' ? min : numericValue}
            onChange={(event) => handleNumericChange(event.target.value)}
            className="range-slider"
          />
          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] sm:text-xs">
            <span>{min}</span>
            <span>{numericValue === '' ? '未填写' : numericValue}</span>
            <span>{max}</span>
          </div>
          {!compact ? (
            <p className="text-[11px] text-[var(--color-text-secondary)] sm:text-xs">
              拖动滑块或直接输入数字
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default NumberQuestion;
