/**
 * 模板元数据（纯数据，无 React 依赖）：
 * 服务端模块（sitemap、SSR 页面）与客户端 hook（lib/utils.ts）共享，
 * 从 utils.ts 拆出以避免 Server Component 链路引入 useEffect/useState。
 */
export const TEMPLATE_META: Record<string, { name: string; desc: string; icon: string }> = {
  free: {
    name: '自由笔记',
    desc: '不提供固定结构，从空白开始自由编写 Markdown 笔记',
    icon: 'FileText',
  },
  cornell: {
    name: '康奈尔笔记法',
    desc: '主栏 + 线索栏 + 总结栏的三段式布局，适合课堂笔记与读书摘录',
    icon: 'LayoutGrid',
  },
  meeting_5w2h: {
    name: '5W2H分析法',
    desc: 'Why原因、What内容、Who人员、When时间、Where地点、How方法、How much成本',
    icon: 'ClipboardList',
  },
  six_hats: {
    name: '六顶思考帽',
    desc: '平行思维法：白红黑黄绿蓝六色分区，避免无序争论，提升决策质量',
    icon: 'HardHat',
  },
  eisenhower_matrix: {
    name: '时间管理四象限',
    desc: '艾森豪威尔矩阵：重要/紧急 × 紧急/不紧急四分区，优先排序，高效掌控时间',
    icon: 'Grid2X2',
  },
  monthly_plan: {
    name: '月计划',
    desc: '月度目标分解、关键里程碑、重点任务排布，月度复盘模板',
    icon: 'CalendarDays',
  },
  weekly_plan: {
    name: '周计划',
    desc: '本周核心目标、每日安排、重要会议与任务清单',
    icon: 'Calendar',
  },
  daily_plan: {
    name: '日计划',
    desc: '今日待办、时间块安排、重要事项优先排序，高效度过每一天',
    icon: 'CalendarClock',
  },
  woop: {
    name: 'WOOP 思维模型',
    desc: 'Wish愿望、Outcome结果、Obstacle障碍、Plan计划四步法，让愿望落地执行',
    icon: 'Sparkles',
  },
  ride: {
    name: 'RIDE 说服力模型',
    desc: 'Risk风险、Interest利益、Difference差异、Effect影响，构建有说服力的论证框架',
    icon: 'MessageSquare',
  },
  prep_method: {
    name: 'PREP 法则',
    desc: 'Point观点、Reason理由、Example案例、Point重申，结构化表达与演讲模板',
    icon: 'ListOrdered',
  },
  four_d_work: {
    name: '4D 工作法',
    desc: 'Do立刻做、Delay计划做、Delegate委托做、Delete删除做，任务优先级管理',
    icon: 'ListTodo',
  },
  empathy_map: {
    name: '同理心地图',
    desc: '用户所思/所感/所说/所做/所见/所闻，深度理解用户需求与体验',
    icon: 'HeartHandshake',
  },
  smart_goal: {
    name: 'SMART 目标制定',
    desc: 'Specific具体、Measurable可衡量、Achievable可实现、Relevant相关、Timebound有时限',
    icon: 'Target',
  },
  grai: {
    name: 'GRAI 复盘模型',
    desc: 'Goal目标回顾、Result结果评估、Analysis原因分析、Insight规律洞察，系统化复盘',
    icon: 'RotateCcw',
  },
}
