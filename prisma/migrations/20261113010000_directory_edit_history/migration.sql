CREATE TABLE IF NOT EXISTS "DirectoryRevision" (
    "id" BIGSERIAL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "DirectoryRevision_entityType_entityId_id_idx"
    ON "DirectoryRevision" ("entityType", "entityId", "id");

CREATE OR REPLACE FUNCTION liberture_directory_revision_v1() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    old_fields jsonb := to_jsonb(OLD) - ARRAY['updatedAt','createdAt','viewCount','id'];
    new_fields jsonb := to_jsonb(NEW) - ARRAY['updatedAt','createdAt','viewCount','id'];
    changed_fields jsonb;
BEGIN
    IF old_fields = new_fields THEN RETURN NULL; END IF;

    SELECT jsonb_object_agg(k, jsonb_build_object('before', old_fields->k, 'after', new_fields->k))
    INTO changed_fields FROM jsonb_object_keys(new_fields) AS fields(k)
    WHERE old_fields->k IS DISTINCT FROM new_fields->k;

    INSERT INTO "DirectoryRevision" ("entityType", "entityId", "source", "actor", "changes", "createdAt")
    VALUES (TG_ARGV[0], NEW.id,
            COALESCE(NULLIF(current_setting('liberture.edit_source', true), ''), 'system'),
            COALESCE(NULLIF(current_setting('liberture.edit_actor', true), ''), current_user),
            changed_fields, clock_timestamp());
    RETURN NULL;
END $$;

CREATE OR REPLACE TRIGGER liberture_directory_revision AFTER UPDATE ON "Person"
  FOR EACH ROW EXECUTE FUNCTION liberture_directory_revision_v1('people');
CREATE OR REPLACE TRIGGER liberture_directory_revision AFTER UPDATE ON "Book"
  FOR EACH ROW EXECUTE FUNCTION liberture_directory_revision_v1('books');
CREATE OR REPLACE TRIGGER liberture_directory_revision AFTER UPDATE ON "Protocol"
  FOR EACH ROW EXECUTE FUNCTION liberture_directory_revision_v1('protocols');
CREATE OR REPLACE TRIGGER liberture_directory_revision AFTER UPDATE ON "Organization"
  FOR EACH ROW EXECUTE FUNCTION liberture_directory_revision_v1('organizations');
CREATE OR REPLACE TRIGGER liberture_directory_revision AFTER UPDATE ON "KnowledgeArticle"
  FOR EACH ROW EXECUTE FUNCTION liberture_directory_revision_v1('articles');
