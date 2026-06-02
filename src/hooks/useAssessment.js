import { startTransition, useEffect, useReducer, useState } from 'react';
import { clearReports, getReports, saveReport } from '../api/saveReport.js';
import { Q } from '../data/constants.js';
import { FLOW_STEP_TOTAL, QUESTION_STEP_TOTAL } from '../data/questions.js';
import {
  calculate,
  getMissingQuestionsForPage,
  getTriggeredRedFlags,
  getVisibleQuestionsForPage,
  shouldShowMenstrualDetailQuestions,
} from '../engine/calculator.js';
import { generateReportId } from '../utils/reportId.js';

const STORAGE_KEY = 'perimenopause_assessment';

const initialState = {
  currentStep: 0,
  answers: {},
  userInfo: {
    name: '',
    birthYear: '',
    phone: '',
    contact: '',
    consentMarketing: true,
  },
  result: null,
  activeRedFlags: [],
  isAnalyzing: false,
  pendingResult: null,
  reportId: null,
  createdAt: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'START_NEW':
      return {
        ...initialState,
        currentStep: 1,
      };

    case 'SET_ANSWER': {
      const nextAnswers = {
        ...state.answers,
        [action.payload.questionId]: action.payload.value,
      };

      if (
        action.payload.questionId === Q.MENSTRUATION &&
        !shouldShowMenstrualDetailQuestions(nextAnswers)
      ) {
        delete nextAnswers.Q8;
        delete nextAnswers.Q9;
        delete nextAnswers.Q10;
      }

      const nextUserInfo = { ...state.userInfo };
      if (action.payload.questionId === Q.NAME) {
        nextUserInfo.name = action.payload.value;
      }
      if (action.payload.questionId === Q.BIRTH_YEAR) {
        nextUserInfo.birthYear = action.payload.value;
      }

      return {
        ...state,
        answers: nextAnswers,
        userInfo: nextUserInfo,
        result: null,
        pendingResult: null,
        isAnalyzing: false,
      };
    }

    case 'SET_CONTACT_FIELD':
      return {
        ...state,
        userInfo: {
          ...state.userInfo,
          [action.payload.field]: action.payload.value,
        },
      };

    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };

    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(action.payload ?? state.currentStep + 1, FLOW_STEP_TOTAL),
      };

    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      };

    case 'START_ANALYSIS':
      return {
        ...state,
        currentStep: FLOW_STEP_TOTAL,
        result: null,
        pendingResult: action.payload,
        isAnalyzing: true,
      };

    case 'FINALIZE_REPORT':
      return {
        ...state,
        currentStep: FLOW_STEP_TOTAL,
        result: action.payload.result,
        pendingResult: null,
        isAnalyzing: false,
        reportId: action.payload.reportId,
        createdAt: action.payload.createdAt,
      };

    case 'SET_RED_FLAGS':
      return {
        ...state,
        activeRedFlags: action.payload,
      };

    case 'LOAD_SAVED_REPORT':
      return {
        ...state,
        currentStep: FLOW_STEP_TOTAL,
        answers: action.payload.answers ?? {},
        userInfo: {
          name: action.payload.userInfo?.name ?? action.payload.answers?.[Q.NAME] ?? '',
          birthYear:
            action.payload.userInfo?.birthYear ?? action.payload.answers?.[Q.BIRTH_YEAR] ?? '',
          phone: action.payload.userInfo?.phone ?? '',
          contact: action.payload.userInfo?.contact ?? '',
          consentMarketing: action.payload.userInfo?.consentMarketing ?? true,
        },
        result: action.payload.result ?? null,
        pendingResult: null,
        isAnalyzing: false,
        reportId: action.payload.reportId ?? null,
        createdAt: action.payload.createdAt ?? null,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

function readSavedAssessment() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSavedAssessment(snapshot) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function removeCurrentAssessment() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

function buildSnapshot(state, overrides = {}) {
  const userInfo = {
    name: overrides.userInfo?.name ?? state.userInfo.name ?? state.answers[Q.NAME] ?? '',
    birthYear:
      overrides.userInfo?.birthYear ??
      state.userInfo.birthYear ??
      state.answers[Q.BIRTH_YEAR] ??
      '',
    phone: overrides.userInfo?.phone ?? state.userInfo.phone ?? '',
    contact: overrides.userInfo?.contact ?? state.userInfo.contact ?? '',
    consentMarketing:
      overrides.userInfo?.consentMarketing ?? state.userInfo.consentMarketing ?? true,
  };

  return {
    version: '3.2',
    reportId: overrides.reportId ?? state.reportId ?? generateReportId(),
    userInfo,
    answers: overrides.answers ?? state.answers,
    result: overrides.result ?? state.result ?? state.pendingResult,
    createdAt: overrides.createdAt ?? state.createdAt ?? new Date().toISOString(),
  };
}

export function useAssessment() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [savedAssessment, setSavedAssessment] = useState(() => readSavedAssessment());
  const [savedReports, setSavedReports] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (!params.has('reset')) return;

    removeCurrentAssessment();
    clearReports();
    setSavedAssessment(null);
    setSavedReports([]);
    dispatch({ type: 'RESET' });
    params.delete('reset');
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, []);

  const visibleQuestions =
    state.currentStep >= 1 && state.currentStep <= QUESTION_STEP_TOTAL
      ? getVisibleQuestionsForPage(state.currentStep, state.answers)
      : [];

  const missingQuestions =
    state.currentStep >= 1 && state.currentStep <= QUESTION_STEP_TOTAL
      ? getMissingQuestionsForPage(state.currentStep, state.answers)
      : [];

  useEffect(() => {
    getReports().then((reports) => {
      setSavedReports(
        [...reports].sort(
          (left, right) => new Date(right.createdAt ?? 0) - new Date(left.createdAt ?? 0),
        ),
      );
    });
  }, []);

  useEffect(() => {
    if (state.currentStep < 1 || state.currentStep > QUESTION_STEP_TOTAL) {
      dispatch({ type: 'SET_RED_FLAGS', payload: [] });
      return;
    }

    dispatch({
      type: 'SET_RED_FLAGS',
      payload: getTriggeredRedFlags(state.answers, state.currentStep),
    });
  }, [state.answers, state.currentStep]);

  useEffect(() => {
    if (!state.isAnalyzing || !state.pendingResult) return undefined;

    const timeoutId = window.setTimeout(async () => {
      const snapshot = buildSnapshot(state, {
        result: state.pendingResult,
      });

      await saveReport(snapshot);
      writeSavedAssessment(snapshot);
      setSavedAssessment(snapshot);
      setSavedReports((current) => {
        const next = current.some((item) => item.reportId === snapshot.reportId)
          ? current.map((item) => (item.reportId === snapshot.reportId ? snapshot : item))
          : [snapshot, ...current];

        return [...next].sort(
          (left, right) => new Date(right.createdAt ?? 0) - new Date(left.createdAt ?? 0),
        );
      });

      dispatch({
        type: 'FINALIZE_REPORT',
        payload: {
          result: state.pendingResult,
          reportId: snapshot.reportId,
          createdAt: snapshot.createdAt,
        },
      });
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [state]);

  useEffect(() => {
    if (!state.result || !state.reportId) return;

    const snapshot = buildSnapshot(state);
    saveReport(snapshot).then(() => {
      writeSavedAssessment(snapshot);
      setSavedAssessment(snapshot);
      setSavedReports((current) => {
        const next = current.some((item) => item.reportId === snapshot.reportId)
          ? current.map((item) => (item.reportId === snapshot.reportId ? snapshot : item))
          : [snapshot, ...current];

        return [...next].sort(
          (left, right) => new Date(right.createdAt ?? 0) - new Date(left.createdAt ?? 0),
        );
      });
    });
  }, [state.reportId, state.result, state.userInfo]);

  function setAnswer(questionId, value) {
    dispatch({
      type: 'SET_ANSWER',
      payload: { questionId, value },
    });
  }

  function setContactField(field, value) {
    dispatch({
      type: 'SET_CONTACT_FIELD',
      payload: { field, value },
    });
  }

  function startAssessment() {
    dispatch({ type: 'START_NEW' });
  }

  function goNext() {
    if (state.currentStep === 0) {
      startAssessment();
      return;
    }

    if (state.currentStep >= 1 && state.currentStep < QUESTION_STEP_TOTAL) {
      dispatch({ type: 'NEXT_STEP', payload: state.currentStep + 1 });
      return;
    }

    if (state.currentStep === QUESTION_STEP_TOTAL) {
      startTransition(() => {
        const result = calculate(state.answers);
        dispatch({ type: 'START_ANALYSIS', payload: result });
      });
    }
  }

  function goPrev() {
    dispatch({ type: 'PREV_STEP' });
  }

  function jumpToStep(step) {
    if (step < 1 || step > QUESTION_STEP_TOTAL) return;
    dispatch({ type: 'SET_STEP', payload: step });
  }

  function viewSavedReport(reportId = null) {
    const selected = reportId
      ? savedReports.find((item) => item.reportId === reportId)
      : savedAssessment ?? savedReports[0];

    if (!selected?.result) return;

    dispatch({
      type: 'LOAD_SAVED_REPORT',
      payload: selected,
    });
  }

  function resetAssessment() {
    removeCurrentAssessment();
    dispatch({ type: 'RESET' });
  }

  function isPageComplete(page) {
    return getMissingQuestionsForPage(page, state.answers).length === 0;
  }

  return {
    state,
    visibleQuestions,
    missingQuestions,
    canGoNext: missingQuestions.length === 0,
    setAnswer,
    setContactField,
    startAssessment,
    goNext,
    goPrev,
    jumpToStep,
    resetAssessment,
    isPageComplete,
    hasSavedReport: savedReports.length > 0,
    savedReports,
    savedAssessment,
    viewSavedReport,
  };
}
