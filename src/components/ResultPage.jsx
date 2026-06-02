import { useRef } from 'react';
import { motion } from 'framer-motion';
import { DISCLAIMER } from '../data/constants.js';
import { QUESTION_STEP_TOTAL } from '../data/questions.js';
import { getCoreRefs, REFERENCE_DISPLAY_COUNT } from '../data/references.js';
import {
  generateHeroSection,
  generateNarrativeExplanation,
  generateRecommendationCards,
  generateSymptomSeverity,
} from '../engine/reporting.js';
import { maskPhone } from '../utils/phoneFormat.js';
import ContactForm from './ContactForm.jsx';
import PdfExport from './PdfExport.jsx';
import StageTimeline from './StageTimeline.jsx';

export const REPORT_ACTION_PRIMARY_CLASS = 'w-full sm:basis-4/5';
export const REPORT_ACTION_SECONDARY_CLASS = 'w-full sm:basis-1/5';

function formatDate(value, compact = false) {
  if (!value) return '';

  try {
    return new Date(value).toLocaleDateString('zh-CN', compact
      ? { year: 'numeric', month: '2-digit', day: '2-digit' }
      : { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

function Section({ eyebrow, title, description, children }) {
  return (
    <section className="surface-card space-y-5">
      <div className="space-y-2">
        {eyebrow ? <span className="soft-pill">{eyebrow}</span> : null}
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {description ? (
          <p className="text-sm leading-7 text-[var(--color-text-secondary)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ReportHeader({ displayName, age, reportDate, reportId }) {
  return (
    <div className="sticky top-2 z-30 rounded-[18px] border border-white/70 bg-white/80 px-4 py-3 text-sm text-[var(--color-text-secondary)] shadow-[0_8px_24px_rgba(61,49,71,0.06)] backdrop-blur-md">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-[var(--color-text-primary)]">
          {displayName}的评估报告
          {age ? <span className="ml-2 font-normal text-[var(--color-text-secondary)]">· {age}岁</span> : null}
          {reportDate ? <span className="ml-2 font-normal text-[var(--color-text-secondary)]">· {reportDate}</span> : null}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">{reportId}</p>
      </div>
    </div>
  );
}

function HeroSection({ hero, result }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 58%, rgba(232,121,138,0.10) 100%)',
      }}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <span className="soft-pill">STRAW+10 分期</span>
          <h1 className="text-[1.9rem] font-semibold leading-tight text-[var(--color-text-primary)] sm:text-[2.35rem]">
            {hero.headline}
          </h1>
          <p className="text-lg font-semibold text-[#E8798A]">
            {hero.stageLabel}
            <span className="ml-2 rounded-full bg-white/70 px-3 py-1 text-sm">{hero.stageConfidenceLabel}</span>
          </p>
        </div>

        <StageTimeline stageResult={result.straw_stage} />

        <p className="rounded-[18px] bg-white/60 px-4 py-3 text-sm leading-7 text-[var(--color-text-primary)]">
          {hero.evidence}
        </p>
      </div>
    </motion.section>
  );
}

function SeveritySection({ severity }) {
  if (severity.displayMode === 'summary') {
    return (
      <section className="surface-card space-y-5">
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">你的症状负担</h2>

        <div className="flex justify-center">
          <span
            className="rounded-full px-6 py-3 text-lg font-semibold shadow-[0_8px_24px_rgba(61,49,71,0.06)]"
            style={{ color: severity.summary.tone.color, background: severity.summary.tone.bg }}
          >
            {severity.summary.label}
          </span>
        </div>

        <div className="space-y-3 text-left text-base leading-8 text-[#374151] sm:px-8">
          {severity.summary.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {severity.total.needsCareDiscussion ? (
          <p className="rounded-[12px] bg-[#FFF7ED] px-4 py-3 text-center text-[13px] leading-6 text-[#F59E0B]">
            你的症状可能已影响生活质量，建议与医生讨论是否需要干预。
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="surface-card space-y-4">
      <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">你的症状负担</h2>

      <div className="space-y-1">
        {severity.domains.map((domain) => {
          const isMuted = domain.level === '无/轻微';
          const barColor = isMuted ? '#D1D5DB' : domain.tone.color;
          const fillWidth = domain.score > 0 ? Math.max(4, Math.round(domain.ratio * 100)) : 0;

          return (
            <details key={domain.key} className="group rounded-[10px] bg-white/35 px-2 py-1">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
                <span
                  className={`w-[4.4rem] shrink-0 text-[15px] ${domain.isEmphasized ? 'font-bold' : 'font-semibold'}`}
                  style={{ color: isMuted ? '#9CA3AF' : '#333' }}
                >
                  {domain.shortName}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#F0F0F0] sm:max-w-[45%]">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${fillWidth}%`, background: barColor }}
                  />
                </span>
                <span
                  className={`w-16 shrink-0 text-right text-sm ${domain.isEmphasized ? 'font-bold' : 'font-semibold'}`}
                  style={{ color: isMuted ? '#9CA3AF' : domain.tone.color }}
                >
                  {domain.level}
                </span>
            </summary>
              <div className="border-t border-[#F3F4F6] pb-1 pt-2 text-xs leading-6 text-[var(--color-text-secondary)]">
                <p>{domain.name}：{domain.score}/{domain.max}</p>
                <p>{domain.description}</p>
              </div>
            </details>
          );
        })}
      </div>

      <div
        className="rounded-[14px] px-4 py-3 text-center text-base leading-7"
        style={{ color: severity.total.tone.color, background: severity.total.tone.bg }}
      >
        <p className="font-semibold">综合：{severity.total.level}</p>
        {severity.total.needsCareDiscussion ? (
          <p className="mt-1 text-[13px] leading-6 text-[#F59E0B]">
            你的症状可能已影响生活质量，建议与医生讨论是否需要干预。
          </p>
        ) : null}
      </div>
    </section>
  );
}

function NarrativeSection({ narrative }) {
  return (
    <Section title={narrative.title}>
      <div className="rounded-[14px] border border-white/70 bg-white/60 px-4 py-3">
        <p className="text-sm font-semibold text-[#E8798A]">{narrative.patternLine}</p>
      </div>

      <div className="space-y-4 text-base leading-8 text-[#374151]">
        {narrative.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <div className="rounded-[14px] bg-[#F9FAFB] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{narrative.meaningTitle}</p>
        <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">{narrative.mechanism}</p>
      </div>
    </Section>
  );
}

function ActionCard({ card, index }) {
  return (
    <article
      className="rounded-[12px] border border-white/70 bg-white/72 px-4 py-4 shadow-[0_8px_24px_rgba(61,49,71,0.05)] sm:px-5 sm:py-5"
      style={{ borderLeft: `4px solid ${card.tone.color}` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold" style={{ color: card.tone.color }}>
            {String(index + 1).padStart(2, '0')} · {card.tone.label}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">{card.title}</h3>
        </div>
      </div>

      <p className="mt-4 text-[15px] leading-7 text-[#4B5563]">{card.reason}</p>

      <div className="mt-4 rounded-[10px] bg-[#F9FAFB] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">下一步</p>
        <ul className="mt-2 space-y-2 text-sm leading-6 text-[#4B5563]">
          {card.actions.map((action) => (
            <li key={action} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: card.tone.color }} />
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function ActionSection({ cards }) {
  return (
    <Section title="建议与下一步">
      <div className="space-y-4">
        {cards.map((card, index) => (
          <ActionCard key={`${card.type}-${card.title}`} card={card} index={index} />
        ))}
      </div>
    </Section>
  );
}

function DetailsPanel({ title, children }) {
  return (
    <details className="rounded-[14px] border border-white/70 bg-white/55 px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--color-text-secondary)]">
        {title}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function ReportFooter({
  result,
  coreReferences,
  reportId,
  maskedPhone,
  userInfo,
  onEditStep,
}) {
  return (
    <footer className="surface-card space-y-3">
      <DetailsPanel title="关于本评估">
        <div className="space-y-4">
          <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
            本评估基于 STRAW+10 生殖衰老分期标准，并参考 MRS、Peri-SS 等更年期症状量表框架，将月经线索、症状严重程度和风险信号综合成健康建议。结果不能替代医学诊断，建议作为就诊沟通参考。
          </p>
          {result.bmi?.value !== null ? (
            <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
              BMI：{result.bmi.value.toFixed(1)}（{result.bmi.category}）。BMI 会影响雌激素代谢和胰岛素敏感性，已纳入本次分析。
            </p>
          ) : null}
          {maskedPhone ? (
            <p
              className="report-phone-value text-sm text-[var(--color-text-secondary)]"
              data-report-phone
              data-full-phone={userInfo.phone}
              data-masked-phone={maskedPhone}
            >
              联系方式：{maskedPhone}
            </p>
          ) : null}
        </div>
      </DetailsPanel>

      <DetailsPanel title="科学依据">
        <p className="text-xs leading-7 text-[var(--color-text-secondary)]">
          本评估基于 STRAW+10 国际生殖衰老分期系统和经验证的围绝经期症状量表（MRS/Peri-SS/GCS）设计，综合 {REFERENCE_DISPLAY_COUNT}
          篇临床研究文献，仅供健康参考，不构成医疗诊断。
        </p>
        <div className="mt-4 space-y-2">
          {coreReferences.map((ref) => (
            <p key={ref.id} className="text-xs text-[var(--color-text-secondary)]">
              [{ref.id}] {ref.displayShort}
              {ref.url ? (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-[var(--color-accent-coral)] hover:underline"
                >
                  ↗
                </a>
              ) : null}
            </p>
          ))}
        </div>
      </DetailsPanel>

      <DetailsPanel title="免责声明与报告操作">
        <p data-pdf-disclaimer className="text-xs leading-7 text-[var(--color-text-secondary)]">
          了解自己的身体是迈向健康的第一步。{DISCLAIMER}
        </p>
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">报告编号：{reportId}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: QUESTION_STEP_TOTAL }, (_, index) => index + 1).map((step) => (
            <button
              key={step}
              type="button"
              data-pdf-hidden
              onClick={() => onEditStep(step)}
              className="primary-outline-button !min-h-10 !px-4 !py-2 text-sm"
            >
              返回第 {step} 页修改
            </button>
          ))}
        </div>
      </DetailsPanel>
    </footer>
  );
}

function ResultPage({
  answers,
  userInfo,
  result,
  reportId,
  createdAt,
  onUserInfoChange,
  onRestart,
  onEditStep,
}) {
  const reportRef = useRef(null);
  const hero = generateHeroSection(result, answers);
  const severity = generateSymptomSeverity(answers);
  const narrative = generateNarrativeExplanation(result, answers);
  const actionCards = generateRecommendationCards(result, answers);
  const displayName = userInfo.name || answers.Q0_NAME || '您';
  const reportDate = formatDate(createdAt, true);
  const maskedPhone = maskPhone(userInfo.phone);
  const coreReferences = getCoreRefs();

  return (
    <section className="space-y-5">
      <div ref={reportRef} className="space-y-5">
        <ReportHeader
          displayName={displayName}
          age={result.age}
          reportDate={reportDate}
          reportId={reportId}
        />
        <HeroSection hero={hero} result={result} />
        <SeveritySection severity={severity} />
        <NarrativeSection narrative={narrative} />
        <ActionSection cards={actionCards} />
        <ReportFooter
          result={result}
          coreReferences={coreReferences}
          reportId={reportId}
          maskedPhone={maskedPhone}
          userInfo={userInfo}
          onEditStep={onEditStep}
        />
      </div>

      <ContactForm userInfo={userInfo} onChange={onUserInfoChange}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PdfExport
            className={REPORT_ACTION_PRIMARY_CLASS}
            targetRef={reportRef}
            answers={answers}
            userInfo={userInfo}
            result={result}
            reportId={reportId}
            createdAt={createdAt}
          />
          <button
            type="button"
            onClick={onRestart}
            className={`ghost-button ${REPORT_ACTION_SECONDARY_CLASS}`}
          >
            重新测评
          </button>
        </div>
      </ContactForm>
    </section>
  );
}

export default ResultPage;
