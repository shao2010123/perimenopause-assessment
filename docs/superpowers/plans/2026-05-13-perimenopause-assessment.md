# 围绝经期综合健康筛查测评 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一个可本地运行、可导出 PDF 的围绝经期健康自评 SPA。

**Architecture:** 采用单应用状态源加纯函数推断引擎。数据、计算、推荐和界面拆分到独立目录，结果页复用纯函数产出图表和卡片内容。

**Tech Stack:** React 18、Vite、Tailwind CSS 4、Recharts、html2pdf.js、Vitest

---

### Task 1: 工程骨架与样式

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `src/main.jsx`
- Create: `src/styles/index.css`

- [ ] 配置 Vite、Tailwind 4、React 入口与全局设计变量。
- [ ] 固定 `base: './'`，保证静态构建结果可直接打开。

### Task 2: 数据与推断引擎

**Files:**
- Create: `src/data/questions.js`
- Create: `src/data/recommendations.js`
- Create: `src/engine/calculator.js`
- Create: `src/engine/reporting.js`
- Test: `src/engine/calculator.test.js`

- [ ] 先写 3 个样例测试，锁定模式、甲状腺方向、胰岛素区间与推荐结果。
- [ ] 实现题目读取、分页可见性、红旗解析、模式评分和叠加风险计算。
- [ ] 实现检测推荐与生活方式建议聚合函数。

### Task 3: 应用流程与问卷交互

**Files:**
- Create: `src/App.jsx`
- Create: `src/hooks/useAssessment.js`
- Create: `src/components/*.jsx`

- [ ] 实现首页、问卷分页、进度条、题型组件、必填校验与实时红旗提示。
- [ ] 实现上一步、回跳修改、结果页展示与重新测评。

### Task 4: 导出与验证

**Files:**
- Modify: `src/components/ResultPage.jsx`
- Create: `src/components/PdfExport.jsx`

- [ ] 实现 PDF 导出、本地存储、免责声明和结果页折叠区块。
- [ ] 运行测试与构建，确认输出写入 `dist/`。
