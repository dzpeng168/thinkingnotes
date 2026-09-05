import { readFile } from 'fs/promises'
import path from 'path'

/**
 * 模板默认 markdown：从 public/templates/ 读取（替代桌面版 Rust include_str!）。
 * 与原版一致：根目录为中文模板；free 为空白。
 */
const TEMPLATE_FILES: Record<string, string | undefined> = {
  free: undefined,
  cornell: 'T_CORNELL.md',
  meeting_5w2h: 'T_5W2H.md',
  six_hats: 'T_SIX_HATS.md',
  eisenhower_matrix: 'T_EISENHOWER.md',
  monthly_plan: 'T_MONTHLY_PLAN.md',
  weekly_plan: 'T_WEEKLY_PLAN.md',
  daily_plan: 'T_DAYLY_PLAN.md',
  woop: 'T_WOOP.md',
  ride: 'T_RIDE.md',
  prep_method: 'T_PREP_METHOD.md',
  four_d_work: 'T_4D_WORK.md',
  empathy_map: 'T_EMPATHY_MAP.md',
  smart_goal: 'T_SMART_GOAL.md',
  grai: 'T_GRAI.md',
}

export function isTemplateType(s: string): boolean {
  return Object.prototype.hasOwnProperty.call(TEMPLATE_FILES, s)
}

const cache = new Map<string, string>()

export async function defaultMarkdownFor(templateType: string): Promise<string> {
  if (templateType === 'free') return ''
  const file = TEMPLATE_FILES[templateType]
  if (!file) return ''
  const hit = cache.get(file)
  if (hit !== undefined) return hit
  const content = await readFile(
    path.join(process.cwd(), 'public', 'templates', file),
    'utf-8',
  )
  cache.set(file, content)
  return content
}
