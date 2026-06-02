import { REFERENCE_DISPLAY_COUNT } from './references.js';

export const Q = {
  NAME: 'Q0_NAME',
  BIRTH_YEAR: 'Q1',
  MENSTRUATION: 'Q2',
  HEIGHT: 'Q3',
  WEIGHT: 'Q4',
  SURGERY: 'Q5',
  MEDICATION: 'Q6',
  FAMILY_HISTORY: 'Q7',
  FLOW_CHANGE: 'Q8',
  PMS_SYMPTOMS: 'Q9',
  CYCLE_CHANGE: 'Q10',
  ABNORMAL_BLEEDING: 'Q11',
  HOT_FLASH: 'Q12',
  NIGHT_SWEATS: 'Q13',
  PALPITATIONS: 'Q14',
  LOW_MOOD: 'Q15',
  ANXIETY: 'Q16',
  STRESS_TOLERANCE: 'Q17',
  SLEEP: 'Q18',
  WAKE_REASON: 'Q19',
  POST_MEAL_FATIGUE: 'Q20',
  SUGAR_CRAVING: 'Q21',
  HUNGER_REACTION: 'Q22',
  WEIGHT_GAIN: 'Q23',
  AFTERNOON_FATIGUE: 'Q24',
  MORNING_RECOVERY: 'Q25',
  VAGINAL_DRYNESS: 'Q26',
  JOINT_PAIN: 'Q27',
  SKIN_HAIR: 'Q28',
  TEMPERATURE_SENSITIVITY: 'Q29',
  BODY_SIGNS: 'Q30',
  LIBIDO: 'Q31',
  MEMORY: 'Q32',
};

export const PATTERN_KEYS = ['A', 'B', 'C', 'D'];

export const PATTERN_NAMES = {
  A: '孕激素下降型',
  B: '雌孕激素比例失调型',
  C: '激素波动型',
  D: '雌激素低下型',
};

export const PATTERN_DESCRIPTIONS = {
  A: {
    name: '孕激素下降型',
    subtitle: '身体的“安抚剂”开始减少',
    summary:
      '您的身体可能正处于孕激素开始减少的阶段，这是围绝经期最早出现的变化之一。孕激素像身体里的“安抚剂”，它减少后，经前不适、焦虑和睡眠问题会更容易被放大。',
  },
  B: {
    name: '雌孕激素比例失调型',
    subtitle: '雌激素相对于孕激素偏高的状态',
    summary:
      '这不是一种疾病诊断，而是描述您当前可能处于的一种激素比例状态，即雌激素相对于孕激素水平偏高。在激素过渡阶段，尤其是生育期后期到围绝经期的过程中，孕激素往往会比雌激素更早、更快地下降，导致这种相对失衡。',
  },
  C: {
    name: '激素波动型',
    subtitle: '激素忽高忽低，身体还在适应',
    summary:
      '您正处于雌激素波动比较明显的阶段，身体需要不断适应“忽高忽低”的变化。潮热、情绪起伏和周期紊乱都常见于这个阶段。',
  },
  D: {
    name: '雌激素低下型',
    subtitle: '雌激素明显减少，身体在重新调整',
    summary:
      '您的雌激素已经比较明显地下降，身体可能进入围绝经后期或绝经后阶段。潮热、干涩、关节不适和睡眠变浅都更容易出现。',
  },
};

export const DISCLAIMER = `本工具基于 STRAW+10 国际生殖衰老分期系统（Harlow et al., 2012）、更年期评定量表 MRS（Heinemann et al., 2003）和 Greene 更年期量表（Greene, 1976）的条目框架设计，综合 ${REFERENCE_DISPLAY_COUNT} 篇经过同行评审的临床研究文献。评估结果用于帮助理解阶段、症状负担和可能的身体变化线索，不构成疾病诊断或治疗建议。如有任何健康疑虑，请咨询妇科或内分泌科医生。`;
