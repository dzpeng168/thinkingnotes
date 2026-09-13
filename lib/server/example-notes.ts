import { readFile } from 'fs/promises'
import path from 'path'
import { TEMPLATE_META } from '@/lib/template-meta'
import enMessages from '@/messages/en.json'

/**
 * 示例笔记注册表（服务端专用）。
 * 供 /docs/notes/[slug] SSR 页面与 sitemap.xml 共享：
 * - slug 对应 public/templates/example/ 下的文件名（去 .md）
 * - ttype 对应 lib/utils.ts 的 TEMPLATE_META key（中文文案）
 * - enKey 对应 messages/en.json note 段的文案 key（英文文案）
 */
export interface ExampleNote {
  slug: string
  ttype: string
  enKey: string
}

export const EXAMPLE_NOTES: ExampleNote[] = [
  { slug: 'cornell-notes-example', ttype: 'cornell', enKey: 'cornell' },
  { slug: 'eisenhower-matrix-example', ttype: 'eisenhower_matrix', enKey: 'eisenhowerMatrix' },
  { slug: '4d-work-example', ttype: 'four_d_work', enKey: 'fourDWork' },
  { slug: 'daily-plan-example', ttype: 'daily_plan', enKey: 'dailyPlan' },
  { slug: 'weekly-plan-example', ttype: 'weekly_plan', enKey: 'weeklyPlan' },
  { slug: 'monthly-plan-example', ttype: 'monthly_plan', enKey: 'monthlyPlan' },
  { slug: '5w2h-example', ttype: 'meeting_5w2h', enKey: 'meeting5w2h' },
  { slug: 'prep-method-example', ttype: 'prep_method', enKey: 'prepMethod' },
  { slug: 'ride-persuasion-example', ttype: 'ride', enKey: 'ride' },
  { slug: 'smart-goal-example', ttype: 'smart_goal', enKey: 'smartGoal' },
  { slug: 'woop-thinking-example', ttype: 'woop', enKey: 'woop' },
  { slug: 'grai-retrospective-example', ttype: 'grai', enKey: 'grai' },
  { slug: 'six-thinking-hats-example', ttype: 'six_hats', enKey: 'sixHats' },
  { slug: 'empathy-map-example', ttype: 'empathy_map', enKey: 'empathyMap' },
]

export function findExampleNote(slug: string): ExampleNote | undefined {
  return EXAMPLE_NOTES.find((n) => n.slug === slug)
}

/** 示例笔记的访问路径（中文默认版 / 英文版） */
export function exampleNotePath(slug: string, locale: 'zh' | 'en'): string {
  return locale === 'en' ? `/docs/notes/en/${slug}` : `/docs/notes/${slug}`
}

/** 模板名/描述：zh 取 TEMPLATE_META，en 取 en.json */
export function exampleNoteMeta(note: ExampleNote, locale: 'zh' | 'en'): { name: string; desc: string } {
  if (locale === 'en') {
    const noteEn = enMessages.note as Record<string, string>
    return {
      name: noteEn[note.enKey] ?? note.enKey,
      desc: noteEn[`${note.enKey}Desc`] ?? '',
    }
  }
  const base = TEMPLATE_META[note.ttype]
  return { name: base?.name ?? note.ttype, desc: base?.desc ?? '' }
}

/** 读取示例笔记 markdown；文件缺失返回 null（调用方 notFound()） */
export async function readExampleMd(slug: string, locale: 'zh' | 'en'): Promise<string | null> {
  const note = findExampleNote(slug)
  if (!note) return null
  const file = locale === 'en' ? path.join('en', `${slug}.md`) : `${slug}.md`
  try {
    return await readFile(path.join(process.cwd(), 'public', 'templates', 'example', file), 'utf-8')
  } catch {
    return null
  }
}
