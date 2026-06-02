import { PATTERN_NAMES, Q } from '../data/constants.js';
import { getQuestionById, getQuestionDisplayLabel, questions } from '../data/questions.js';
import {
  generateHeroSection,
  generateLabRecommendations,
  generateSymptomSeverity,
} from '../engine/reporting.js';

function toJson(value) {
  return JSON.stringify(value ?? {});
}

function formatDateTimeForFeishu(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day} ${byType.hour}:${byType.minute}:${byType.second}`;
}

function getOptionLabel(questionId, value) {
  const question = getQuestionById(questionId);
  if (!question?.options) return value == null ? '' : String(value);

  if (Array.isArray(value)) {
    return value
      .map((item) => question.options.find((option) => option.value === item)?.label ?? String(item))
      .join('、');
  }

  return question.options.find((option) => option.value === value)?.label ?? String(value ?? '');
}

function summarizeSymptomBurden(severity) {
  const domainText = severity.domains
    .map((domain) => `${domain.shortName}：${domain.level}`)
    .join('；');
  return `综合：${severity.total.level}；${domainText}`;
}

function summarizeRedFlags(redFlags = []) {
  if (!redFlags.length) return '无';
  return redFlags
    .map((flag) => `${flag.level ?? '提醒'}｜${flag.department ?? '建议就医'}｜${flag.message}`)
    .join('；');
}

function summarizeLabs(labs = []) {
  if (!labs.length) return '无';
  return labs
    .map((lab) => [lab.name, lab.items, lab.timing].filter(Boolean).join('｜'))
    .join('；');
}

function getQuestionColumnName(question) {
  return `${getQuestionDisplayLabel(question.id)} ${question.question}`;
}

function formatAnswerValue(questionId, value) {
  if (value == null) return '';
  const question = getQuestionById(questionId);
  if (!question?.options) return String(value);

  if (Array.isArray(value)) {
    return value
      .map((item) => question.options.find((option) => option.value === item)?.label ?? String(item))
      .join('、');
  }

  return question.options.find((option) => option.value === value)?.label ?? String(value);
}

function buildAnswerFields(answers = {}) {
  return Object.fromEntries(
    questions.map((question) => [
      getQuestionColumnName(question),
      formatAnswerValue(question.id, answers[question.id]),
    ]),
  );
}

export function buildFeishuRecordFields(snapshot = {}) {
  const answers = snapshot.answers ?? {};
  const result = snapshot.result ?? {};
  const hero = result.straw_stage ? generateHeroSection(result, answers) : null;
  const severity = generateSymptomSeverity(answers);
  const labs = result.patterns ? generateLabRecommendations(result, answers) : [];
  const birthYear = Number(snapshot.userInfo?.birthYear ?? answers[Q.BIRTH_YEAR]);

  return {
    报告编号: snapshot.reportId ?? '',
    提交时间: formatDateTimeForFeishu(snapshot.createdAt ?? new Date().toISOString()),
    姓名昵称: snapshot.userInfo?.name ?? answers[Q.NAME] ?? '',
    手机号: snapshot.userInfo?.phone ?? '',
    微信或邮箱: snapshot.userInfo?.contact ?? '',
    出生年份: Number.isFinite(birthYear) ? birthYear : null,
    年龄: Number.isFinite(Number(result.age)) ? Number(result.age) : null,
    BMI: Number.isFinite(Number(result.bmi?.value)) ? Number(result.bmi.value) : null,
    月经状态: getOptionLabel(Q.MENSTRUATION, answers[Q.MENSTRUATION]),
    阶段判断: hero ? `${hero.stageLabel}｜${hero.stageConfidenceLabel}` : '',
    主导模式: result.primaryPattern
      ? `${result.primaryPattern}｜${PATTERN_NAMES[result.primaryPattern] ?? ''}`
      : '',
    症状负担: summarizeSymptomBurden(severity),
    红旗提醒: summarizeRedFlags(result.redFlags),
    推荐检测: summarizeLabs(labs),
    ...buildAnswerFields(answers),
    完整报告JSON: toJson(result),
  };
}
