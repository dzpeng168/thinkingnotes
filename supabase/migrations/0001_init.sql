-- ThinkingNotes Web 初始化迁移
-- 对应原桌面版 SQLite schema（schema_version=1），语义重建于 Postgres：
-- 1) 正文入库：notes.content 承载 markdown，file_path 仅旧数据导入元数据（新笔记为 NULL）
-- 2) 多用户隔离：所有业务表带 user_id + RLS
-- 3) 时间：timestamptz + now()

-- ==================== 建表 ====================

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
  file_path text  -- 仅导入旧桌面数据时保留，新笔记为 NULL
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

-- ==================== 索引（对应原 SQLite 索引 + user_id） ====================

create index idx_notes_user        on public.notes(user_id);
create index idx_notes_template    on public.notes(template_type);
create index idx_notes_updated     on public.notes(updated_at desc);
create index idx_notes_category    on public.notes(category_id);
create index idx_notes_deleted     on public.notes(deleted_at);
create index idx_categories_parent on public.categories(parent_id);
create index idx_categories_user   on public.categories(user_id);
create index idx_note_tags_tag     on public.note_tags(tag_id);

-- ==================== RLS ====================

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

-- ==================== Storage：附件 bucket ====================

-- 公开只读 bucket，上传经服务端 service role 完成（路径规则 {user_id}/{uuid}.{ext}）
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- 已登录用户可读
create policy "attachments_public_read" on storage.objects
  for select using (bucket_id = 'attachments');
