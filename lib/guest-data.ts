import type { Category, NoteListItem, Tag } from "@/lib/types"

/**
 * 游客模式示例数据（纯前端，不落库）：
 * - 14 类思维模型各一条示例笔记，点击后按模板类型预览 public/templates/example 下的示例 markdown
 * - 示例分类目录为两级树形结构，展示目录组织的用法
 */

const CAT_IDS = {
  study: "guest-cat-study",
  work: "guest-cat-work",
  time: "guest-cat-time",
  plan: "guest-cat-plan",
  comm: "guest-cat-comm",
  meeting: "guest-cat-meeting",
  express: "guest-cat-express",
  goal: "guest-cat-goal",
  goalSet: "guest-cat-goal-set",
  retro: "guest-cat-retro",
  product: "guest-cat-product",
} as const

const TAG_DEMO: Tag = { id: "guest-tag-demo", name: "示例", color: "#8a8f98", created_at: "2026-08-30T09:00:00.000Z" }
const TAG_STUDY: Tag = { id: "guest-tag-study", name: "学习", color: "#5b8def", created_at: "2026-08-30T09:00:00.000Z" }
const TAG_WORK: Tag = { id: "guest-tag-work", name: "工作", color: "#e6a23c", created_at: "2026-08-30T09:00:00.000Z" }
const TAG_PLAN: Tag = { id: "guest-tag-plan", name: "计划", color: "#9a6ee0", created_at: "2026-08-30T09:00:00.000Z" }
const TAG_RETRO: Tag = { id: "guest-tag-retro", name: "复盘", color: "#e67e48", created_at: "2026-08-30T09:00:00.000Z" }
const TAG_COMM: Tag = { id: "guest-tag-comm", name: "沟通", color: "#3aa675", created_at: "2026-08-30T09:00:00.000Z" }
const TAG_PRODUCT: Tag = { id: "guest-tag-product", name: "产品", color: "#d4662f", created_at: "2026-08-30T09:00:00.000Z" }

export const GUEST_TAGS: Tag[] = [
  TAG_DEMO, TAG_STUDY, TAG_WORK, TAG_PLAN, TAG_RETRO, TAG_COMM, TAG_PRODUCT,
]

export const GUEST_CATEGORIES: Category[] = [
  { id: CAT_IDS.study, name: "学习成长", parent_id: null, sort_order: 1, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.work, name: "职场工作", parent_id: null, sort_order: 2, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.time, name: "时间管理", parent_id: CAT_IDS.work, sort_order: 1, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.plan, name: "计划安排", parent_id: CAT_IDS.work, sort_order: 2, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.comm, name: "沟通协作", parent_id: null, sort_order: 3, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.meeting, name: "会议沟通", parent_id: CAT_IDS.comm, sort_order: 1, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.express, name: "表达说服", parent_id: CAT_IDS.comm, sort_order: 2, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.goal, name: "目标与复盘", parent_id: null, sort_order: 4, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.goalSet, name: "目标设定", parent_id: CAT_IDS.goal, sort_order: 1, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.retro, name: "项目复盘", parent_id: CAT_IDS.goal, sort_order: 2, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.product, name: "产品与决策", parent_id: null, sort_order: 5, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
]

function note(
  id: string,
  title: string,
  template_type: string,
  category_id: string,
  updated_at: string,
  tags: Tag[],
): NoteListItem {
  return { id, title, template_type, file_path: null, category_id, updated_at, deleted_at: null, tags: [TAG_DEMO, ...tags.filter((t) => t !== TAG_DEMO)] }
}

/** 14 类思维模型 × 各一条示例笔记 */
export const GUEST_NOTES: NoteListItem[] = [
  note("guest-note-cornell", "《认知心理学》第 3 章：记忆的三级加工模型", "cornell", CAT_IDS.study, "2026-09-04T10:24:00.000Z", [TAG_STUDY]),
  note("guest-note-eisenhower", "本周任务清单：重要 / 紧急四象限排序", "eisenhower_matrix", CAT_IDS.time, "2026-09-05T08:12:00.000Z", [TAG_WORK, TAG_PLAN]),
  note("guest-note-4d", "今日待办的 4D 处理：Do / Delay / Delegate / Delete", "four_d_work", CAT_IDS.time, "2026-09-05T08:40:00.000Z", [TAG_WORK]),
  note("guest-note-monthly", "2026 年 9 月工作计划", "monthly_plan", CAT_IDS.plan, "2026-08-31T21:05:00.000Z", [TAG_WORK, TAG_PLAN]),
  note("guest-note-weekly", "第 36 周计划：核心目标与每日安排", "weekly_plan", CAT_IDS.plan, "2026-09-01T09:18:00.000Z", [TAG_WORK, TAG_PLAN]),
  note("guest-note-daily", "9 月 5 日每日计划：今日三件事", "daily_plan", CAT_IDS.plan, "2026-09-05T07:55:00.000Z", [TAG_PLAN]),
  note("guest-note-5w2h", "Q3 产品评审会会议纪要", "meeting_5w2h", CAT_IDS.meeting, "2026-09-03T16:42:00.000Z", [TAG_WORK, TAG_COMM]),
  note("guest-note-prep", "为什么每个人都该写工作日志（PREP 表达）", "prep_method", CAT_IDS.express, "2026-09-02T14:30:00.000Z", [TAG_COMM]),
  note("guest-note-ride", "说服团队采用灰度发布方案（RIDE 模型）", "ride", CAT_IDS.express, "2026-09-04T15:20:00.000Z", [TAG_COMM, TAG_WORK]),
  note("guest-note-smart", "Q4 个人成长 SMART 目标", "smart_goal", CAT_IDS.goalSet, "2026-08-30T20:10:00.000Z", [TAG_PLAN]),
  note("guest-note-woop", "三个月完成半程马拉松：WOOP 计划", "woop", CAT_IDS.goalSet, "2026-09-01T19:36:00.000Z", [TAG_PLAN]),
  note("guest-note-grai", "「笔记模板功能」上线 GRAI 复盘", "grai", CAT_IDS.retro, "2026-09-04T18:02:00.000Z", [TAG_RETRO, TAG_WORK]),
  note("guest-note-sixhats", "是否推出免费版？六顶思考帽分析", "six_hats", CAT_IDS.product, "2026-09-02T11:47:00.000Z", [TAG_PRODUCT]),
  note("guest-note-empathy", "在线教育用户共情地图", "empathy_map", CAT_IDS.product, "2026-09-03T10:26:00.000Z", [TAG_PRODUCT]),
]
