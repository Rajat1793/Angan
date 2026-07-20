-- 011_post_notifications.sql
-- Notify a post's author when another member likes or comments on their post.
-- Reuses app_notify (009) so the author gets a bell entry + push, and the
-- notifications realtime channel updates their unread badge live.

create or replace function notify_post_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  post_author uuid;
  liker_name text;
begin
  select author_id into post_author from posts where id = new.post_id;
  -- Skip if the post is gone or the author liked their own post.
  if post_author is null or post_author = new.profile_id then
    return new;
  end if;
  select full_name into liker_name from profiles where id = new.profile_id;
  perform app_notify(
    new.society_id, array[post_author],
    'New like',
    coalesce(liker_name, 'Someone') || ' liked your post.',
    jsonb_build_object('type', 'post_like', 'post_id', new.post_id)
  );
  return new;
end;
$$;

create or replace function notify_post_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  post_author uuid;
  commenter_name text;
begin
  select author_id into post_author from posts where id = new.post_id;
  -- Skip if the post is gone or the author commented on their own post.
  if post_author is null or post_author = new.author_id then
    return new;
  end if;
  select full_name into commenter_name from profiles where id = new.author_id;
  perform app_notify(
    new.society_id, array[post_author],
    'New comment',
    coalesce(commenter_name, 'Someone') || ' commented on your post.',
    jsonb_build_object('type', 'post_comment', 'post_id', new.post_id)
  );
  return new;
end;
$$;

create or replace trigger on_post_like
after insert on post_likes
for each row execute function notify_post_like();

create or replace trigger on_post_comment
after insert on post_comments
for each row execute function notify_post_comment();
