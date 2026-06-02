import { describe, expect, it } from 'vitest';
import {
  QUESTION_NAV_ACTION_CLASS,
  QUESTION_PAGE_SHELL_CLASS,
  scrollToQuestionPageTop,
} from './QuestionPage.jsx';

describe('QuestionPage layout classes', () => {
  it('keeps the step action area at the end of the current question page', () => {
    expect(QUESTION_NAV_ACTION_CLASS).not.toContain('fixed');
    expect(QUESTION_NAV_ACTION_CLASS).not.toContain('sticky');
    expect(QUESTION_NAV_ACTION_CLASS).not.toContain('bottom-0');
    expect(QUESTION_NAV_ACTION_CLASS).not.toContain('z-50');
  });

  it('does not reserve viewport space for a floating step action area', () => {
    expect(QUESTION_PAGE_SHELL_CLASS).not.toContain('pb-36');
    expect(QUESTION_PAGE_SHELL_CLASS).not.toContain('sm:pb-40');
  });

  it('scrolls to the top when a new question page is shown', () => {
    const calls = [];
    const target = {
      scrollTo: (options) => calls.push(options),
    };

    scrollToQuestionPageTop(target);

    expect(calls).toEqual([{ top: 0, left: 0, behavior: 'auto' }]);
  });
});
