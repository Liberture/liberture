BEGIN;
SELECT set_config('liberture.edit_source', 'ai', true),
       set_config('liberture.edit_actor', 'project-directory-research', true);

-- The four existing slugs keep their IDs, editorial content and revision history.
UPDATE "Organization"
SET "directoryKind" = 'project', "updatedAt" = NOW(),
    "imageUrl" = CASE WHEN slug = 'lifespan-io' THEN '/images/organizations/lifespan-project.png' ELSE "imageUrl" END,
    founded = CASE WHEN slug = 'lifespan-io' THEN '2015' ELSE founded END
WHERE slug IN ('examine-com','foundmyfitness','quantified-self','lifespan-io')
  AND "directoryKind" <> 'project'
  AND NOT EXISTS (SELECT FROM "DirectoryRevision" r WHERE r."entityId" = "Organization".id AND r.actor = 'project-directory-research');

-- Seed only operators for projects present in this catalog. Preserve all existing profiles.
WITH entries(project_slug, slug, name, description, type, founded, website, logo) AS (VALUES
 ('examine-com','examine-com-inc','Examine.com Inc.','Examine.com Inc. is the Canadian company behind Examine’s nutrition and supplement research services. Its research team translates studies into evidence summaries. Its Examine Connect service also licenses curated data on supplement safety and interactions.','company',NULL,'https://connect.examine.com/terms','/images/organizations/examine.svg'),
 ('foundmyfitness','foundmyfitness-llc','FoundMyFitness, LLC','Rhonda Patrick established FoundMyFitness, LLC as the home for her science communication work. The company publishes interviews and research explainers through FoundMyFitness. Patrick also lists the company as her affiliation in her published review of sauna research.','company','2014','https://www.foundmyfitness.com/about-dr-rhonda-patrick','/images/organizations/foundmyfitness.png'),
 ('quantified-self','article-27-foundation','Article 27 Foundation','Article 27 supports people who investigate questions about their own lives using personal data. Its name refers to the right to participate in science. The foundation funds work in the Quantified Self community and supports education, advocacy and open tools for self-research.','nonprofit',NULL,'https://quantifiedself.com/about/article27/',NULL),
 ('lifespan-io','lifespan-research-institute','Lifespan Research Institute','Lifespan Research Institute formed in 2024 when SENS Research Foundation and the Lifespan Extension Advocacy Foundation merged. It combines research into age-related disease with public education, fundraising and science journalism. Readers can follow its reporting on Lifespan.io and consult its annual reports for the work of the institute and its predecessors.','nonprofit','2024','https://lifespan.io/about-us/','/images/organizations/lifespan-research-institute.png'),
 ('lifespan-io','lifespan-extension-advocacy-foundation','Lifespan Extension Advocacy Foundation','The Lifespan Extension Advocacy Foundation (LEAF) was the nonprofit that launched Lifespan.io in 2015. It used crowdfunding, reporting and public events to connect researchers studying aging with people interested in supporting their work. In 2024 it merged with SENS Research Foundation to form the Lifespan Research Institute.','nonprofit','2014','https://lifespan.io/about-us/annual-reports/',NULL)
), created AS (
 INSERT INTO "Organization"(id,slug,name,description,pillars,type,founded,website,"imageUrl","updatedAt")
 SELECT gen_random_uuid()::text, e.slug,e.name,e.description,p.pillars,e.type,e.founded,e.website,e.logo,NOW()
 FROM entries e JOIN "Organization" p ON p.slug=e.project_slug AND p."directoryKind"='project'
 ON CONFLICT (slug) DO NOTHING RETURNING *
)
INSERT INTO "DirectoryRevision" ("entityType","entityId",source,actor,changes)
 SELECT 'organizations',id,'ai','project-directory-research',jsonb_build_object('profile',jsonb_build_object('before',NULL,'after',to_jsonb(created)-'id'-'createdAt'-'updatedAt')) FROM created;

WITH entries(project_slug, slug, name, title, bio, expertise, website, photo) AS (VALUES
 ('examine-com','sol-orwell','Sol Orwell','Entrepreneur and Examine co-founder','Sol Orwell helped launch Examine in 2011 after questions about nutrition and fitness led him to compare supplement claims with the research behind them. He describes the project’s origins in an interview with IdeaMensch. As a director of Examine.com Inc., he is also named in the company’s licensing terms for its research data.','Nutrition publishing, Entrepreneurship','https://ideamensch.com/sol-orwell/','/images/people/sol-orwell.jpg'),
 ('examine-com','kamal-patel','Kamal Patel','Nutrition researcher and Examine co-founder','Kamal Patel helped build Examine’s research operation and has served as its director. In an interview on The Unconventional RD, he describes how the team developed its supplement references, reviewed studies and built a subscriber-supported publication for readers and nutrition professionals.','Nutrition research, Evidence appraisal','https://www.theunconventionalrd.com/episode048/','/images/people/kamal-patel.jpg'),
 ('quantified-self','gary-wolf','Gary Wolf','Science journalist and Quantified Self co-founder','Gary Wolf reported on technology for Wired before starting Quantified Self with Kevin Kelly in 2007. He helped organize meetings where participants described what they had learned from tracking their own lives. He also directs the Article 27 Foundation, which supports participation in science and the development of tools for personal research.','Personal science, Science journalism','https://quantifiedself.com/gary-wolf-bio/','/images/people/gary-wolf.jpg'),
 ('quantified-self','kevin-kelly','Kevin Kelly','Writer and Quantified Self co-founder','Kevin Kelly helped launch Wired and served as its founding executive editor. His books include Out of Control and The Inevitable, and his Cool Tools project collects practical reviews. In 2007 he co-founded Quantified Self with Gary Wolf, helping bring together people interested in what they could learn from their own measurements.','Technology writing, Personal science','https://kk.org/biography/','/images/people/kevin-kelly.jpg'),
 ('lifespan-io','keith-comito','Keith Comito','Programmer and longevity research advocate','Keith Comito is a programmer and mathematician who helped establish the Lifespan Extension Advocacy Foundation in 2014. He worked on systems for streaming media and helped develop public crowdfunding and outreach for research into aging. The Lifespan Research Institute lists him on its leadership team.','Research advocacy, Software development','https://lifespan.io/about-us/team/','/images/people/keith-comito.webp'),
 ('lifespan-io','oliver-medvedik','Oliver Medvedik','Biomedical educator and longevity research advocate','Oliver Medvedik teaches biology and bioengineering at The Cooper Union. His work spans biomedical engineering education and public access to research. He co-founded the Lifespan Extension Advocacy Foundation and discussed research papers in Lifespan.io’s Journal Club. He also serves on the board of the Lifespan Research Institute.','Biomedical engineering, Biology education','https://engfac.cooper.edu/medvedik','/images/people/oliver-medvedik.webp'),
 ('lifespan-io','apneet-jolly','Apneet Jolly','Lifespan Extension Advocacy Foundation co-founder','Apneet Jolly was one of the four founders of the Lifespan Extension Advocacy Foundation in 2014. The foundation launched the Lifespan.io crowdfunding platform the following year. Its 2019 annual report lists Jolly on the industry advisory board and records an affiliation with Cryptolotus.','Research advocacy, Industry advisory work','https://lifespan.io/wp-content/uploads/2025/06/Lifespan.io-Annual-Report-2019.pdf','/images/people/apneet-jolly.jpg'),
 ('lifespan-io','richard-kaufman','Richard Kaufman','Lifespan Extension Advocacy Foundation co-founder','Richard Kaufman helped establish the Lifespan Extension Advocacy Foundation in 2014. The foundation developed Lifespan.io to support public participation in funding research on aging. Its 2020 annual report identifies Kaufman as a board member and treasurer.','Nonprofit governance, Research advocacy','https://www.lifespan.io/wp-content/uploads/2025/06/Lifespan-Annual-Report-2020.pdf','/images/people/richard-kaufman.jpg'),
 ('foundmyfitness','rhonda-patrick','Rhonda Patrick','Scientist and FoundMyFitness founder','Rhonda Patrick founded FoundMyFitness to explain research on nutrition, aging and disease prevention. She studied mitochondrial metabolism during her doctoral work and later investigated micronutrients. She interviews researchers, explores the methods behind their findings and publishes essays and recorded conversations through FoundMyFitness.','Nutrition research, Science communication','https://www.foundmyfitness.com/about-dr-rhonda-patrick','/examples/portraits/rhonda-patrick-portrait.jpg')
), created AS (
 INSERT INTO "Person"(id,slug,name,title,bio,pillars,expertise,website,"imageUrl","updatedAt")
 SELECT gen_random_uuid()::text,e.slug,e.name,e.title,e.bio,p.pillars,e.expertise,e.website,e.photo,NOW()
 FROM entries e JOIN "Organization" p ON p.slug=e.project_slug AND p."directoryKind"='project'
 WHERE NOT EXISTS (SELECT FROM "Person" existing WHERE lower(trim(existing.name))=lower(trim(e.name)))
 ON CONFLICT (slug) DO NOTHING RETURNING *
)
INSERT INTO "DirectoryRevision" ("entityType","entityId",source,actor,changes)
 SELECT 'people',id,'ai','project-directory-research',jsonb_build_object('profile',jsonb_build_object('before',NULL,'after',to_jsonb(created)-'id'-'createdAt'-'updatedAt')) FROM created;

WITH links(project, org, role, source) AS (VALUES
 ('examine-com','examine-com-inc','Publisher','https://connect.examine.com/terms'),
 ('foundmyfitness','foundmyfitness-llc','Publisher','https://doi.org/10.1016/j.exger.2021.111509'),
 ('quantified-self','article-27-foundation','Funding organization','https://quantifiedself.com/about/what-is-quantified-self/'),
 ('lifespan-io','lifespan-research-institute','Current operator','https://lifespan.io/get-involved/'),
 ('lifespan-io','lifespan-extension-advocacy-foundation','Founding organization (historical)','https://lifespan.io/wp-content/uploads/2025/08/EARD2019_Program.pdf')
)
INSERT INTO "ProjectOrganization" ("projectId","organizationId",role,"sourceUrl")
SELECT p.id,o.id,l.role,l.source FROM links l JOIN "Organization" p ON p.slug=l.project AND p."directoryKind"='project'
 JOIN "Organization" o ON o.slug=l.org AND o."directoryKind"='organization' ON CONFLICT DO NOTHING;

WITH links(profile,person,role,source) AS (VALUES
 ('examine-com','Sol Orwell','Co-founder','https://ideamensch.com/sol-orwell/'),
 ('examine-com','Kamal Patel','Co-founder','https://www.theunconventionalrd.com/episode048/'),
 ('examine-com-inc','Sol Orwell','Director','https://connect.examine.com/terms'),
 ('examine-com-inc','Kamal Patel','Co-founder and research director','https://www.theunconventionalrd.com/episode048/'),
 ('foundmyfitness','Rhonda Patrick','Founder and podcast host','https://www.foundmyfitness.com/about-dr-rhonda-patrick'),
 ('foundmyfitness-llc','Rhonda Patrick','Co-founder','https://doi.org/10.1016/j.exger.2021.111509'),
 ('quantified-self','Gary Wolf','Co-founder','https://quantifiedself.com/blog/what-is-the-quantified-self/'),
 ('quantified-self','Kevin Kelly','Co-founder','https://quantifiedself.com/blog/what-is-the-quantified-self/'),
 ('article-27-foundation','Gary Wolf','Director','https://quantifiedself.com/gary-wolf-bio/'),
 ('lifespan-io','Keith Comito','Co-founder of the founding foundation','https://lifespan.io/about-us/'),
 ('lifespan-io','Oliver Medvedik','Journal Club host','https://lifespan.io/wp-content/uploads/2025/08/EARD2019_Program.pdf'),
 ('lifespan-io','Richard Kaufman','Treasurer of the founding foundation (2020)','https://www.lifespan.io/wp-content/uploads/2025/06/Lifespan-Annual-Report-2020.pdf'),
 ('lifespan-io','Apneet Jolly','Industry advisory board member (2019)','https://lifespan.io/wp-content/uploads/2025/06/Lifespan.io-Annual-Report-2019.pdf'),
 ('lifespan-research-institute','Keith Comito','Chief executive officer','https://lifespan.io/about-us/team/'),
 ('lifespan-research-institute','Oliver Medvedik','Board member','https://lifespan.io/about-us/board-of-directors/'),
 ('lifespan-extension-advocacy-foundation','Keith Comito','Co-founder','https://lifespan.io/about-us/'),
 ('lifespan-extension-advocacy-foundation','Oliver Medvedik','Co-founder','https://lifespan.io/about-us/'),
 ('lifespan-extension-advocacy-foundation','Apneet Jolly','Co-founder','https://lifespan.io/about-us/'),
 ('lifespan-extension-advocacy-foundation','Richard Kaufman','Co-founder','https://lifespan.io/about-us/')
)
INSERT INTO "ProfilePerson" ("profileId","personId",role,"sourceUrl")
SELECT org.id,p.id,l.role,l.source FROM links l JOIN "Organization" org ON org.slug=l.profile
 JOIN "Person" p ON lower(trim(p.name))=lower(trim(l.person)) ON CONFLICT DO NOTHING;

COMMIT;
