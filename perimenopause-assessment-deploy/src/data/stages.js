export const STAGE_ORDER = [
  'stage_late_repro',
  'stage_early_transition',
  'stage_late_transition',
  'stage_early_postmeno',
  'stage_late_postmeno',
];

export const stageTimelineItems = [
  { id: 'stage_late_repro', label: '生育晚期', subLabel: '变化萌芽' },
  { id: 'stage_early_transition', label: '围绝经早期', subLabel: '变化开始' },
  { id: 'stage_late_transition', label: '围绝经晚期', subLabel: '变化加速' },
  { id: 'stage_early_postmeno', label: '绝经早期', subLabel: '过渡完成' },
  { id: 'stage_late_postmeno', label: '绝经稳定期', subLabel: '新的稳定' },
];

export const stageContent = {
  stage_late_repro: {
    title: '生育晚期（变化萌芽期）',
    summary: '您的月经目前还比较规律，但这不代表什么都没在变。',
    body:
      '在这个阶段，卵巢功能已经开始悄悄下降。AMH、抑制素B和黄体期孕酮可能先发生变化，月经周期还没有明显被打乱，但经前不适、睡眠、情绪和精力可能已经出现微妙变化。',
    what_to_expect:
      '这个阶段可能持续数年。之后月经周期可能逐渐出现小波动，比如偶尔提前或推迟。',
    suggestion:
      '目前不需要特别医学干预，但适合了解自己的基线状态。方便的话，可以考虑检测 FSH、雌二醇和 AMH，作为后续变化的参照。',
  },
  stage_early_transition: {
    title: '围绝经早期（变化开始期）',
    summary: '您的身体已经进入围绝经期的早期阶段。',
    body:
      '这个阶段的标志是月经周期开始波动，前后相差一周以上，或有时变短、有时变长。背后通常是卵巢对脑垂体信号的响应变得不稳定，排卵不如从前规律，孕酮水平更容易不足。',
    what_to_expect:
      '早期围绝经期常会持续数年。随着时间推移，月经可能越来越不规律，最终出现连续数月不来月经。',
    suggestion:
      '建议开始记录周期和症状。如果失眠、情绪波动、潮热或经前不适影响生活，可以和医生讨论症状管理方案。',
  },
  stage_late_transition: {
    title: '围绝经晚期（变化加速期）',
    summary: '您正处于围绝经期中激素变化比较剧烈的阶段。',
    body:
      '在这个阶段，月经可能非常不规律，有时几个月不来，有时又突然出现。雌激素水平常常剧烈波动，排卵越来越少，因此潮热、睡眠和情绪变化也更容易明显。',
    what_to_expect:
      '当连续 12 个月没有月经时，就意味着正式进入绝经期。在那之前，月经仍可能偶尔出现。',
    suggestion:
      '这是最值得主动管理症状的阶段。建议与医生讨论是否需要激素检测和症状管理，同时关注骨密度和心血管健康。',
  },
  stage_early_postmeno: {
    title: '绝经早期（过渡完成期）',
    summary: '您已经完成围绝经期过渡，进入绝经后的早期阶段。',
    body:
      '绝经后前几年，FSH 仍可能继续升高，雌二醇继续下降，身体还在适应新的激素水平。潮热可能仍然存在，同时骨密度流失会更快。',
    what_to_expect:
      '绝经早期通常持续数年。之后进入更稳定的绝经后阶段，部分血管舒缩症状会逐渐减轻。',
    suggestion:
      '可以关注骨密度、血脂和心血管指标，并与医生讨论是否适合绝经激素治疗。',
  },
  stage_late_postmeno: {
    title: '绝经稳定期',
    summary: '您的激素水平可能已经基本稳定在绝经后的新基线上。',
    body:
      '在这个阶段，FSH 和雌二醇水平不再大幅波动。潮热通常减轻，但泌尿生殖方面的变化，如阴道干燥、尿频或反复泌尿感染，可能更需要关注。',
    what_to_expect:
      '这些长期变化通常不会自行完全恢复，但可以通过局部雌激素等方式有效管理。',
    suggestion:
      '可以持续关注骨密度、心血管和泌尿生殖健康。如有干涩或反复感染，可以与医生讨论局部治疗。',
  },
  stage_surgical_meno: {
    title: '手术性绝经',
    summary: '由于手术切除了双侧卵巢，您的身体经历了比较突然的激素变化。',
    body:
      '与自然绝经不同，双侧卵巢切除会让雌激素和孕酮骤然下降，身体没有渐进适应过程。因此潮热、情绪和睡眠问题可能更突然、更强烈。',
    what_to_expect:
      '如果在 50 岁以前接受手术，骨质疏松和心血管长期风险更需要主动管理。',
    suggestion:
      '强烈建议与医生讨论绝经激素治疗的可能性，并定期检测骨密度和心血管指标。',
  },
  stage_uncertain: {
    title: '暂时无法通过月经准确判断',
    summary: '由于您的月经信息无法直接反映卵巢功能，我们基于症状和年龄进行了初步推断。',
    body:
      '使用宫内节育器、激素类避孕药，或因子宫切除而无月经时，无法直接用月经周期变化判断阶段。但年龄、潮热、泌尿生殖症状和激素变化模式仍能提供线索。',
    what_to_expect: null,
    suggestion:
      '如果想更准确地了解卵巢功能状态，建议检测 FSH 和雌二醇。对于使用曼月乐的女性，FSH 检测通常仍有参考价值。',
  },
};

export function getStageContent(stage) {
  return stageContent[stage] ?? stageContent.stage_uncertain;
}
