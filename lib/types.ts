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

export type TemplateType = 'free' | 'cornell' | 'meeting_5w2h' | 'six_hats' | 'eisenhower_matrix' | 'monthly_plan' | 'weekly_plan' | 'daily_plan' | 'woop' | 'ride' | 'prep_method' | 'four_d_work' | 'empathy_map' | 'smart_goal' | 'grai'
