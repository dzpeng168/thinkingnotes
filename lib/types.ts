export interface Note {
  id: string
  title: string
  template_type: string
  // Web 版正文持久化于 notes.content 列
  content: string
  /** 仅旧桌面数据导入时保留，新笔记为 null */
  file_path: string | null
  category_id?: string | null
  created_at: string
  updated_at: string
}

export interface NoteListItem {
  id: string
  title: string
  template_type: string
  file_path: string | null
  category_id?: string | null
  updated_at: string
  /** 软删除标记；非空表示已进入回收站 */
  deleted_at?: string | null
  tags: Tag[]
}

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  parent_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

/** 树形分类节点，children 由前端构建 */
export interface CategoryNode extends Category {
  children: CategoryNode[]
  noteCount: number
}

export type TemplateType = 'free' | 'cornell' | 'meeting_5w2h' | 'six_hats' | 'eisenhower_matrix' | 'monthly_plan' | 'weekly_plan' | 'daily_plan' | 'woop' | 'ride' | 'prep_method' | 'four_d_work' | 'empathy_map' | 'smart_goal' | 'grai' | 'trust_equation' | 'onion_model' | 'star_report' | 'fossa_comm' | 'core_aq'

/**
 * 模板 → 示例笔记 slug 的纯映射（Client / Server 通用，零运行时依赖）。
 * 用于登录页模板矩阵、新建笔记弹窗等前端位置，给"查看示例"按钮提供 URL。
 * 没对应示例的模板（如 free / 自由笔记）不在表里。
 */
export const EXAMPLE_SLUG_BY_TTYPE: Partial<Record<TemplateType, string>> = {
  cornell: 'cornell-notes-example',
  meeting_5w2h: '5w2h-example',
  six_hats: 'six-thinking-hats-example',
  eisenhower_matrix: 'eisenhower-matrix-example',
  monthly_plan: 'monthly-plan-example',
  weekly_plan: 'weekly-plan-example',
  daily_plan: 'daily-plan-example',
  woop: 'woop-thinking-example',
  ride: 'ride-persuasion-example',
  prep_method: 'prep-method-example',
  four_d_work: '4d-work-example',
  empathy_map: 'empathy-map-example',
  smart_goal: 'smart-goal-example',
  grai: 'grai-retrospective-example',
  trust_equation: 'trust-equation-example',
  onion_model: 'onion-model-example',
  star_report: 'star-report-example',
  fossa_comm: 'fossa-communication-example',
  core_aq: 'core-aq-example',
}

/** 给定模板类型和 locale，返回 /docs/notes/... 示例页路径（无示例模板返回 null） */
export function exampleNotePathFor(ttype: TemplateType, locale: 'zh' | 'en'): string | null {
  const slug = EXAMPLE_SLUG_BY_TTYPE[ttype]
  if (!slug) return null
  return locale === 'en' ? `/docs/notes/en/${slug}` : `/docs/notes/${slug}`
}
