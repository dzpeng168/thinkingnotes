#!/usr/bin/env node
/**
 * 测试环境清库脚本
 *
 * 用法：
 *   node scripts/reset-db.mjs                 # 交互确认后清空业务数据
 *   node scripts/reset-db.mjs --yes           # 跳过确认（CI / 自动化）
 *   node scripts/reset-db.mjs --dry-run       # 只统计不删除
 *   node scripts/reset-db.mjs --with-users    # 连同所有 auth 用户一起删除（级联清业务表）
 *
 * 清理范围：
 *   1. storage.attachments  所有对象（遍历根目录下各用户文件夹）
 *   2. note_tags / notes / tags / categories（按外键顺序 delete）
 *   3. --with-users 时：auth.users（业务表 on delete cascade 会随之清空）
 *
 * 仅读取 .env.local / .env 中的 SUPABASE_SERVICE_ROLE_KEY（绕过 RLS），
 * 请确保只在测试项目上运行！
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BUCKET = 'attachments'
// 业务表（外键依赖顺序：先删引用方）。
// supabase-js 的 delete() 必须带过滤条件，这里用「列 ≠ 不可能存在的 uuid」匹配全部行。
const TABLES = [
  { name: 'note_tags', filterCol: 'note_id' }, // 复合主键，无 id 列
  { name: 'notes', filterCol: 'id' },
  { name: 'tags', filterCol: 'id' },
  { name: 'categories', filterCol: 'id' },
]
const NIL_UUID = '00000000-0000-0000-0000-000000000000'

const args = process.argv.slice(2)
const withUsers = args.includes('--with-users')
const dryRun = args.includes('--dry-run')
const assumeYes = args.includes('--yes')

// ---------- env 加载（零依赖，兼容 Next.js 的 .env.local 约定） ----------
function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const key = m[1]
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}
loadEnvFile(join(ROOT, '.env.local'))
loadEnvFile(join(ROOT, '.env'))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY（请检查 .env.local）')
  process.exit(1)
}
// service role key 校验：旧版 JWT 以 eyJ 开头，新版以 sb_secret_ 开头；sb_public_ 是 anon key
if (!/^(eyJ|sb_secret_)/.test(SERVICE_KEY)) {
  console.error('SUPABASE_SERVICE_ROLE_KEY 疑似 anon key，请使用 service role key（绕过 RLS 清库必需）')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------- 工具 ----------
async function countRows(table) {
  const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true })
  if (error) throw new Error(`统计 ${table} 失败: ${error.message}`)
  return count ?? 0
}

async function listAllUsers() {
  const users = []
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`列出用户失败: ${error.message}`)
    users.push(...data.users)
    if (users.length >= data.total) break
    page++
  }
  return users
}

/** 清空 attachments bucket：遍历根目录下的用户文件夹，逐前缀 list + remove */
async function clearStorage() {
  const client = admin.storage.from(BUCKET)
  const prefixes = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.list('', { limit: 1000, offset })
    if (error) throw new Error(`列出 storage 根目录失败: ${error.message}`)
    if (!data.length) break
    // 根目录下一级是 {user_id}/ 文件夹（id 为 null 的条目）；直接删除其下所有对象
    prefixes.push(...data.map((f) => f.name))
    if (data.length < 1000) break
  }

  let removed = 0
  for (const prefix of prefixes) {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await client.list(prefix, { limit: 1000, offset })
      if (error) throw new Error(`列出 ${prefix}/ 失败: ${error.message}`)
      if (!data.length) break
      const paths = data.map((f) => `${prefix}/${f.name}`)
      const { error: rmError } = await client.remove(paths)
      if (rmError) throw new Error(`删除 storage 对象失败: ${rmError.message}`)
      removed += paths.length
      if (data.length < 1000) break
    }
  }
  return removed
}

async function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close()
      resolve(/^y(es)?$/i.test(ans.trim()))
    }),
  )
}

// ---------- 主流程 ----------
async function main() {
  console.log(`目标库: ${SUPABASE_URL}`)
  if (dryRun) console.log('[dry-run] 仅统计，不执行删除\n')

  const counts = {}
  for (const { name } of TABLES) counts[name] = await countRows(name)
  const users = await listAllUsers()

  console.log('当前数据量：')
  for (const [table, n] of Object.entries(counts)) console.log(`  ${table.padEnd(12)} ${n} 行`)
  console.log(`  auth.users   ${users.length} 个`)
  console.log(`  storage      ${BUCKET} bucket（对象数删除时统计）`)

  if (dryRun) {
    console.log('\n[dry-run] 完成，未删除任何数据。')
    return
  }

  const scope = withUsers ? '业务数据 + Storage 对象 + 所有用户' : '业务数据 + Storage 对象（保留用户）'
  if (!assumeYes) {
    const ok = await confirm(`\n即将清空【${scope}】，此操作不可恢复！确认？(y/N) `)
    if (!ok) {
      console.log('已取消。')
      return
    }
  }

  // 1) Storage（用户删除后对象成孤儿，先清）
  const removed = await clearStorage()
  console.log(`storage: 已删除 ${removed} 个对象`)

  // 2) 业务表（按外键顺序）
  for (const { name, filterCol } of TABLES) {
    const { error } = await admin.from(name).delete().neq(filterCol, NIL_UUID)
    if (error) throw new Error(`清空 ${name} 失败: ${error.message}`)
    console.log(`${name}: 已清空（原 ${counts[name]} 行）`)
  }

  // 3) 用户（业务表 on delete cascade，但前面已手动清过）
  if (withUsers) {
    for (const u of users) {
      const { error } = await admin.auth.admin.deleteUser(u.id)
      if (error) throw new Error(`删除用户 ${u.email} 失败: ${error.message}`)
    }
    console.log(`auth.users: 已删除 ${users.length} 个用户`)
  }

  console.log('\n清库完成。')
}

main().catch((err) => {
  console.error(`\n执行失败: ${err.message}`)
  process.exit(1)
})
