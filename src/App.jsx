import { AnimatePresence, motion } from 'framer-motion';
import AnalyzingPage from './components/AnalyzingPage.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import QuestionPage from './components/QuestionPage.jsx';
import ResultPage from './components/ResultPage.jsx';
import WelcomePage from './components/WelcomePage.jsx';
import { FLOW_STEP_TOTAL, QUESTION_STEP_TOTAL } from './data/questions.js';
import { useAssessment } from './hooks/useAssessment.js';

const pageMotion = {
  initial: { opacity: 0, y: 26 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

function App() {
  const assessment = useAssessment();
  const { state } = assessment;
  const showQuestionFlow = state.currentStep >= 1 && state.currentStep <= QUESTION_STEP_TOTAL;

  return (
    <main className={`app-shell ${showQuestionFlow ? 'pt-12 sm:pt-16' : ''}`}>
      <div className="app-container">
        {showQuestionFlow ? <ProgressBar currentStep={state.currentStep} /> : null}

        <AnimatePresence mode="wait">
          {state.currentStep === 0 ? (
            <motion.div key="welcome" className="flex-1" {...pageMotion}>
              <WelcomePage
                onStart={assessment.startAssessment}
                onViewSaved={assessment.viewSavedReport}
                hasSavedReport={assessment.hasSavedReport}
                savedReports={assessment.savedReports}
              />
            </motion.div>
          ) : null}

          {state.currentStep >= 1 && state.currentStep <= QUESTION_STEP_TOTAL ? (
            <motion.div key={`questions-${state.currentStep}`} className="flex-1" {...pageMotion}>
            <QuestionPage
              currentStep={state.currentStep}
              answers={state.answers}
              questions={assessment.visibleQuestions}
              missingQuestions={assessment.missingQuestions}
              canGoNext={assessment.canGoNext}
              activeRedFlags={state.activeRedFlags}
              onAnswer={assessment.setAnswer}
              onPrev={assessment.goPrev}
              onNext={assessment.goNext}
            />
            </motion.div>
          ) : null}

          {state.currentStep === FLOW_STEP_TOTAL && state.isAnalyzing ? (
            <motion.div key="analyzing" className="flex-1" {...pageMotion}>
              <AnalyzingPage name={state.userInfo.name || state.answers.Q0_NAME} />
            </motion.div>
          ) : null}

          {state.currentStep === FLOW_STEP_TOTAL && state.result ? (
            <motion.div key="result" className="flex-1" {...pageMotion}>
              <ResultPage
                answers={state.answers}
                userInfo={state.userInfo}
                result={state.result}
                reportId={state.reportId}
                createdAt={state.createdAt}
                onUserInfoChange={assessment.setContactField}
                onRestart={assessment.resetAssessment}
                onEditStep={assessment.jumpToStep}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default App;
