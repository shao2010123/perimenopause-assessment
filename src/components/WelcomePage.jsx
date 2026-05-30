import { motion } from 'framer-motion';
import CoDevelopedBy from './CoDevelopedBy.jsx';
import { REFERENCE_DISPLAY_COUNT } from '../data/references.js';

const valueCards = [
  {
    title: '"我现在到底处在哪个阶段？"',
    body:
      '测评会先根据月经情况和症状，推断你更接近 STRAW+10 的哪个阶段；同时把血管舒缩、情绪认知、泌尿生殖、躯体症状和感觉异常整理成症状负担分级，让你先看清“走到哪一步、重不重”。',
  },
  {
    title: '"我需要去做检查吗？查什么？"',
    body:
      '报告会按国内医院更常见的检查组套给出建议，比如性激素六项、AMH、甲状腺功能五项/七项、代谢相关检查或骨密度检查，方便你拿去和医生沟通。',
  },
  {
    title: '"除了吃药，我自己还能做什么？"',
    body:
      '报告会把需要关注的风险和下一步行动放在一起：哪些要检查、哪些适合先从饮食、运动、睡眠或私密护理做起，尽量给到能马上执行的建议。',
  },
];

function formatSavedTime(savedCompletedAt) {
  if (!savedCompletedAt) return '';

  try {
    return new Date(savedCompletedAt).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function GlassValueCard({ card, delay = 0 }) {
  return (
    <motion.div
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.3)',
      }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0, transition: { delay } }}
      viewport={{ once: true, margin: '-40px' }}
    >
      <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-[#E8937E] sm:mb-2 sm:text-xs">
        你可能正在想
      </p>
      <h3 className="mb-2 text-base font-bold text-[#4A3B5C] sm:text-lg">{card.title}</h3>
      <p className="text-[13px] leading-relaxed text-[#7B6B8A] sm:text-sm">{card.body}</p>
    </motion.div>
  );
}

function WelcomePage({ onStart, onViewSaved, hasSavedReport, savedReports = [] }) {
  const latestReport = savedReports[0];

  return (
    <section className="mx-auto w-full max-w-5xl">
      <section className="flex min-h-[62vh] flex-col justify-center px-4 pb-6 pt-8 sm:min-h-[70vh] sm:px-6 sm:pb-8 sm:pt-12">
        <motion.div
          className="mb-4 inline-flex self-start rounded-full bg-[#B8A9D4]/15 px-3 py-1.5 text-[11px] text-[#7B6B8A] sm:mb-6 sm:text-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        >
          {`基于 STRAW+10 国际分期标准 · ${REFERENCE_DISPLAY_COUNT} 篇临床文献支持`}
        </motion.div>

        <motion.h1
          className="mb-4 text-[2rem] font-bold leading-snug text-[#4A3B5C] sm:mb-5 md:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
        >
          最近的不舒服，
          <br />
          是激素在变化吗？
        </motion.h1>

        <motion.p
          className="mb-6 max-w-md text-[15px] leading-relaxed text-[#7B6B8A] sm:mb-10 sm:text-base"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
        >
          失眠、焦虑、月经紊乱、潮热、身体干涩……这些变化可能不是「老了」，而是激素正在经历一场重要的转变。
          <span className="mt-3 block font-medium text-[#4A3B5C]">
            5 分钟测评，帮你看清当前阶段、症状负担，以及下一步该查什么、怎么调。
          </span>
        </motion.p>

        <motion.button
          type="button"
          className="w-full rounded-2xl bg-gradient-to-r from-[#E8937E] to-[#D4A76A] px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-[#E8937E]/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] sm:w-auto sm:self-start sm:px-8 sm:py-4 sm:text-base"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
          onClick={onStart}
        >
          开始测一测 →
        </motion.button>
      </section>

      {hasSavedReport && latestReport ? (
        <section className="px-4 pb-5 sm:px-6 sm:pb-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            className="surface-card space-y-4"
          >
            <span className="soft-pill">欢迎回来</span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] sm:text-xl">
                {latestReport.userInfo?.name || '您'}，欢迎回来
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)] sm:text-sm">
                您上次在 {formatSavedTime(latestReport.createdAt)} 做过测评，可以继续查看，也可以重新测一测。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onViewSaved(latestReport.reportId)}
                className="primary-outline-button flex-1"
              >
                查看上次报告
              </button>
              <button type="button" onClick={onStart} className="ghost-button flex-1">
                重新测评
              </button>
            </div>
            {savedReports.length > 1 ? (
              <div className="space-y-2 border-t border-[rgba(184,169,212,0.18)] pt-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">历史报告</p>
                <div className="space-y-2">
                  {savedReports.slice(0, 3).map((report) => (
                    <button
                      key={report.reportId}
                      type="button"
                      onClick={() => onViewSaved(report.reportId)}
                      className="w-full rounded-[16px] border border-white/65 bg-white/55 px-4 py-3 text-left text-sm text-[var(--color-text-secondary)]"
                    >
                      {report.userInfo?.name || '未命名用户'} · {formatSavedTime(report.createdAt)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.div>
        </section>
      ) : null}

      <section className="space-y-3 px-4 pb-10 sm:space-y-4 sm:px-6 sm:pb-12">
        {valueCards.map((card, index) => (
          <GlassValueCard key={card.title} card={card} delay={index * 0.1} />
        ))}
      </section>

      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="flex items-start gap-3 rounded-2xl bg-[#A8C5A0]/10 px-4 py-3.5 sm:px-5 sm:py-4">
          <span className="mt-0.5 text-lg">📋</span>
          <div>
            <p className="mb-1 text-sm font-medium text-[#4A3B5C]">测评结束后可导出 PDF 报告</p>
            <p className="text-xs leading-relaxed text-[#7B6B8A]">
              方便保存或直接发给你的医生，让就诊沟通更高效。
            </p>
          </div>
        </div>
      </section>

      <CoDevelopedBy />
    </section>
  );
}

export default WelcomePage;
