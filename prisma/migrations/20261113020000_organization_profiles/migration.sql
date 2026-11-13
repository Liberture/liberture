BEGIN;

-- Keep editorial updates in the same revision history as admin edits.
SELECT set_config('liberture.edit_source', 'ai', true),
       set_config('liberture.edit_actor', 'organization-profile-research', true);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = '"Organization"'::regclass AND tgname = 'liberture_directory_revision'
      AND tgenabled IN ('O', 'A')
  ) THEN RAISE EXCEPTION 'Install directory edit history before applying organization profiles';
  END IF;
END $$;

WITH profiles(slug, description, founded, logo, people, resources, publications) AS (
  VALUES
  ('examine-com', $text$Examine began in 2011 with a question familiar to anyone shopping for a supplement. What evidence supports the claim on the label? Sol Orwell helped start the project after trying to make sense of conflicting nutrition advice. Its research team now covers foods, nutrients and supplements across a range of health conditions.

Its reference pages organize research by outcome. Readers can look up a supplement, see what researchers actually measured and follow the evidence back to individual studies. Examine also publishes study summaries for readers who want to see how new findings fit into that larger picture.$text$, '2011', 'examine.svg',
   '["Sol Orwell","Kamal Patel"]',
   '[{"title":"About Examine and its team","url":"https://examine.com/about/"},{"title":"Kamal Patel on the founding of Examine","url":"https://www.theunconventionalrd.com/episode048/"}]',
   '[{"title":"Examine Study Summaries","url":"https://examine.com/research-feed/"}]'),
  ('foundmyfitness', $text$Biomedical scientist Rhonda Patrick founded FoundMyFitness to bring research on nutrition, exercise and aging to a wider audience. The science podcast began in 2012. Patrick draws on her graduate work on mitochondrial metabolism and her subsequent work on micronutrients to frame questions for the researchers she interviews.

The episode archive pairs long interviews with shorter explanations of individual findings. A reader curious about a subject such as heat exposure can start with the topic library, then follow an interview into the methods behind a study. The project also publishes recorded audience questions and answers.$text$, '2012', 'foundmyfitness.png',
   '["Rhonda Patrick"]',
   '[{"title":"About Rhonda Patrick","url":"https://www.foundmyfitness.com/about-dr-rhonda-patrick"},{"title":"FoundMyFitness topic library","url":"https://www.foundmyfitness.com/topics"},{"title":"Rhonda Patrick on The Drive","url":"https://peterattiamd.com/rhondapatrick2/"}]',
   '[{"title":"FoundMyFitness episode archive","url":"https://www.foundmyfitness.com/episodes/archive"}]'),
  ('quantified-self', $text$Writers Gary Wolf and Kevin Kelly founded Quantified Self in 2007 to bring together people who were collecting data about their own lives. Early meetings gave participants a place to share a personal question and demonstrate what they had learned by measuring it. Sleep diaries, handwritten observations and wearable sensors all fit that approach.

The community’s Show & Tell archive preserves these first-person accounts. A talk typically covers what the participant did, how they did it and what they learned. The archive is useful for seeing the practical details of a self-tracking project, including which measurements a person could sustain and where the data fell short.$text$, '2007', 'quantified-self.png',
   '["Gary Wolf","Kevin Kelly"]',
   '[{"title":"Gary Wolf on the origins of Quantified Self","url":"https://quantifiedself.com/blog/what-is-the-quantified-self/"},{"title":"Show & Tell project archive","url":"https://quantifiedself.com/show-and-tell/"}]',
   '[{"title":"Notes from the first QS Show & Tell","url":"https://quantifiedself.com/blog/but-why/"}]'),
  ('lifespan-io', $text$Lifespan.io began as a public-facing project of the Lifespan Extension Advocacy Foundation, founded in 2014 by Keith Comito, Oliver Medvedik, Apneet Jolly and Richard Kaufman. In 2015 the foundation opened its crowdfunding platform so individuals could support specific aging-research projects. Its reporting later gave readers a way to follow the science behind those campaigns.

In 2024 the foundation merged with SENS Research Foundation to form the Lifespan Research Institute. The institute combines research into age-related disease with public education and fundraising. Its annual reports document the work of both predecessor organizations and the transition to the combined institute.$text$, '2014', 'lifespan.webp',
   '["Keith Comito","Oliver Medvedik","Apneet Jolly","Richard Kaufman"]',
   '[{"title":"Institute history and founding teams","url":"https://lifespan.io/about-us/"},{"title":"Completion of the merger","url":"https://lifespan.io/joining-forces-a-shared-mission/"}]',
   '[{"title":"Lifespan annual reports","url":"https://lifespan.io/about-us/annual-reports/"},{"title":"2019 Ending Age-Related Diseases conference program","url":"https://lifespan.io/wp-content/uploads/2025/08/EARD2019_Program.pdf"}]')
)
UPDATE "Organization" AS org
SET description = profiles.description, founded = profiles.founded,
    "imageUrl" = '/images/organizations/' || profiles.logo, "keyPeople" = profiles.people,
    resources = profiles.resources, publications = profiles.publications, "updatedAt" = NOW()
FROM profiles
WHERE profiles.slug = org.slug
  AND NOT EXISTS (
    SELECT 1 FROM "DirectoryRevision" AS rev
    WHERE rev."entityType" = 'organizations' AND rev."entityId" = org.id
      AND rev.actor = 'organization-profile-research'
  );

COMMIT;
