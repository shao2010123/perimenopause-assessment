import { useEffect } from 'react';
import { Q } from '../data/constants.js';
import { getQuestionDisplayLabel, QUESTION_STEP_TOTAL } from '../data/questions.js';
import { getQuestionPrompt, shouldShowMenstrualDetailQuestions } from '../engine/calculator.js';
import MultiQuestion from './MultiQuestion.jsx';
import NumberQuestion from './NumberQuestion.jsx';
import RedFlagAlert from './RedFlagAlert.jsx';
import ScaleQuestion from './ScaleQuestion.jsx';
import SingleQuestion from './SingleQuestion.jsx';
import TextQuestion from './TextQuestion.jsx';

const pageContent = {
  1: {
    eyebrow: '基础信息',
    title: '先认识一下',
    description: '几个基础问题，帮助我们更准确地分析。',
  },
  2: {
    eyebrow: '月经变化',
    title: '月经的信号',
    description: '月经是身体的“晴雨表”，它的变化藏着重要线索。',
  },
  3: {
    eyebrow: '典型症状表现',
    title: '典型症状表现',
    description: '症状是身体发出的“提醒信号”，它们的频率和强度能帮助我们看清当前负担。',
  },
};

function renderQuestion(question, prompt, answers, onAnswer, compact = false) {
  if (question.type === 'scale') {
    return (
      <ScaleQuestion
        question={question}
        prompt={prompt}
        value={answers[question.id]}
        onChange={onAnswer}
      />
    );
  }

  if (question.type === 'multi') {
    return (
      <MultiQuestion
        question={question}
        prompt={prompt}
        value={answers[question.id] ?? []}
        onChange={onAnswer}
      />
    );
  }

  if (question.type === 'number') {
    return (
      <NumberQuestion
        question={question}
        prompt={prompt}
        value={answers[question.id]}
        onChange={onAnswer}
        compact={compact}
      />
    );
  }

  if (question.type === 'text') {
    return (
      <TextQuestion
        question={question}
        prompt={prompt}
        value={answers[question.id]}
        onChange={onAnswer}
      />
    );
  }

  return (
    <SingleQuestion
      question={question}
      prompt={prompt}
      value={answers[question.id]}
      onChange={onAnswer}
    />
  );
}

function getPersonalizedDescription(step, name, baseDescription) {
  if (!name) return baseDescription;

  return baseDescription;
}

export const QUESTION_PAGE_SHELL_CLASS =
  'mx-auto flex w-full max-w-3xl flex-col gap-3 sm:gap-4';

export const QUESTION_NAV_ACTION_CLASS =
  'surface-card space-y-3 bg-[rgba(255,255,255,0.82)] pb-[max(1rem,env(safe-area-inset-bottom))] sm:space-y-4 sm:bg-[rgba(255,255,255,0.75)] sm:pb-4';

export function scrollToQuestionPageTop(target = window) {
  target.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function QuestionCard({ question, answers, onAnswer, compact = false }) {
  const prompt = getQuestionPrompt(question, answers);
  const displayLabel = getQuestionDisplayLabel(question.id);

  return (
    <article className={`question-block space-y-4 ${compact ? 'compact-question-block h-full' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="soft-pill">{displayLabel}</span>
        {question.required ? (
          <span className="text-[11px] font-medium text-[var(--color-accent-coral)] sm:text-xs">
            必答
          </span>
        ) : null}
      </div>
      {renderQuestion(question, prompt, answers, onAnswer, compact)}
    </article>
  );
}

function PageOneLayout({ questions, answers, onAnswer }) {
  const introQuestions = questions.filter((question) =>
    [Q.NAME, Q.BIRTH_YEAR, Q.HEIGHT, Q.WEIGHT].includes(question.id),
  );
  const profileQuestions = questions.filter((question) =>
    [Q.MENSTRUATION, Q.SURGERY, Q.MEDICATION, Q.FAMILY_HISTORY].includes(question.id),
  );

  const heightQuestion = introQuestions.find((question) => question.id === Q.HEIGHT);
  const weightQuestion = introQuestions.find((question) => question.id === Q.WEIGHT);

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="surface-card space-y-4 sm:space-y-5">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] sm:text-xl">认识您</h3>
          <p className="text-[13px] text-[var(--color-text-secondary)] sm:text-sm">
            这些信息会帮助我们更准确地理解您的年龄阶段、BMI 和基础背景。
          </p>
        </div>

        {introQuestions
          .filter((question) => ![Q.HEIGHT, Q.WEIGHT].includes(question.id))
          .map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              answers={answers}
              onAnswer={onAnswer}
            />
          ))}

        <div className="grid gap-3 md:grid-cols-2 sm:gap-4">
          {heightQuestion ? (
            <QuestionCard
              question={heightQuestion}
              answers={answers}
              onAnswer={onAnswer}
              compact
            />
          ) : null}
          {weightQuestion ? (
            <QuestionCard
              question={weightQuestion}
              answers={answers}
              onAnswer={onAnswer}
              compact
            />
          ) : null}
        </div>
      </section>

      <div className="mx-2 border-t border-[rgba(184,169,212,0.18)] sm:mx-4" />

      <section className="surface-card space-y-4 sm:space-y-5">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] sm:text-xl">
            您的健康背景
          </h3>
          <p className="text-[13px] text-[var(--color-text-secondary)] sm:text-sm">
            这些问题会帮助我们理解月经阶段、手术史和家族线索。
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {profileQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              answers={answers}
              onAnswer={onAnswer}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function QuestionPage({
  currentStep,
  answers,
  questions,
  missingQuestions,
  canGoNext,
  activeRedFlags,
  onAnswer,
  onPrev,
  onNext,
}) {
  const meta = pageContent[currentStep];
  const name = answers[Q.NAME];
  const description = getPersonalizedDescription(currentStep, name, meta.description);
  const showMenstrualDetails = shouldShowMenstrualDetailQuestions(answers);

  useEffect(() => {
    scrollToQuestionPageTop();
  }, [currentStep]);

  return (
    <section className={QUESTION_PAGE_SHELL_CLASS}>
      <div className="surface-card space-y-3 sm:space-y-4">
        <span className="soft-pill">{meta.eyebrow}</span>
        <div className="space-y-2">
          <h2 className="section-heading">{meta.title}</h2>
          <p className="section-subtitle">{description}</p>
        </div>

        {currentStep === 2 && name ? (
          <div className="rounded-[16px] bg-[rgba(184,169,212,0.12)] p-3.5 text-[13px] leading-6 text-[var(--color-text-secondary)] sm:rounded-[18px] sm:p-4 sm:text-sm sm:leading-7">
            好的 {name}，接下来聊聊您的月经变化。
          </div>
        ) : null}

        {currentStep === 3 && name ? (
          <div className="rounded-[16px] bg-[rgba(184,169,212,0.12)] p-3.5 text-[13px] leading-6 text-[var(--color-text-secondary)] sm:rounded-[18px] sm:p-4 sm:text-sm sm:leading-7">
            好的 {name}，接下来聊聊这些典型症状表现。
          </div>
        ) : null}

        {currentStep === 2 && answers[Q.MENSTRUATION] === 'D' && showMenstrualDetails ? (
          <div className="rounded-[16px] bg-[rgba(123,175,212,0.14)] p-3.5 text-[13px] leading-6 text-[var(--color-text-secondary)] sm:rounded-[18px] sm:p-4 sm:text-sm sm:leading-7">
            您已经超过半年没来月经，这一页可以结合最后几次月经的变化来回忆作答。
          </div>
        ) : null}

        {currentStep === 2 && !showMenstrualDetails ? (
          <div className="rounded-[16px] bg-[rgba(212,167,106,0.12)] p-3.5 text-[13px] leading-6 text-[var(--color-text-secondary)] sm:rounded-[18px] sm:p-4 sm:text-sm sm:leading-7">
            因为您目前没有可用于判断周期变化的自然月经，这一页仅保留“异常出血”相关问题。
          </div>
        ) : null}
      </div>

      {currentStep === 1 ? (
        <PageOneLayout questions={questions} answers={answers} onAnswer={onAnswer} />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              answers={answers}
              onAnswer={onAnswer}
            />
          ))}
        </div>
      )}

      <RedFlagAlert redFlags={activeRedFlags} />

      <div className={QUESTION_NAV_ACTION_CLASS}>
        {!canGoNext ? (
          <p className="text-[13px] text-[var(--color-accent-coral)] sm:text-sm">
            还有 {missingQuestions.length} 题未完成，答完后才能进入下一步。
          </p>
        ) : (
          <p className="text-[13px] text-[var(--color-text-secondary)] sm:text-sm">当前页已完成，可以继续。</p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <button type="button" onClick={onPrev} className="ghost-button w-full sm:w-auto">
            上一步
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className={`gradient-button w-full sm:w-auto ${currentStep === QUESTION_STEP_TOTAL ? 'px-7 shadow-[0_10px_36px_rgba(184,169,212,0.44)]' : ''}`}
          >
            {currentStep === QUESTION_STEP_TOTAL ? '查看我的分析结果 →' : '继续'}
          </button>
        </div>
      </div>
    </section>
  );
}

export default QuestionPage;
