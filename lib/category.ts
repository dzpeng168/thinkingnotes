import type { Category, CategoryNode } from "./types"

/**
 * 把扁平的 Category[] 转成 CategoryNode[] 树形结构。
 * noteCount 是该分类（含所有后代）的笔记数累计，叶子节点为自身 noteCounts[id]，父节点为所有后代之和。
 */
export function buildCategoryTree(
  flat: Category[],
  noteCounts: Record<string, number>,
): CategoryNode[] {
  const map = new Map<string, CategoryNode>()
  for (const c of flat) {
    map.set(c.id, {
      ...c,
      children: [],
      noteCount: noteCounts[c.id] ?? 0,
    })
  }

  const roots: CategoryNode[] = []
  for (const c of flat) {
    const node = map.get(c.id)!
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // 累加后代笔记数到父节点
  const accumulate = (node: CategoryNode): number => {
    let sum = node.noteCount
    for (const child of node.children) {
      sum += accumulate(child)
    }
    // 写回累计值
    node.noteCount = sum
    return sum
  }
  for (const root of roots) {
    accumulate(root)
  }

  return roots
}

/**
 * 收集某分类的所有后代 id（含自身）
 */
export function collectDescendantIds(
  flat: Category[],
  rootId: string,
): string[] {
  const result: string[] = [rootId]
  const queue = [rootId]
  while (queue.length > 0) {
    const parentId = queue.shift()!
    for (const c of flat) {
      if (c.parent_id === parentId) {
        result.push(c.id)
        queue.push(c.id)
      }
    }
  }
  return result
}
