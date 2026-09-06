import type { Category, NoteListItem, Tag } from "@/lib/types"
import type { Locale } from "@/lib/i18n"
import zhMessages from "@/messages/zh.json"
import enMessages from "@/messages/en.json"

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

type Msg = typeof zhMessages
function tag(id: string, nameKey: keyof Msg["guest"]["tags"]): Tag {
  return { id, name: zhMessages.guest.tags[nameKey], color: "#8a8f98", created_at: "2026-08-30T09:00:00.000Z" }
}
function tagEn(id: string, nameKey: keyof Msg["guest"]["tags"]): Tag {
  return { id, name: enMessages.guest.tags[nameKey], color: "#8a8f98", created_at: "2026-08-30T09:00:00.000Z" }
}

const TAG_DEMO = tag("guest-tag-demo", "demo")
const TAG_STUDY = tag("guest-tag-study", "study")
const TAG_WORK = tag("guest-tag-work", "work")
const TAG_PLAN = tag("guest-tag-plan", "plan")
const TAG_RETRO = tag("guest-tag-retro", "retro")
const TAG_COMM = tag("guest-tag-comm", "comm")
const TAG_PRODUCT = tag("guest-tag-product", "product")

const TAG_DEMO_EN = tagEn("guest-tag-demo", "demo")
const TAG_STUDY_EN = tagEn("guest-tag-study", "study")
const TAG_WORK_EN = tagEn("guest-tag-work", "work")
const TAG_PLAN_EN = tagEn("guest-tag-plan", "plan")
const TAG_RETRO_EN = tagEn("guest-tag-retro", "retro")
const TAG_COMM_EN = tagEn("guest-tag-comm", "comm")
const TAG_PRODUCT_EN = tagEn("guest-tag-product", "product")

export const GUEST_TAGS_ZH: Tag[] = [TAG_DEMO, TAG_STUDY, TAG_WORK, TAG_PLAN, TAG_RETRO, TAG_COMM, TAG_PRODUCT]
export const GUEST_TAGS_EN: Tag[] = [TAG_DEMO_EN, TAG_STUDY_EN, TAG_WORK_EN, TAG_PLAN_EN, TAG_RETRO_EN, TAG_COMM_EN, TAG_PRODUCT_EN]

export const GUEST_CATEGORIES_ZH: Category[] = [
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

export const GUEST_CATEGORIES_EN: Category[] = [
  { id: CAT_IDS.study, name: "Learning & Growth", parent_id: null, sort_order: 1, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.work, name: "Work", parent_id: null, sort_order: 2, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.time, name: "Time Management", parent_id: CAT_IDS.work, sort_order: 1, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.plan, name: "Planning", parent_id: CAT_IDS.work, sort_order: 2, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.comm, name: "Communication", parent_id: null, sort_order: 3, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.meeting, name: "Meetings", parent_id: CAT_IDS.comm, sort_order: 1, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.express, name: "Expression", parent_id: CAT_IDS.comm, sort_order: 2, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.goal, name: "Goals & Review", parent_id: null, sort_order: 4, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.goalSet, name: "Goal Setting", parent_id: CAT_IDS.goal, sort_order: 1, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.retro, name: "Project Review", parent_id: CAT_IDS.goal, sort_order: 2, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
  { id: CAT_IDS.product, name: "Product & Decisions", parent_id: null, sort_order: 5, created_at: "2026-08-30T09:00:00.000Z", updated_at: "2026-08-30T09:00:00.000Z" },
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

/** 中文：14 类思维模型 × 各一条示例笔记 */
export const GUEST_NOTES_ZH: NoteListItem[] = [
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

/** 英文：14 类思维模型 × 各一条示例笔记 */
export const GUEST_NOTES_EN: NoteListItem[] = [
  note("guest-note-cornell", "Chapter 3 — Three-Level Information Processing Model (Cognitive Psychology)", "cornell", CAT_IDS.study, "2026-09-04T10:24:00.000Z", [TAG_STUDY]),
  note("guest-note-eisenhower", "Weekly Task List — Important / Urgent Quadrant Sort", "eisenhower_matrix", CAT_IDS.time, "2026-09-05T08:12:00.000Z", [TAG_WORK, TAG_PLAN]),
  note("guest-note-4d", "Today's To-Dos — 4D Method: Do / Delay / Delegate / Delete", "four_d_work", CAT_IDS.time, "2026-09-05T08:40:00.000Z", [TAG_WORK]),
  note("guest-note-monthly", "September 2026 Work Plan", "monthly_plan", CAT_IDS.plan, "2026-08-31T21:05:00.000Z", [TAG_WORK, TAG_PLAN]),
  note("guest-note-weekly", "Week 36 Plan — Core Goals & Daily Schedule", "weekly_plan", CAT_IDS.plan, "2026-09-01T09:18:00.000Z", [TAG_WORK, TAG_PLAN]),
  note("guest-note-daily", "Sept 5 Daily Plan — Top Three for Today", "daily_plan", CAT_IDS.plan, "2026-09-05T07:55:00.000Z", [TAG_PLAN]),
  note("guest-note-5w2h", "Q3 Product Review Meeting Notes", "meeting_5w2h", CAT_IDS.meeting, "2026-09-03T16:42:00.000Z", [TAG_WORK, TAG_COMM]),
  note("guest-note-prep", "Why Everyone Should Keep a Work Journal (PREP Framework)", "prep_method", CAT_IDS.express, "2026-09-02T14:30:00.000Z", [TAG_COMM]),
  note("guest-note-ride", "Persuading the Team to Adopt a Graded Release Plan (RIDE Model)", "ride", CAT_IDS.express, "2026-09-04T15:20:00.000Z", [TAG_COMM, TAG_WORK]),
  note("guest-note-smart", "Q4 Personal Growth — SMART Goals", "smart_goal", CAT_IDS.goalSet, "2026-08-30T20:10:00.000Z", [TAG_PLAN]),
  note("guest-note-woop", "Half Marathon in Three Months — WOOP Plan", "woop", CAT_IDS.goalSet, "2026-09-01T19:36:00.000Z", [TAG_PLAN]),
  note("guest-note-grai", "\"Note Template Feature\" Launch — GRAI Retrospective", "grai", CAT_IDS.retro, "2026-09-04T18:02:00.000Z", [TAG_RETRO, TAG_WORK]),
  note("guest-note-sixhats", "Should We Launch a Free Tier? Six Thinking Hats Analysis", "six_hats", CAT_IDS.product, "2026-09-02T11:47:00.000Z", [TAG_PRODUCT]),
  note("guest-note-empathy", "E-Learning User Empathy Map", "empathy_map", CAT_IDS.product, "2026-09-03T10:26:00.000Z", [TAG_PRODUCT]),
]

/** 根据当前语言返回游客示例数据。默认（未知）回退到中文。 */
export function getGuestData(locale: Locale): { notes: NoteListItem[]; tags: Tag[]; categories: Category[] } {
  if (locale === "en") return { notes: GUEST_NOTES_EN, tags: GUEST_TAGS_EN, categories: GUEST_CATEGORIES_EN }
  return { notes: GUEST_NOTES_ZH, tags: GUEST_TAGS_ZH, categories: GUEST_CATEGORIES_ZH }
}

// 向后兼容旧 import 名
export const GUEST_NOTES = GUEST_NOTES_ZH
export const GUEST_TAGS = GUEST_TAGS_ZH
export const GUEST_CATEGORIES = GUEST_CATEGORIES_ZH
