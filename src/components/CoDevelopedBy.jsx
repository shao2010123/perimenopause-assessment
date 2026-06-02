export const FOOTER_ATTRIBUTION_TEXT = '本报告由更年期健康智能分析系统自动生成';

export const FOOTER_LEGAL_ITEMS = [
  '©健康智能 湘ICP备2025133962号',
  '隐私政策',
  '使用条款',
  '帮助中心',
  '联系我们',
];

function CoDevelopedBy() {
  return (
    <section className="space-y-4 px-4 pb-12 sm:px-6 sm:pb-16">
      <div className="rounded-[22px] border border-white/40 bg-white/38 px-4 py-4 backdrop-blur-md sm:px-5 sm:py-5">
        <p className="text-center text-[12px] font-medium tracking-[0.08em] text-[#7B6B8A] sm:text-[13px]">
          {FOOTER_ATTRIBUTION_TEXT}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-0 gap-y-3 text-center text-[13px] font-medium text-[#95A4BC] sm:text-[15px]">
        {FOOTER_LEGAL_ITEMS.map((item, index) => (
          <span
            key={item}
            className={`px-4 leading-none ${
              index === 0 ? '' : 'border-l border-[#B7C2D3]'
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

export default CoDevelopedBy;
