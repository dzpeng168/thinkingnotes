# agent.md — ThinkingNotes 桌面版 → 纯 Web 版迁移指南

> 本文档面向 AI Agent / 开发者，描述如何将本仓库（Tauri 2 + Rust + SQLite + 本地 Markdown 文件）的思维笔记应用，转换为**纯 Web 工程**：**Next.js 14 (App Router) + TailwindCSS + Supabase (Postgres + Auth + Storage)**。
>
> 迁移原则：**前端 UI 层最大程度复用，后端 Rust 命令逐条翻译为 Route Handler，数据模型按原语义重建于 Postgres 并追加多用户隔离。**

---

## 1. 现有架构盘点（迁移基线）

### 1.1 技术栈现状

| 层 | 现状 | 迁移目标 |
|---|---|---|
| 前端框架 | Next.js 14.2.5 App Router + React 18 | 保持不变 |
| 样式 | TailwindCSS 3.4 + CSS 变量主题（`data-theme`） | 保持不变 |
| 编辑器 | Milkdown 7.x（主）+ WangEditor（备用） | 保持不变（纯 Web 技术） |
| 桌面壳 | Tauri 2 + Rust 后端 | **移除**，逻辑迁至 Route Handlers |
| 数据 | SQLite（索引）+ 本地 .md 文件（正文） | **Supabase Postgres（正文入库 `content` 列）** |
| 认证 | 无（单机单用户） | **Supabase Auth（新增，必须）** |
| 附件/图片 | base64 写本地文件（`write_file_base64`） | Supabase Storage bucket |
| 国际化 | 自研 `lib/i18n.tsx` + `messages/{zh,en}.json` | 保持不变 |
| 全局快捷键 | `@tauri-apps/plugin-global-shortcut` | Web `keydown`（页面级） |

### 1.2 目录结构（迁移涉及部分）

```
├── app/                     # Next.js App Router（保留）
│   ├── layout.tsx / page.tsx / note/page.tsx
│   ├── globals.css          # CSS 变量主题（保留）
│   └── template/            # 15 个模板 md + example/{en,}/ 各14条示例（保留，加载方式改变）
├── components/              # 全部保留，仅 3 处需改（见 §6）
│   ├── ui/                  # 13 个 shadcn 风格基础组件（零改动）
│   ├── editor/              # milkdown-editor / wang-editor（零改动）
│   ├── templates/           # markdown-template / template-renderer（零改动）
│   └── ...                  # app-rail / category-tree / command-palette 等
├── lib/
│   ├── api.ts               # 唯一 Tauri 依赖层（重写，接口签名不变）
│   ├── types.ts / i18n.tsx / utils.ts / category.ts / hotkeys.ts（保留）
├── messages/{zh,en}.json    # 保留
├── src-tauri/               # 整体删除（逻辑迁出）
│   └── src/{main,commands,db,models,settings}.rs
├── .smoke-test/smoke.mjs    # 改写为 Playwright 或删除
└── package.json             # 移除 @tauri-apps/* 与 tauri scripts
```

### 1.3 数据模型现状（SQLite，schema_version=1）

- `categories(id, name, parent_id→categories ON DELETE CASCADE, sort_order, created_at, updated_at)`
- `notes(id, title, template_type, file_path, category_id→categories ON DELETE SET NULL, created_at, updated_at, deleted_at)`
- `tags(id, name UNIQUE, color DEFAULT '#e67e48', created_at)`
- `note_tags(note_id→notes CASCADE, tag_id→tags CASCADE, PK(note_id,tag_id))`
- **正文不入库**：`Note.content` 仅在读写时临时承载，实际存于 `notes_dir/{category_dir}/{sanitized_title}_{YYYYMMDD_HHMMSS}.md`

### 1.4 Tauri 命令清单（28 个，见 `src-tauri/src/main.rs` invoke_handler）

笔记 11 个、分类 4 个、标签 4 个、回收站 3 个、系统/路径 6 个（`get_app_paths`、`get_settings`、`set_notes_dir`、`set_db_path`、`set_data_dir`、`reset_paths`）、工具 2 个（`seed_examples_on_first_launch`、`write_file_base64`）。

---

## 2. 目标架构

```
浏览器 ── Next.js 前端 (app/, components/, 原样复用)
   │  lib/api.ts（接口签名不变，invoke → fetch）
   ▼
Next.js Route Handlers (app/api/**) ── @supabase/ssr 会话 ──▶ Supabase Postgres (RLS 隔离)
   │                                                        Supabase Auth (email/password)
   └── 附件上传 ──────────────────────────────────────────▶ Supabase Storage (bucket: attachments)
```

### 2.1 关键技术决策（必须遵守）

1. **正文入库**：笔记正文存 `notes.content`（text），不再保留"文件系统 + 索引"双写模型。理由：Web 无本地文件系统；搜索可覆盖正文；消除路径/文件一致性逻辑（原 `sanitize_filename`、`build_file_path_with_time`、分类改名搬文件等全部作废）。`file_path` 列保留为 nullable，仅作旧数据导入元数据，新笔记写 NULL。
2. **API 边界不变**：前端仅通过 `lib/api.ts` 访问数据。重写其内部实现（`invoke` → `fetch`），`noteApi/categoryApi/tagApi/trashApi` 的方法签名与返回类型保持不变，**使所有 UI 组件零改动或近零改动**。`systemApi` 整体删除。
3. **多用户隔离**：所有业务表增加 `user_id`，启用 RLS，策略统一为 `auth.uid() = user_id`。原桌面版隐含"单用户"，Web 版必须显式化。
4. **认证必选**：Supabase Auth（email/password 起步）。未登录访问业务页重定向 `/login`。示例笔记种子从"首次启动"改为"**每用户首次登录**"。
5. **服务端复杂逻辑**：搜索、按分类含子分类查询、移动笔记、恢复/永久删除、种子数据等原 Rust 逻辑翻译到 Route Handler（Node runtime，用 service role key 或借会话）；纯 CRUD 也可由 supabase-js 直连，但为保证逻辑与 RLS 双保险，统一走 Route Handler。
6. **时间格式**：`created_at/updated_at/deleted_at` 由 SQLite TEXT(`%Y-%m-%d %H:%M:%S`) 改为 `timestamptz`，API 返回 ISO 8601 字符串，前端 `lib/types.ts` 仍为 `string`（展示层解析兼容）。

---

## 3. Supabase 数据库迁移

### 3.1 建表 SQL（`supabase/migrations/0001_init.sql`）

```sql
-- 分类：树形，删除分类时子分类级联删除、笔记归未分类（category_id 置 NULL）
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  parent_id uuid references public.categories(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 笔记：软删除（deleted_at 非空 = 回收站）
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '未命名',
  template_type text not null default 'free',
  content text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  file_path text  -- 仅导入旧数据时保留，新笔记为 NULL
);

-- 标签：name 从全局唯一改为 (user_id, name) 唯一
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#e67e48',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.note_tags (
  note_id uuid not null references public.notes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

-- 索引（对应原 SQLite 五个索引 + user_id）
create index idx_notes_user        on public.notes(user_id);
create index idx_notes_template    on public.notes(template_type);
create index idx_notes_updated     on public.notes(updated_at desc);
create index idx_notes_category    on public.notes(category_id);
create index idx_notes_deleted     on public.notes(deleted_at);
create index idx_categories_parent on public.categories(parent_id);
create index idx_categories_user   on public.categories(user_id);
create index idx_note_tags_tag     on public.note_tags(tag_id);
```

### 3.2 RLS 策略

```sql
alter table public.categories enable row level security;
alter table public.notes      enable row level security;
alter table public.tags       enable row level security;
alter table public.note_tags  enable row level security;

create policy "categories_owner" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes_owner" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tags_owner" on public.tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- note_tags 无 user_id，经 notes 归属判定
create policy "note_tags_owner" on public.note_tags
  for all using (
    exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid())
  );
```

### 3.3 与原 schema 的语义对照

| 原语义 | Web 版处理 |
|---|---|
| `file_path` 存储相对路径 | 改存 `content` 列；`file_path` 仅导入时保留 |
| 分类改名需同步物理目录名（`category_dir_name`） | 无文件系统，仅 UPDATE name，**删除搬移逻辑** |
| 移动笔记需移动 .md 文件 | 仅 UPDATE `notes.category_id` |
| 永久删除 = 删索引 + 删 .md 文件 | 仅 DELETE 行（note_tags 级联） |
| 标签 name 全局 UNIQUE | 改 `(user_id, name)` UNIQUE |
| 时间为本地时区 TEXT | `timestamptz` + `now()`，API 返回 ISO |
| ID 为 uuid v4 字符串 | `gen_random_uuid()`，类型一致 |

---

## 4. API 层迁移（Tauri 命令 → Route Handlers）

### 4.1 命令映射表

| Tauri 命令 | HTTP | 路径 | 说明 |
|---|---|---|---|
| `create_note` | POST | `/api/notes` | body: `{title, template_type, category_id?}`；空标题→`未命名`；按模板类型注入默认 markdown |
| `get_note` | GET | `/api/notes/:id` | 返回含 `content` |
| `get_notes` | GET | `/api/notes` | 列表（不含 content），每条带 `tags[]`，排除回收站 |
| `update_note` | PATCH | `/api/notes/:id` | `{title?, content?}`；同时刷新 `updated_at` |
| `rename_note` | PATCH | `/api/notes/:id` | 并入 update（`title` 字段），前端 `noteApi.rename` 调同一接口 |
| `delete_note` | DELETE | `/api/notes/:id` | **软删除**：仅置 `deleted_at = now()` |
| `search_notes` | GET | `/api/notes?search=kw` | `title ILIKE '%kw%' OR content ILIKE '%kw%'`（排除回收站）；进阶可换 Postgres FTS |
| `get_notes_by_tag` | GET | `/api/notes?tag=:tagId` | join note_tags |
| `get_notes_by_category` | GET | `/api/notes?category=:id&includeSub=true` | includeSub 时递归收集子分类（原 Rust 递归逻辑翻译为 JS 集合展开 + `in` 查询） |
| `move_note_to_category` | PATCH | `/api/notes/:id` | `{category_id: string\|null}`（并入 update，前端 `moveToCategory` 保留） |
| `create_category` | POST | `/api/categories` | `{name, parent_id?}` |
| `update_category` | PATCH | `/api/categories/:id` | `{name?, parent_id?, sort_order?}`；改名**不再搬移任何文件** |
| `delete_category` | DELETE | `/api/categories/:id` | 子分类级联、笔记归 NULL（FK 已保证） |
| `get_categories` | GET | `/api/categories` | |
| `create_tag` | POST | `/api/tags` | `{name, color='#e67e48'}`；同用户重名报错（409） |
| `get_tags` | GET | `/api/tags` | |
| `add_tag_to_note` | POST | `/api/notes/:id/tags` | body `{tag_id}` |
| `remove_tag_from_note` | DELETE | `/api/notes/:id/tags/:tagId` | |
| `get_trashed_notes` | GET | `/api/trash` | `deleted_at IS NOT NULL` |
| `restore_note` | POST | `/api/trash/:id/restore` | 置 `deleted_at = NULL` |
| `permanent_delete_note` | DELETE | `/api/trash/:id` | 物理 DELETE（note_tags 级联） |
| `seed_examples_on_first_launch` | POST | `/api/seed`（幂等） | 该用户 `notes` 表为空时写入 14 条示例；见 §5.2 |
| `get_app_paths` / `get_settings` / `set_notes_dir` / `set_db_path` / `set_data_dir` / `reset_paths` | — | — | **整体删除**（Web 无本地路径概念）；语言/主题/侧边栏宽度本就存 localStorage，无需后端 |
| `write_file_base64` | — | — | **删除**；导出改前端 Blob 下载，图片上传走 Storage |

### 4.2 实现要点

- Route Handler 统一放在 `app/api/**/route.ts`，Node runtime。
- 会话：使用 `@supabase/ssr`，从请求 cookie 取用户；`GET/PATCH/DELETE` 均以 `user_id` 过滤（`where user_id = session.user.id`），RLS 作为第二道防线；服务端可用 service role key 直查（绕过 RLS 但必须手动加 `user_id` 条件）。
- 错误约定：非 2xx 返回 `{ error: string }`；`lib/api.ts` 统一抛 `Error(message)`。
- **所有命令的精确业务语义以 `src-tauri/src/commands.rs` 为准逐条翻译**（该文件在删除前是唯一事实来源，翻译完成并验证后才可删除 `src-tauri/`）。

### 4.3 `lib/api.ts` 重写范式

```ts
// 接口签名与返回类型与原版完全一致，仅替换传输层
async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText)
  return res.json()
}

export const noteApi = {
  create: (title: string, templateType: string, categoryId?: string | null) =>
    call<Note>('/notes', { method: 'POST', body: JSON.stringify({ title, template_type: templateType, category_id: categoryId ?? null }) }),
  // get/list/update/delete/rename/search/byTag/byCategory/moveToCategory 同理映射
  // ...
}
// categoryApi / tagApi / trashApi 同理；systemApi 删除
```

---

## 5. 认证、种子数据与资源

### 5.1 Supabase Auth

- 新增 `app/login/page.tsx`（登录+注册，email/password）。
- 新增 `middleware.ts`：未携带会话的请求重定向 `/login`（静态资源与 `/api/auth` 除外）。
- `components/app-providers.tsx` 增加 Supabase Provider；业务页面在加载笔记前确保会话可用。

### 5.2 示例笔记种子（每用户一次）

- 触发时机：用户登录后前端首次调用 `GET /api/notes` 前，或登录回调里调用 `POST /api/seed`（幂等：`notes` 表中该用户无记录才写入）。
- 内容：`app/template/example/en/*.md` 共 14 条（默认英文）；分类名 `Examples`，标题前缀 `Example - `。
- 资源加载：模板 md 与示例 md 移至 `public/templates/`（保持 `T_*.md` 与 `example/{en}/` 结构），服务端 seed 时直接读 `public` 目录或构建期打包为常量；`create_note` 的模板默认内容同理由 API 侧读取（替代原 Rust `include_str!`）。

### 5.3 Storage（编辑器图片等附件）

- 创建 public bucket `attachments`，路径规则 `{user_id}/{note_id}/{uuid}.{ext}`。
- Milkdown 图片上传插件改为：选择文件 → `supabase.storage.from('attachments').upload()` → 插入返回的 public URL。
- 原 base64 内嵌图片策略废弃。

---

## 6. 前端逐文件处置清单

### 6.1 零改动（直接复用）

- `components/ui/*`（全部 13 个基础组件）
- `components/editor/milkdown-editor.tsx`、`wang-editor.tsx`（四种视图模式：预览/编辑/双栏/源码，纯 Web 实现）
- `components/templates/*`、`calendar-view.tsx`、`category-tree.tsx`、`command-palette.tsx`、`new-note-dialog.tsx`、`quick-switcher.tsx`、`tag-filter-dialog.tsx`、`theme-toggle.tsx`（仅首页显示，遵循原约束）、`app-rail.tsx`
- `lib/{types,i18n,utils,category}.tsx?`、`messages/{zh,en}.json`、`app/globals.css`、`app/layout.tsx`

### 6.2 需修改（全项目仅 3 处直接依赖 Tauri + 若干间接）

| 文件 | 改动 |
|---|---|
| `lib/api.ts` | 按 §4.3 重写（唯一数据通道） |
| `components/hotkeys-context.tsx` | 删除 `@tauri-apps/plugin-global-shortcut` 动态导入，改 `window.addEventListener('keydown')`（全局快捷键降级为页面级，`lib/hotkeys.ts` 键位定义不变） |
| `components/settings-dialog.tsx` | 删除 `@tauri-apps/plugin-dialog` 导入与"本地路径设置"整块 UI；改为账户信息 + 偏好（默认模板、语言）；文件选择类交互改 `<input type="file">` |
| `app/page.tsx` / `app/note/page.tsx` | 移除 `systemApi` 引用（若有）；列表加载前确保 seed 已触发 |
| `components/app-providers.tsx` | 挂载 Supabase 会话上下文 |
| `package.json` | 删 `@tauri-apps/*` 依赖与 `tauri*` scripts；加 `@supabase/supabase-js`、`@supabase/ssr` |
| `next.config.js` | 若含 `output: 'export'`（对应 `out/` 目录）必须移除——Route Handler 需要服务端运行时；部署用 `next start` / Vercel / standalone |

### 6.3 删除

- `src-tauri/` 整个目录（在 §4 逻辑翻译验证通过后）
- `.smoke-test/`（或改写为 Playwright 版放 `e2e/`）
- `scripts/` 中 Tauri 相关脚本、`src-tauri/tauri.conf.json`

---

## 7. 必须保留的业务规则（回归验收基准）

1. **软删除**：删除笔记仅置 `deleted_at`；回收站可恢复、可永久删除；列表/搜索/筛选默认排除回收站。
2. **分类删除**：子分类级联删除，其下笔记 `category_id` 置 NULL（归"未分类"）。
3. **空标题**：新建笔记允许空标题，默认 `未命名`。
4. **模板 15 种**：`free`（空白）+ cornell / meeting_5w2h / six_hats / eisenhower_matrix / monthly_plan / weekly_plan / daily_plan / woop / ride / prep_method / four_d_work / empathy_map / smart_goal / grai（`lib/types.ts` 的 `TemplateType` 为准）。
5. **种子数据**：每用户首次 14 条英文示例，分类 `Examples`，标题 `Example - {name}`，幂等不重复。
6. **默认语言 English**：`DEFAULT_LOCALE` 逻辑保持；偏好持久化于 `localStorage['thinkingnotes:locale']`。
7. **主题**：CSS 变量 + `<html data-theme>` 切换，持久化 localStorage；主题切换按钮仅存在于首页。
8. **侧边栏**：拖宽持久化 `localStorage['thinkingnotes:sidebar-width']`，min 200 / max 520 / default 256，双击拖柄重置。
9. **数据隔离**：RLS + API 双重过滤，用户 A 不可见用户 B 任何数据。
10. **Milkdown 四视图**：预览（默认只读）/ 编辑 / 双栏 / 源码；flex 布局链保持 `flex-1 + min-h-0`。

---

## 8. 实施步骤（建议顺序）

1. **新工程骨架**：新建（或在独立分支改造）Next.js 工程，迁移 `app/ components/ lib/ messages/ public 资源`；安装 `@supabase/supabase-js @supabase/ssr`；删除全部 `@tauri-apps/*`。
2. **Supabase 项目**：建项目 → 执行 §3 SQL（含 RLS）→ 建 `attachments` bucket → 配置 `.env.local`：
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=   # 仅服务端
   ```
3. **认证**：`/login` 页 + `middleware.ts` + Provider。
4. **模板资源化**：md 模板移 `public/templates/`，`create_note` 在 API 侧读取默认内容。
5. **API 层**：按 §4 映射表逐条实现 Route Handler（对照 `commands.rs` 翻译）；重写 `lib/api.ts`。
6. **桌面特性替换**：hotkeys 改 keydown、settings-dialog 改偏好、图片上传接 Storage。
7. **种子逻辑**：`POST /api/seed` + 登录后触发。
8. **清理**：删除 `src-tauri/`、`.smoke-test/`、tauri scripts、`next.config` 的 export 配置。
9. **验收**：按 §7 逐条回归 + §9 冒烟。

---

## 9. 验收冒烟清单

- [ ] 注册新用户 → 自动生成 14 条 `Example - *` 笔记（英文，分类 `Examples`），二次登录不重复
- [ ] 15 种模板新建笔记，模板默认内容正确注入
- [ ] 笔记 CRUD；空标题落库为 `未命名`；`updated_at` 随编辑刷新
- [ ] 软删除 → 回收站可见 → 恢复 / 永久删除
- [ ] 分类树增删改；删除父分类后子分类消失、笔记归未分类；移动笔记到分类
- [ ] 标签增删、笔记打标/去标、按标签筛选；同名标签（同用户）拒绝
- [ ] 搜索命中标题与正文；结果不含回收站
- [ ] 中英切换，默认英文，刷新保持
- [ ] 主题切换仅首页可操作，持久化
- [ ] 侧边栏拖宽/双击重置，持久化
- [ ] Milkdown 四视图模式正常；双栏布局不塌陷
- [ ] 编辑器图片上传至 Storage 并以 URL 渲染
- [ ] 两个账号数据完全隔离（RLS 验证：用 anon key 直查他表应 404/空）
- [ ] `npm run build` 通过；部署后 Route Handler 正常（无 `output: 'export'`）

---

## 10. 已知风险与注意事项

- **`commands.rs` 是业务逻辑唯一事实来源**：迁移期间保留该文件直至所有命令翻译并通过验收，切勿提前删除。
- **`out/` 静态导出产物**与 Route Handler 不兼容，部署模式必须为服务端运行时。
- **WangEditor 为备用编辑器**：若长期未用可在 Web 版中裁剪，但默认保留以降低回归面。
- **旧桌面数据导入**（可选增强）：SQLite → Postgres 导入脚本（读 `notes` 表 + 逐条读 .md 写入 `content`，`file_path` 保留原值），不在本次迁移必做范围。
- **Postgres 递归分类查询**：`includeSub` 用 JS 递归展开即可（分类量级小），无需 `WITH RECURSIVE`，避免过度设计。
