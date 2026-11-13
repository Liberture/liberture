LOCK TABLE habit_users, nostr_sessions IN SHARE ROW EXCLUSIVE MODE;
CREATE OR REPLACE FUNCTION provision_tracker_identity(tracker_id integer) RETURNS void LANGUAGE plpgsql AS $$
DECLARE h habit_users%ROWTYPE; uid text := 'habit-' || tracker_id;
BEGIN
  SELECT * INTO STRICT h FROM habit_users WHERE id=tracker_id;
  INSERT INTO "AuthUser"(id,name,email,role,"createdAt","updatedAt")
  VALUES(uid,coalesce(nullif(btrim(h.data #>> '{profile,name}'),''),left(h.nostr_pubkey,12),'Tracker ' || tracker_id),
    uid || '@accounts.invalid',CASE WHEN EXISTS(SELECT 1 FROM tracker_bootstrap_admins WHERE pubkey=h.nostr_pubkey) THEN 'admin' ELSE 'user' END,
    coalesce(h.created_at,now()),now()) ON CONFLICT(id) DO NOTHING;
  INSERT INTO "AuthAccount"(id,"accountId","providerId","userId","updatedAt")
  VALUES(uid,coalesce(h.nostr_pubkey,uid),CASE WHEN h.nostr_pubkey IS NULL THEN 'tracker' ELSE 'nostr' END,uid,now())
  ON CONFLICT(id) DO UPDATE SET "accountId"=excluded."accountId","providerId"=excluded."providerId","updatedAt"=now()
  WHERE "AuthAccount"."accountId" IS DISTINCT FROM excluded."accountId";
END $$;
CREATE OR REPLACE FUNCTION sync_tracker_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN DELETE FROM "AuthUser" WHERE id='habit-' || OLD.id;
  ELSE PERFORM provision_tracker_identity(NEW.id); END IF;
  RETURN NULL;
END $$;
CREATE OR REPLACE TRIGGER sync_tracker_identity AFTER INSERT OR UPDATE OF nostr_pubkey OR DELETE ON habit_users
FOR EACH ROW EXECUTE FUNCTION sync_tracker_identity();
CREATE OR REPLACE FUNCTION delete_managed_tracker() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE tid integer; tbl text;
BEGIN
  IF OLD.id ~ '^habit-[0-9]+$' THEN
    tid := substring(OLD.id from 7)::integer;
    IF EXISTS (SELECT 1 FROM habit_users WHERE id=tid) THEN
      FOREACH tbl IN ARRAY ARRAY['habit_completions','habit_todos','habit_projects','habit_coach_messages','habit_push_subscriptions','habit_notifications_sent','habit_push_actions','habit_api_connections','habit_oauth_codes','habit_connector_syncs','habit_assistant_welcomes','habit_imports'] LOOP
        IF to_regclass(tbl) IS NOT NULL THEN EXECUTE format('DELETE FROM %I WHERE user_id=$1',tbl) USING tid; END IF;
      END LOOP;
      DELETE FROM habit_users WHERE id=tid;
    END IF;
  END IF;
  RETURN NULL;
END $$;
CREATE OR REPLACE TRIGGER delete_managed_tracker AFTER DELETE ON "AuthUser" FOR EACH ROW EXECUTE FUNCTION delete_managed_tracker();
