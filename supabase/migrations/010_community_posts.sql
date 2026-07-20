-- 010_community_posts.sql
-- Resident community feed: posts anyone in the society can create, like, and
-- comment on. Plus realtime for the feed and admin ticket triage.

-- Posts authored by any society member.
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- One like per member per post.
create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  post_id uuid not null references posts (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

-- Threaded comments on a post.
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  post_id uuid not null references posts (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_society on posts (society_id, created_at desc);
create index if not exists idx_post_likes_post on post_likes (post_id);
create index if not exists idx_post_comments_post on post_comments (post_id, created_at);

alter table posts enable row level security;
alter table post_likes enable row level security;
alter table post_comments enable row level security;

-- Posts: readable in-society; any member creates their own; author edits/deletes.
create policy posts_read on posts
  for select using (society_id = auth_society_id());
create policy posts_insert on posts
  for insert with check (society_id = auth_society_id() and author_id = auth.uid());
create policy posts_update on posts
  for update using (society_id = auth_society_id() and author_id = auth.uid());
create policy posts_delete on posts
  for delete using (society_id = auth_society_id() and author_id = auth.uid());

-- Likes: read in-society; a member toggles only their own like.
create policy post_likes_read on post_likes
  for select using (society_id = auth_society_id());
create policy post_likes_insert on post_likes
  for insert with check (society_id = auth_society_id() and profile_id = auth.uid());
create policy post_likes_delete on post_likes
  for delete using (society_id = auth_society_id() and profile_id = auth.uid());

-- Comments: read in-society; a member posts under their own id.
create policy post_comments_read on post_comments
  for select using (society_id = auth_society_id());
create policy post_comments_insert on post_comments
  for insert with check (society_id = auth_society_id() and author_id = auth.uid());

-- Realtime for the community feed + admin ticket triage.
alter table posts replica identity full;
alter table post_likes replica identity full;
alter table post_comments replica identity full;
alter table helpdesk_tickets replica identity full;

do $$
declare t text;
begin
  foreach t in array array['posts', 'post_likes', 'post_comments', 'helpdesk_tickets'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
