BEGIN;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "directoryKind" TEXT NOT NULL DEFAULT 'organization';
ALTER TABLE "Organization" DROP CONSTRAINT IF EXISTS organization_directory_kind;
ALTER TABLE "Organization" ADD CONSTRAINT organization_directory_kind CHECK ("directoryKind" IN ('organization','project'));
CREATE INDEX IF NOT EXISTS "Organization_directoryKind_name_idx" ON "Organization" ("directoryKind",name);
CREATE TABLE IF NOT EXISTS "ProjectOrganization" (
  "projectId" TEXT NOT NULL REFERENCES "Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE,
  role TEXT NOT NULL, "sourceUrl" TEXT NOT NULL,
  PRIMARY KEY ("projectId","organizationId",role)
);
CREATE INDEX IF NOT EXISTS "ProjectOrganization_organizationId_idx" ON "ProjectOrganization" ("organizationId");

CREATE OR REPLACE FUNCTION liberture_validate_project_link() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM id FROM "Organization" WHERE id IN (NEW."projectId", NEW."organizationId") ORDER BY id FOR SHARE;
  IF NOT EXISTS (SELECT FROM "Organization" WHERE id=NEW."projectId" AND "directoryKind"='project')
     OR NOT EXISTS (SELECT FROM "Organization" WHERE id=NEW."organizationId" AND "directoryKind"='organization')
     OR trim(NEW.role)='' OR NEW."sourceUrl" !~* '^https?://[^/[:space:]]+'
  THEN RAISE EXCEPTION 'Invalid project relationship' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE TRIGGER liberture_validate_project_link BEFORE INSERT OR UPDATE ON "ProjectOrganization"
  FOR EACH ROW EXECUTE FUNCTION liberture_validate_project_link();

CREATE OR REPLACE FUNCTION liberture_validate_directory_kind() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT FROM "ProjectOrganization" WHERE "projectId"=NEW.id OR "organizationId"=NEW.id)
  THEN RAISE EXCEPTION 'Remove existing relationships before changing profile kind' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE TRIGGER liberture_validate_directory_kind BEFORE UPDATE OF "directoryKind" ON "Organization"
  FOR EACH ROW WHEN (OLD."directoryKind" IS DISTINCT FROM NEW."directoryKind") EXECUTE FUNCTION liberture_validate_directory_kind();

CREATE OR REPLACE FUNCTION liberture_project_link_revision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  previous jsonb;
  current_link jsonb;
BEGIN
  IF TG_OP <> 'INSERT' THEN previous := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN current_link := to_jsonb(NEW); END IF;
  IF previous IS NOT DISTINCT FROM current_link THEN RETURN NULL; END IF;
  INSERT INTO "DirectoryRevision" ("entityType","entityId",source,actor,changes,"createdAt")
  SELECT kind, id,
    COALESCE(NULLIF(current_setting('liberture.edit_source',true),''),'system'),
    COALESCE(NULLIF(current_setting('liberture.edit_actor',true),''),current_user),
    jsonb_build_object('relationship',jsonb_build_object(
      'before',CASE WHEN id IN (previous->>'projectId', previous->>'organizationId') THEN previous END,
      'after',CASE WHEN id IN (current_link->>'projectId', current_link->>'organizationId') THEN current_link END)),
    clock_timestamp()
  FROM (VALUES ('projects',previous->>'projectId'),('projects',current_link->>'projectId'),
               ('organizations',previous->>'organizationId'),('organizations',current_link->>'organizationId')) v(kind,id)
  WHERE id IS NOT NULL GROUP BY kind,id;
  RETURN NULL;
END $$;
CREATE OR REPLACE TRIGGER liberture_project_link_revision AFTER INSERT OR UPDATE OR DELETE ON "ProjectOrganization"
  FOR EACH ROW EXECUTE FUNCTION liberture_project_link_revision();

CREATE TABLE IF NOT EXISTS "ProfilePerson" (
  "profileId" TEXT NOT NULL REFERENCES "Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "personId" TEXT NOT NULL REFERENCES "Person"(id) ON UPDATE CASCADE ON DELETE CASCADE,
  role TEXT NOT NULL, "sourceUrl" TEXT NOT NULL,
  PRIMARY KEY ("profileId","personId",role)
);
CREATE INDEX IF NOT EXISTS "ProfilePerson_personId_idx" ON "ProfilePerson" ("personId");
ALTER TABLE "ProfilePerson" DROP CONSTRAINT IF EXISTS profile_person_valid_evidence;
ALTER TABLE "ProfilePerson" ADD CONSTRAINT profile_person_valid_evidence CHECK (trim(role)<>'' AND "sourceUrl" ~* '^https?://[^/[:space:]]+');

CREATE OR REPLACE FUNCTION liberture_profile_person_revision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  previous jsonb;
  current_link jsonb;
BEGIN
  IF TG_OP <> 'INSERT' THEN previous := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN current_link := to_jsonb(NEW); END IF;
  IF previous IS NOT DISTINCT FROM current_link THEN RETURN NULL; END IF;
  INSERT INTO "DirectoryRevision" ("entityType","entityId",source,actor,changes,"createdAt")
  SELECT kind,id,
    COALESCE(NULLIF(current_setting('liberture.edit_source',true),''),'system'),
    COALESCE(NULLIF(current_setting('liberture.edit_actor',true),''),current_user),
    jsonb_build_object('relationship',jsonb_build_object(
      'before',CASE WHEN id IN (previous->>'personId',previous->>'profileId') THEN previous END,
      'after',CASE WHEN id IN (current_link->>'personId',current_link->>'profileId') THEN current_link END)),
    clock_timestamp()
  FROM (
    SELECT 'people' AS kind, personid AS id FROM (VALUES(previous->>'personId'),(current_link->>'personId')) p(personid)
    UNION SELECT CASE WHEN "directoryKind"='project' THEN 'projects' ELSE 'organizations' END,id
    FROM "Organization" WHERE id IN (previous->>'profileId',current_link->>'profileId')
  ) affected
  WHERE id IS NOT NULL GROUP BY kind,id;
  RETURN NULL;
END $$;
CREATE OR REPLACE TRIGGER liberture_profile_person_revision AFTER INSERT OR UPDATE OR DELETE ON "ProfilePerson"
  FOR EACH ROW EXECUTE FUNCTION liberture_profile_person_revision();
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
    VALUES (CASE WHEN TG_ARGV[0]='organizations' AND to_jsonb(NEW)->>'directoryKind'='project' THEN 'projects' ELSE TG_ARGV[0] END, NEW.id,
            COALESCE(NULLIF(current_setting('liberture.edit_source', true), ''), 'system'),
            COALESCE(NULLIF(current_setting('liberture.edit_actor', true), ''), current_user),
            changed_fields, clock_timestamp());
    RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION liberture_profile_lifecycle_revision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  snapshot jsonb;
  fields jsonb;
BEGIN
  IF TG_OP='INSERT' THEN snapshot := to_jsonb(NEW); ELSE snapshot := to_jsonb(OLD); END IF;
  SELECT jsonb_object_agg(key,jsonb_build_object(
    'before',CASE WHEN TG_OP='DELETE' THEN value END,
    'after',CASE WHEN TG_OP='INSERT' THEN value END)) INTO fields
  FROM jsonb_each(snapshot - ARRAY['id','createdAt','updatedAt']) WHERE value <> 'null'::jsonb;
  INSERT INTO "DirectoryRevision" ("entityType","entityId",source,actor,changes,"createdAt")
  VALUES (CASE WHEN snapshot->>'directoryKind'='project' THEN 'projects' ELSE 'organizations' END,
    snapshot->>'id',COALESCE(NULLIF(current_setting('liberture.edit_source',true),''),'system'),
    COALESCE(NULLIF(current_setting('liberture.edit_actor',true),''),current_user),
    fields,clock_timestamp());
  RETURN NULL;
END $$;
CREATE OR REPLACE TRIGGER liberture_profile_lifecycle_revision AFTER INSERT OR DELETE ON "Organization"
  FOR EACH ROW EXECUTE FUNCTION liberture_profile_lifecycle_revision();
COMMIT;
