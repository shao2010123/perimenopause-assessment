import { motion } from 'framer-motion';
import { REFERENCE_DISPLAY_COUNT } from '../data/references.js';

const TOTAL_ITEMS = REFERENCE_DISPLAY_COUNT;

function AnalyzingPage({ name }) {
  const steps = [
    '正在分析您的症状模式...',
    '比对 STRAW+10 分期特征...',
    `交叉验证 ${TOTAL_ITEMS} 篇临床文献...`,
    '整理症状严重程度与激素变化线索...',
    '评估代谢与甲状腺风险叠加...',
    `${name || '您'}，您的个性化报告已生成 ✓`,
  ];

  return (
    <section className="mx-auto flex min-h-[70dvh] w-full max-w-2xl items-center">
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card w-full text-center"
      >
        <span className="soft-pill">请稍候</span>
        <div className="mt-5 space-y-3">
          <h2 className="section-heading">{name ? `${name}，正在为您分析…` : '正在分析您的回答…'}</h2>
          <p className="section-subtitle">
            我们会把答案转成一份更容易理解、也更方便行动的分析结果。
          </p>
        </div>

        <div className="mt-7 flex items-center justify-center gap-3">
          <span className="dot-pulse h-3 w-3 rounded-full bg-[var(--color-primary-start)]" />
          <span className="dot-pulse h-3 w-3 rounded-full bg-[var(--color-primary-end)]" />
          <span className="dot-pulse h-3 w-3 rounded-full bg-[var(--color-accent-coral)]" />
        </div>

        <motion.div
          className="mt-8 space-y-3 text-left"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.8,
              },
            },
          }}
        >
          {steps.map((item) => (
            <motion.div
              key={item}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0 },
              }}
              className="rounded-[18px] border border-white/60 bg-white/58 px-4 py-3 text-sm text-[var(--color-text-secondary)]"
            >
              {item}
            </motion.div>
          ))}
        </motion.div>
      </motion.article>
    </section>
  );
}

export default AnalyzingPage;
