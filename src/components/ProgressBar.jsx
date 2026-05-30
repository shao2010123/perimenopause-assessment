import { motion } from 'framer-motion';
import { pageMeta, QUESTION_STEP_TOTAL } from '../data/questions.js';

function ProgressBar({ currentStep }) {
  const progress = (currentStep / QUESTION_STEP_TOTAL) * 100;
  const moduleName = pageMeta[currentStep]?.title ?? '';

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-white/55 backdrop-blur-sm">
        <motion.div
          className="h-full rounded-r-full"
          style={{ background: 'var(--gradient-primary)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <div className="sticky top-2 z-40 mx-auto w-full max-w-3xl px-0.5 sm:top-3 sm:px-1">
        <div className="mx-auto w-fit rounded-full border border-white/70 bg-white/68 px-3 py-1.5 text-center text-[13px] text-[var(--color-text-secondary)] backdrop-blur-xl sm:px-4 sm:py-2 sm:text-sm">
          {moduleName}
        </div>
      </div>
    </>
  );
}

export default ProgressBar;
