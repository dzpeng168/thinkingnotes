import { readFile } from 'fs/promises'
import path from 'path'
import { DocsView } from './docs-view'

export const dynamic = 'force-dynamic'

async function loadDoc(): Promise<string> {
  const file = path.join(process.cwd(), 'public', 'docs', 'features.md')
  return readFile(file, 'utf-8')
}

export default async function FeaturesPage() {
  const content = await loadDoc()
  return <DocsView content={content} />
}
