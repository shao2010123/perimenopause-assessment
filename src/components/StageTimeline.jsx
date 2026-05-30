import { stageTimelineItems } from '../data/stages.js';

const confidenceCopy = {
  high: '你很可能在这里',
  medium: '你较可能在这里',
  low: '你可能在这里',
};

function SpecialStageCard({ stageResult }) {
  const inferredTitle = stageResult.inferredStageContent?.title;
  const specialCopy = {
    stage_surgical_meno: '双侧卵巢切除后，你已进入手术性绝经状态，相当于 STRAW+10 绝经后阶段。',
    stage_uncertain: '由于月经信息无法作为分期依据，本报告会更多参考症状评分、年龄和风险信号。',
  };

  return (
    <div className="rounded-[20px] border border-[rgba(232,147,126,0.18)] bg-[rgba(232,147,126,0.08)] px-4 py-4 sm:px-5">
      <p className="text-sm font-semibold text-[var(--color-accent-coral)]">
        {stageResult.stage === 'stage_surgical_meno' ? '手术性绝经' : '特殊情况说明'}
      </p>
      {inferredTitle ? (
        <p className="mt-2 text-sm leading-7 text-[var(--color-text-primary)]">
          基于症状和年龄，当前更接近：{inferredTitle}
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
        {specialCopy[stageResult.stage]}
      </p>
    </div>
  );
}

function StageTimeline({ stageResult }) {
  if (!stageResult) return null;

  if (['stage_surgical_meno', 'stage_uncertain'].includes(stageResult.stage)) {
    return <SpecialStageCard stageResult={stageResult} />;
  }

  const currentIndex = stageTimelineItems.findIndex((stage) => stage.id === stageResult.stage);

  return (
    <div className="space-y-4">
      <div className="hidden grid-cols-5 items-start gap-0 md:grid">
        {stageTimelineItems.map((stage, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={stage.id} className="relative flex flex-col items-center text-center">
              {index > 0 ? (
                <div
                  className={[
                    'absolute left-0 top-[15px] h-0.5 w-1/2',
                    isPast || isCurrent ? 'bg-[#D1D5DB]' : 'bg-[#F3F4F6]',
                  ].join(' ')}
                />
              ) : null}
              {index < stageTimelineItems.length - 1 ? (
                <div
                  className={[
                    'absolute right-0 top-[15px] h-0.5 w-1/2',
                    isPast ? 'bg-[#D1D5DB]' : 'bg-[#F3F4F6]',
                  ].join(' ')}
                />
              ) : null}
              <div
                className={[
                  'relative z-10 h-8 w-8 rounded-full border-4 bg-white',
                  isCurrent
                    ? 'border-[#E8798A] shadow-[0_0_0_8px_rgba(232,121,138,0.13),0_10px_28px_rgba(232,121,138,0.26)]'
                    : '',
                  isPast ? 'border-[#D1D5DB]' : '',
                  isFuture ? 'border-[#F3F4F6]' : '',
                ].join(' ')}
              />
              <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">
                {stage.label}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{stage.subLabel}</p>
              {isCurrent ? (
                <div className="mt-3 text-xs font-semibold text-[#E8798A]">
                  <span className="block">▲</span>
                  <span>{confidenceCopy[stageResult.confidence] ?? '你大概在这里'}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="space-y-2 md:hidden">
        {stageTimelineItems.map((stage, index) => {
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;

          return (
            <div
              key={stage.id}
              className={[
                'flex items-center gap-2 rounded-[12px] px-2.5 py-2',
                isCurrent ? 'bg-white/75 shadow-[0_8px_18px_rgba(232,121,138,0.08)]' : '',
              ].join(' ')}
            >
              <div className="flex shrink-0 flex-col items-center">
                <div
                  className={[
                    'h-3.5 w-3.5 rounded-full border-2 bg-white',
                    isCurrent ? 'border-[#E8798A] shadow-[0_0_0_6px_rgba(232,121,138,0.14)]' : '',
                    isPast ? 'border-[#D1D5DB]' : '',
                    !isCurrent && !isPast ? 'border-[#F3F4F6]' : '',
                  ].join(' ')}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold leading-5 text-[var(--color-text-primary)]">
                    {stage.label}
                  </p>
                  <p className="truncate text-xs leading-5 text-[var(--color-text-secondary)]">
                    · {stage.subLabel}
                  </p>
                </div>
              </div>
              {isCurrent ? (
                <span className="shrink-0 rounded-full bg-[rgba(232,121,138,0.12)] px-2 py-0.5 text-[11px] font-semibold text-[#E8798A]">
                  {confidenceCopy[stageResult.confidence] ?? '你大概在这里'}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StageTimeline;
