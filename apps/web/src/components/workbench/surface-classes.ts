// Shared workbench surfaces: very light canvas, thin gray borders, white panels,
// and barely-there shadows keep operational screens dense without feeling heavy.
const panelClassName =
  "rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

const softPanelClassName = "rounded-xl border border-slate-200 bg-slate-100/45";

// HeroUI Tabs 的 pill 风格覆写：透明列表 + 白底圆角指示器，
// 供顶部导航、资料分区、简历编辑器三处共用。
const pillTabListClassName = "w-auto gap-2 bg-transparent p-0";

const pillTabClassName =
  "h-8 w-auto shrink-0 gap-2 rounded-[12px] px-3 text-sm font-semibold leading-5 text-slate-500 hover:bg-slate-100/70 hover:text-slate-900 hover:opacity-100 data-[selected=true]:text-blue-600";

const pillTabIndicatorClassName =
  "rounded-[12px] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.08)]";

export {
  panelClassName,
  pillTabClassName,
  pillTabIndicatorClassName,
  pillTabListClassName,
  softPanelClassName,
};
