export const patternDescriptions = {
  A: {
    name: '孕激素下降型',
    shortName: '孕激素下降型',
    subtitle: '身体的“安抚剂”开始减少',
    heroTitle: '孕激素下降期',
    heroSubtitle: '安抚感在下降，情绪和睡眠会更敏感',
    description:
      '您的身体可能正处于孕激素开始减少的阶段，这是围绝经期最早出现的变化之一。孕激素像身体里的“安抚剂”，它减少后，经前不适、焦虑和睡眠问题会更容易被放大。',
    color: '#A78BDB',
  },
  B: {
    name: '雌孕激素比例失调型',
    shortName: '雌孕激素比例失调型',
    subtitle: '雌激素相对于孕激素偏高的状态',
    heroTitle: '雌孕激素比例失调期',
    heroSubtitle: '雌激素相对于孕激素偏高，月经和胀痛信号更突出',
    description:
      '这不是一种疾病诊断，而是描述您当前可能处于的一种激素比例状态，即雌激素相对于孕激素水平偏高。在激素过渡阶段，尤其是生育期后期到围绝经期的过程中，孕激素往往会比雌激素更早、更快地下降，导致这种相对失衡。',
    color: '#E8937E',
  },
  C: {
    name: '激素波动型',
    shortName: '激素波动型',
    subtitle: '激素忽高忽低，身体还在适应',
    heroTitle: '激素波动期',
    heroSubtitle: '激素忽高忽低，身体正在努力适应',
    description:
      '您正处于雌激素波动比较明显的阶段，身体需要不断适应“忽高忽低”的变化。潮热、情绪起伏和周期紊乱都常见于这个阶段。',
    color: '#F2C572',
  },
  D: {
    name: '雌激素低下型',
    shortName: '雌激素低下型',
    subtitle: '雌激素明显减少，身体在重新调整',
    heroTitle: '雌激素低下期',
    heroSubtitle: '雌激素已经明显下降，进入后期适应阶段',
    description:
      '您的雌激素已经比较明显地下降，身体可能进入围绝经后期或绝经后阶段。潮热、干涩、关节不适和睡眠变浅都更容易出现。',
    color: '#7BAFD4',
  },
};

export const overlayDescriptions = {
  thyroid: {
    hypo: {
      name: '甲状腺功能减退风险',
      description:
        '您的部分症状更偏向甲减线索，例如怕冷、便秘、疲惫、皮肤干和脱发，建议进一步做甲状腺功能检查。',
    },
    hyper: {
      name: '甲状腺功能亢进风险',
      description:
        '您有一些偏向甲亢的信号，例如怕热、心跳快、腹泻或明显烦躁，建议尽快排查甲状腺功能。',
    },
    mixed: {
      name: '甲状腺功能异常风险',
      description:
        '您同时出现偏甲减和偏甲亢的表现，需要结合实验室检查进一步区分，桥本甲状腺炎等情况也会出现这种重叠。',
    },
    normal: {
      name: '甲状腺风险',
      description:
        '目前甲状腺相关线索不算集中，但如果后续出现脖子肿胀、心悸或明显怕冷怕热变化，仍建议结合检查明确原因。',
    },
  },
  insulin: {
    name: '胰岛素抵抗风险',
    description:
      'PCOS、体重偏高或腰围增加，都可能提示胰岛素抵抗风险。适合结合空腹血糖和空腹胰岛素进一步判断。',
  },
  adrenal: {
    name: '肾上腺疲劳/应激过载风险',
    description:
      '如果您越来越觉得抗压差、下午断电、早上也恢复不过来，说明压力应对系统可能已经超负荷，需要优先做睡眠和节律干预。',
  },
};

export const testRecommendations = {
  patterns: {
    A: [
      { name: '黄体中期孕酮（P）', timing: '月经第21天左右抽血', reason: '确认是否仍有排卵及孕酮水平', priority: 'essential' },
      { name: '雌二醇（E2）', timing: '月经第2-5天', reason: '了解基础雌激素水平', priority: 'essential' },
      { name: 'FSH', timing: '月经第2-5天', reason: '判断卵巢功能阶段', priority: 'essential' },
    ],
    B: [
      { name: '雌二醇（E2）+ 孕酮（P）', timing: '月经第2-5天 + 第21天各一次', reason: '确认雌/孕比例', priority: 'essential' },
      { name: 'FSH + LH', timing: '月经第2-5天', reason: '综合判断', priority: 'essential' },
      { name: '盆腔超声', timing: '月经结束后3-5天', reason: '排查子宫肌瘤、内膜增厚、息肉', priority: 'essential' },
    ],
    C: [
      { name: '雌二醇（E2）+ FSH + LH', timing: '月经第2-5天（如有月经）', reason: '捕捉当前激素水平', priority: 'essential' },
      { name: 'AMH', timing: '任意时间', reason: '评估卵巢储备', priority: 'recommended' },
      { name: '盆腔超声', timing: '方便时', reason: '了解子宫内膜和卵巢状况', priority: 'recommended' },
    ],
    D: [
      { name: '雌二醇（E2）+ FSH', timing: '任意时间（已停经）', reason: '确认雌激素低下程度', priority: 'essential' },
      { name: '骨密度检测（DEXA）', timing: '任意时间', reason: '评估骨质流失风险', priority: 'essential' },
      { name: '血脂四项', timing: '空腹', reason: '雌激素下降后心血管风险上升', priority: 'recommended' },
    ],
  },
  overlays: {
    thyroid: [
      { name: 'TSH + FT3 + FT4', reason: '全面评估甲状腺功能', priority: 'essential' },
      { name: 'TPOAb（甲状腺过氧化物酶抗体）', reason: '排查桥本甲状腺炎等自身免疫性甲状腺病', priority: 'recommended' },
    ],
    insulin: [
      { name: '空腹血糖 + 空腹胰岛素', reason: '计算 HOMA-IR，评估胰岛素抵抗程度', priority: 'essential' },
      { name: '糖化血红蛋白（HbA1c）', reason: '反映近 3 个月平均血糖水平', priority: 'recommended' },
    ],
    adrenal: [
      { name: '晨间皮质醇（8:00 AM 抽血）', reason: '评估肾上腺功能', priority: 'recommended' },
      { name: 'DHEA-S', reason: '了解肾上腺雄激素前体水平', priority: 'recommended' },
    ],
  },
  optional: [
    { name: '维生素D（25-OH-VD）', reason: '围绝经期女性普遍缺乏，影响骨骼和情绪', priority: 'optional' },
    { name: '铁蛋白', reason: '月经量大的女性容易缺铁', priority: 'optional' },
    { name: '维生素B12 + 叶酸', reason: '影响能量代谢和情绪', priority: 'optional' },
  ],
};

export const lifestyleAdvice = {
  patterns: {
    A: [
      {
        icon: '🧘',
        title: '减压优先',
        text: '孕激素对压力非常敏感。每天留 10 分钟做深呼吸、冥想或散步，睡前给自己一个固定的放松收尾。',
        triggers: [
          { questionId: 'Q16', minScore: 2, label: '焦虑紧绷' },
          { questionId: 'Q18', minScore: 2, label: '睡眠变浅' },
        ],
      },
      {
        icon: '🥦',
        title: '支持激素代谢',
        text: '多吃西兰花、花菜、白菜等十字花科蔬菜，帮助雌激素代谢更顺畅。',
        triggers: [
          { questionId: 'Q9', includes: 'breast', label: '经前乳房胀痛' },
          { questionId: 'Q9', includes: 'edema', label: '经前浮肿' },
        ],
      },
      {
        icon: '🚫',
        title: '减少外源雌激素',
        text: '少用塑料盒加热食物，尽量避开含 parabens 的个人护理品。',
        triggers: [
          { questionId: 'Q8', minScore: 1, label: '经量变化' },
          { questionId: 'Q9', includes: 'breast', label: '乳房胀痛' },
        ],
      },
    ],
    B: [
      {
        icon: '🥗',
        title: '帮助雌激素代谢',
        text: '增加十字花科蔬菜、发酵食品和膳食纤维，帮助身体把多余雌激素代谢出去。',
        triggers: [
          { questionId: 'Q8', minScore: 2, label: '经量增多' },
          { questionId: 'Q9', includes: 'breast', label: '乳房胀痛' },
          { questionId: 'Q9', includes: 'edema', label: '水肿浮肿' },
        ],
      },
      {
        icon: '⚖️',
        title: '管理腰腹体重',
        text: '每周至少 150 分钟中等强度运动，重点照顾腰腹脂肪和整体胰岛素敏感性。',
        triggers: [],
      },
      {
        icon: '🌿',
        title: '照顾肠道',
        text: '肠道菌群会参与雌激素循环，规律吃全谷物、豆类和益生菌食物更有帮助。',
        triggers: [
          { questionId: 'Q9', includes: 'edema', label: '水肿波动' },
        ],
      },
    ],
    C: [
      {
        icon: '⏰',
        title: '把节律先稳住',
        text: '尽量固定起床、吃饭和运动的时间，给激素大波动期一个稳定的生活锚点。',
        triggers: [
          { questionId: 'Q10', minScore: 2, label: '周期紊乱' },
          { questionId: 'Q12', minScore: 1, label: '潮热' },
        ],
      },
      {
        icon: '🫘',
        title: '适量植物雌激素',
        text: '每天 1 杯豆浆或一小把亚麻籽，常能温和缓解忽高忽低带来的不适。',
        triggers: [
          { questionId: 'Q12', minScore: 1, label: '潮热' },
          { questionId: 'Q26', minScore: 1, label: '干涩不适' },
        ],
      },
      {
        icon: '🏃‍♀️',
        title: '持续动起来',
        text: '每周 3 到 5 次、每次 30 分钟的快走、游泳或瑜伽，对潮热和情绪都有帮助。',
        triggers: [
          { questionId: 'Q12', minScore: 1, label: '潮热' },
          { questionId: 'Q16', minScore: 1, label: '焦虑波动' },
          { questionId: 'Q18', minScore: 1, label: '睡眠受影响' },
        ],
      },
    ],
    D: [
      {
        icon: '🦴',
        title: '保护骨骼',
        text: '关注钙、维生素 D 和负重运动，帮助延缓雌激素下降后的骨量流失。',
        triggers: [
          { questionId: 'Q27', minScore: 1, label: '关节僵硬' },
          { questionId: 'Q26', minScore: 1, label: '干涩不适' },
        ],
      },
      {
        icon: '💧',
        title: '照顾私密处',
        text: '选择无香料保湿产品，必要时与医生讨论局部保湿或治疗方案。',
        triggers: [
          { questionId: 'Q26', minScore: 1, label: '阴道干涩' },
          { questionId: 'Q26', minScore: 2, label: '亲密不适' },
        ],
      },
      {
        icon: '🧠',
        title: '继续训练大脑',
        text: '规律有氧运动、学习新事物和保持社交，都能帮助维持认知状态。',
        triggers: [],
      },
    ],
  },
  overlays: {
    insulin: [
      {
        icon: '🍽️',
        title: '调整进食顺序',
        text: '每餐先吃蔬菜和蛋白质，最后吃主食。餐后散步 15 分钟。这个简单改变就能明显改善饭后犯困和血糖波动。',
        triggers: [],
      },
    ],
    adrenal: [
      {
        icon: '☕',
        title: '给压力踩刹车',
        text: '下午 2 点后减少咖啡，晚间避免过高强度训练，每天留一点真正空白的恢复时间。',
        triggers: [
          { questionId: 'Q18', minScore: 2, label: '失眠' },
        ],
      },
    ],
    thyroid: [
      {
        icon: '🧂',
        title: '关注碘摄入',
        text: '海带、紫菜可以适量吃，但不要自行过量补碘；如果已知桥本或甲状腺结节，请按医生建议来。',
        triggers: [
          { questionId: 'Q29', equals: 'A', label: '明显怕冷' },
          { questionId: 'Q29', equals: 'B', label: '明显怕热' },
        ],
      },
    ],
  },
};

export const priorityLabels = {
  essential: '⭐ 必查',
  recommended: '📋 建议',
  optional: '💡 可选',
};
