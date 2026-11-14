# Royal Flush: protocol, article and artwork package

Protocols and articles live in the database. This Markdown file is a complete editorial handoff, not a published directory record. No database edits, release or production deployment have been applied.

## Publication and indexing

Create the protocol in `Protocol` and the article in `KnowledgeArticle` (Prisma model `Article`). Store Spanish editorial fields in each record’s `localized.es` object. Create both records atomically. For edits to existing entries, use the authenticated directory PATCH endpoint with `X-Liberture-Edit-Source: ai`, or `withDirectoryEdit` with an administrator/job actor and `source: "ai"`; the entry and per-entry revision must be atomic. Do not silently overwrite an existing slug.

The existing database-driven sitemap includes published protocols and articles. Supply the translated slugs for language alternates, keep the reciprocal article/protocol links, and use the existing article metadata and structured-data components. Adding URLs to a sitemap makes them discoverable; it does not guarantee search-engine indexing.

Classify both entries under `Fueling` (the nutrition pillar). Protocol difficulty: `beginner`. Publish only once supporting media is available. Set actual publication/update timestamps when applying the records. Author: Liberture Editorial. Article reading time: 5 minutes.

## Protocol — English

### The Royal Flush: Feet Up, Strain Down

Slug: `royal-flush-footstool`

A small footstool can make your toilet posture more comfortable: support your feet, bring your knees above your hips, lean forward and breathe. No throne acrobatics required.

### Why it may help

The puborectalis muscle forms a sling around the junction of the rectum and anal canal. A supported, more squat-like posture may reduce that bend and help emptying. It does not literally straighten the whole rectum or treat every cause of constipation.

Duration: A brief attempt when the urge arrives

### Steps / Pasos

1. Go when you feel the urge; avoid repeatedly postponing it.

2. Sit fully on the toilet seat. Place both feet flat on a stable, non-slip footstool; choose a height that brings your knees comfortably above your hips.

3. Keep your knees comfortably apart and lean forward slightly, resting your forearms on your thighs. Do not perch on or squat on the toilet seat.

4. Relax your belly and pelvic floor. Breathe out gently; avoid holding your breath or pushing hard.

5. If nothing happens after a few minutes, get up and try again when the urge returns. Stop if the position hurts or feels unstable.

### Potential benefits / Posibles beneficios

- May make bowel emptying feel easier for some people.

- Provides a simple cue to relax and reduce straining.

- Uses an ordinary stable footstool; no branded device required.

### Limits and safety / Límites y seguridad

- Benefits vary: a randomized trial in people with constipation found no improvement in simulated defecation with a footstool.

- Avoid unstable supports. If you have balance difficulties, restricted hip movement or recent surgery, ask a clinician about a suitable posture.

- Seek medical advice for persistent constipation, rectal bleeding, unexplained weight loss or a new bowel-habit change. Severe abdominal pain with vomiting or inability to pass gas needs urgent assessment.

### Equipment / Equipo

- A stable, non-slip footstool that supports both feet.

### References / Referencias

- https://www.nhs.uk/conditions/constipation/

- https://www.southtees.nhs.uk/resources/getting-your-position-right/

- https://onlinelibrary.wiley.com/doi/10.1111/nmo.14580

- https://liberture.com/articles/royal-flush-footstool-toilet-posture

## Protocolo — Español

### Operación Trono: pies arriba, esfuerzo abajo

Slug: `operacion-trono-banquito`

Un banquito puede ayudarte a adoptar una postura más cómoda para evacuar: apoyá los pies, elevá las rodillas por encima de las caderas, inclinate hacia delante y respirá. Sin acrobacias en el trono.

### Por qué puede ayudar

El músculo puborrectal forma un lazo alrededor de la unión entre el recto y el canal anal. Una postura más parecida a una sentadilla, con los pies apoyados, puede reducir esa curva y facilitar la evacuación. No endereza literalmente todo el recto ni trata todas las causas del estreñimiento.

Duration: Un intento breve cuando aparezcan las ganas

### Steps / Pasos

1. Andá al baño cuando sientas ganas; evitá posponerlo una y otra vez.

2. Sentate por completo en el asiento. Apoyá ambos pies sobre un banquito firme y antideslizante, a una altura que deje las rodillas cómodamente por encima de las caderas.

3. Separá las rodillas cómodamente e inclinate un poco hacia delante, apoyando los antebrazos en los muslos. No te pongas en cuclillas sobre el inodoro.

4. Relajá el abdomen y el suelo pélvico. Soltá el aire suavemente; evitá aguantar la respiración o pujar fuerte.

5. Si no pasa nada tras unos minutos, levantate y volvé cuando regresen las ganas. Detenete si la postura duele o resulta inestable.

### Potential benefits / Posibles beneficios

- Puede facilitar la evacuación en algunas personas.

- Ayuda a recordar que conviene relajarse y reducir el esfuerzo.

- Solo requiere un banquito firme; no hace falta una marca específica.

### Limits and safety / Límites y seguridad

- Los resultados varían: un ensayo aleatorizado en personas con estreñimiento no encontró mejoras en la evacuación simulada con un banquito.

- Evitá apoyos inestables. Si tenés problemas de equilibrio, movilidad limitada de cadera o una cirugía reciente, consultá qué postura te conviene.

- Consultá por estreñimiento persistente, sangrado rectal, pérdida de peso inexplicable o cambios nuevos del ritmo intestinal. El dolor abdominal intenso con vómitos o imposibilidad de expulsar gases requiere atención urgente.

### Equipment / Equipo

- Un banquito firme y antideslizante para apoyar ambos pies.

### References / Referencias

- https://www.nhs.uk/conditions/constipation/

- https://www.southtees.nhs.uk/resources/getting-your-position-right/

- https://onlinelibrary.wiley.com/doi/10.1111/nmo.14580

- https://liberture.com/articles/royal-flush-footstool-toilet-posture

## Article — English

### Game of Stools: Give Your Feet a Promotion

Slug: `royal-flush-footstool-toilet-posture`

Why a toilet footstool may make pooping easier, how to use one safely, and what the evidence actually says about posture and straining.

Tags: constipation,gut health,toilet posture,footstool,pelvic floor

## Your throne could use a footrest

A toilet footstool is a small support under your feet while you remain seated on the toilet. The useful change is **raising the knees comfortably above the hips**, not forcing your feet far apart. A relaxed, comfortable gap between the knees and a slight forward lean complete the setup.

## The bend behind the business

The puborectalis muscle loops around the junction of the rectum and anal canal. Its sling helps maintain a bend that contributes to continence. During a bowel movement, pelvic-floor relaxation and a more squat-like posture may reduce that bend and make passage easier. “Straightening the rectum” is an oversimplification: your bowel is not a pipe that a footstool magically unblocks.

## The Royal Flush routine

Follow [The Royal Flush protocol](/protocols/royal-flush-footstool). Sit fully on the seat, put both feet flat on a stable non-slip stool and adjust the height for comfort. Keep the knees above the hips if you can do so comfortably. Lean slightly forward with forearms on thighs. Relax your abdomen and breathe out gently. Never balance on the toilet seat, hold your breath or force a bowel movement.

Respond to the urge rather than treating the bathroom like a timed performance. If a brief attempt gets nowhere, stand up and return when the urge comes back. More time scrolling does not mean more progress.

## Helpful posture, mixed evidence

The [NHS recommends trying a low footstool](https://www.nhs.uk/conditions/constipation/) to raise the knees above the hips. That is a practical self-care suggestion, not proof that everyone needs a device. A [2023 randomized trial](https://onlinelibrary.wiley.com/doi/10.1111/nmo.14580) in patients with constipation found that changing posture with a footstool did not improve simulated defecation. That test does not capture every real-life bowel movement, but it cautions against universal claims.

Treat this as a comfort experiment. Notice whether you strain less or feel more comfortable across ordinary bathroom visits. Stop if it hurts or makes you unsteady. A particular knee angle, a branded stool or a perfect daily poop score is unnecessary.

## The stool is only one part of the story

Regular movement, adequate fluids and gradually increasing dietary fibre can also support bowel habits. Persistent problems may involve medication effects, hard stool, pelvic-floor coordination or other conditions that posture alone cannot resolve. A clinician can help identify the cause and discuss appropriate treatment.

Seek medical advice for persistent constipation, blood in the stool, unexplained weight loss or a new bowel-habit change. Severe abdominal pain with vomiting or inability to pass gas needs urgent assessment. People with limited balance or hip mobility, or recent surgery, should ask about a safe setup.

## Sources and next step

- [NHS: constipation and toilet routine](https://www.nhs.uk/conditions/constipation/)
- [South Tees Hospitals: getting your position right](https://www.southtees.nhs.uk/resources/getting-your-position-right/)
- [Randomized footstool trial, Neurogastroenterology & Motility (2023)](https://onlinelibrary.wiley.com/doi/10.1111/nmo.14580)
- [Try the Royal Flush protocol](/protocols/royal-flush-footstool)


## Article — Español

### Juego de Tronos: ascendé a tus pies

Slug: `juego-de-tronos-banquito-postura-bano`

Por qué un banquito puede facilitar la evacuación, cómo usarlo con seguridad y qué dice la evidencia sobre la postura y el esfuerzo.

Tags: constipation,gut health,toilet posture,footstool,pelvic floor

## A tu trono le falta un apoyapiés

El banquito de baño sostiene los pies mientras seguís sentado en el inodoro. Lo útil es **elevar las rodillas cómodamente por encima de las caderas**, no separar mucho los pies. Dejá una separación cómoda entre las rodillas e inclinate un poco hacia delante.

## La curva detrás del asunto

El músculo puborrectal rodea la unión entre el recto y el canal anal. Ese lazo ayuda a mantener una curva que contribuye a la continencia. Al evacuar, relajar el suelo pélvico y adoptar una postura más parecida a una sentadilla puede reducir esa curva y facilitar el paso. Decir que el banquito “endereza el recto” simplifica demasiado: el intestino no es una tubería que se destapa mágicamente.

## Operación Trono, paso a paso

Seguí el [protocolo Operación Trono](/es/protocols/operacion-trono-banquito). Sentate por completo, apoyá ambos pies sobre un banquito firme y antideslizante y elegí una altura cómoda. Si podés hacerlo sin molestias, dejá las rodillas más altas que las caderas. Inclinate suavemente y apoyá los antebrazos en los muslos. Relajá el abdomen y soltá el aire. Nunca te subas al asiento, aguantes la respiración ni fuerces la evacuación.

Respondé a las ganas sin convertir el baño en una competencia. Si un intento breve no funciona, levantate y volvé cuando regresen las ganas. Más tiempo mirando el teléfono no significa más progreso.

## Una postura útil, con evidencia mixta

El [NHS aconseja probar un banquito bajo](https://www.nhs.uk/conditions/constipation/) para elevar las rodillas. Es una sugerencia práctica, no una demostración de que todo el mundo necesita uno. Un [ensayo aleatorizado de 2023](https://onlinelibrary.wiley.com/doi/10.1111/nmo.14580) en pacientes con estreñimiento no encontró mejoras en la evacuación simulada al usar un banquito. La prueba no representa cada visita real al baño, pero invita a evitar promesas universales.

Probalo como un ajuste de comodidad. Observá si necesitás menos esfuerzo o te sentís mejor durante las visitas habituales. Si duele o te desequilibra, dejá de usarlo. No necesitás un ángulo exacto, una marca específica ni una puntuación perfecta de evacuación diaria.

## El banquito es solo una parte

Moverte regularmente, beber suficiente líquido y aumentar la fibra de forma gradual también puede ayudar. Los problemas persistentes pueden relacionarse con medicamentos, heces duras, coordinación del suelo pélvico u otras causas que la postura no resuelve. Un profesional puede evaluar la causa y orientar el tratamiento.

Consultá por estreñimiento persistente, sangre en las heces, pérdida de peso inexplicable o cambios nuevos del ritmo intestinal. El dolor abdominal intenso con vómitos o imposibilidad de expulsar gases requiere atención urgente. Si tenés dificultades de equilibrio, movilidad limitada de cadera o una cirugía reciente, consultá cómo hacerlo con seguridad.

## Fuentes y siguiente paso

- [NHS: estreñimiento y rutina de baño](https://www.nhs.uk/conditions/constipation/)
- [South Tees Hospitals: postura para evacuar](https://www.southtees.nhs.uk/resources/getting-your-position-right/)
- [Ensayo aleatorizado sobre el banquito, 2023](https://onlinelibrary.wiley.com/doi/10.1111/nmo.14580)
- [Probá el protocolo Operación Trono](/es/protocols/operacion-trono-banquito)


## Artwork and preview

Original editable SVG illustration: a seated person using a stable footstool, with a crown motif, raised-knee guide and teal/lime/gold palette. This is a schematic posture illustration, not an anatomical diagram. Keep text outside the image so it can be localized.

English alternative text: A seated person rests both feet on a stable footstool, with knees above the hips and a gentle forward lean.

Spanish alternative text: Una persona sentada apoya ambos pies en un banquito firme, con las rodillas por encima de las caderas y una leve inclinación hacia delante.

Save the SVG source below as `/protocols/images/royal-flush-footstool.svg`. Generate 1200 × 630 PNG and WebP variants for sharing and protocol pages. Generate 1200 × 420 WebP article covers for both article slugs. If using the existing catalog reader artwork component, also export a 1200 × 320 reader cover.

Expected paths:

- `/protocols/images/royal-flush-footstool.svg`
- `/protocols/images/royal-flush-footstool.png`
- `/protocols/images/royal-flush-footstool.webp`
- `/protocols/images/readers/royal-flush-footstool.webp`
- `/articles/images/royal-flush-footstool-toilet-posture.webp`
- `/articles/images/juego-de-tronos-banquito-postura-bano.webp`

The current protocol image helper only recognizes catalog entries. Before publishing this database-only protocol, register its image and reuse `ProtocolPicture` for its public preview. Pass the request locale for translated alt text and keep new UI strings in English and Spanish messages files. Coordinate that application support with an explicitly requested release.

### Complete SVG source

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#122f38"/><stop offset="1" stop-color="#081921"/></linearGradient><linearGradient id="seat" x2="0" y2="1"><stop stop-color="#f9f7ee"/><stop offset="1" stop-color="#b6d6d0"/></linearGradient></defs><rect width="1200" height="630" rx="36" fill="url(#bg)"/><circle cx="890" cy="310" r="250" fill="#19454a"/><circle cx="890" cy="310" r="197" fill="none" stroke="#377073" stroke-dasharray="5 16"/><path d="M90 160l28-35 30 35 30-35 28 35-14 35h-88z" fill="#f5cc70"/><path d="M90 230h340M90 270h270M90 310h310" stroke="#d7ede2" stroke-width="15" stroke-linecap="round" opacity=".8"/><path d="M90 380h220M90 410h170" stroke="#71c9bb" stroke-width="9" stroke-linecap="round"/><rect x="90" y="475" width="270" height="65" rx="32" fill="#d7f792"/><path d="M130 510h165m-20-12 20 12-20 12" fill="none" stroke="#183b39" stroke-width="5" stroke-linecap="round"/><path d="M708 355h160q25 95-60 105v62h-100v-38q75-14 62-80h-62z" fill="url(#seat)"/><rect x="687" y="249" width="54" height="115" rx="14" fill="#e0e9df"/><rect x="701" y="347" width="180" height="20" rx="10" fill="#f9f7ee"/><circle cx="827" cy="151" r="38" fill="#f0c19c"/><path d="M811 197l-34 86 60 55 98-54 35 105" fill="none" stroke="#8ed9c5" stroke-width="45" stroke-linejoin="round" stroke-linecap="round"/><path d="M837 218l55 63 44 4" fill="none" stroke="#f0c19c" stroke-width="22" stroke-linecap="round"/><path d="M965 390h52" stroke="#f0c19c" stroke-width="21" stroke-linecap="round"/><path d="M926 418h118v21h-118zm12 21v55m94-55v55" fill="none" stroke="#f5cc70" stroke-width="14" stroke-linecap="round"/><path d="M848 338h187M933 282h102" stroke="#d7f792" stroke-dasharray="5 8" stroke-width="2"/><path d="M1055 332v-44m-9 10 9-10 9 10" fill="none" stroke="#d7f792" stroke-width="5" stroke-linecap="round"/><circle cx="1025" cy="152" r="35" fill="#d7f792"/><path d="M1009 152l11 11 22-25" fill="none" stroke="#183b39" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M660 535h425" stroke="#69958d" stroke-width="3"/><circle cx="111" cy="100" r="4" fill="#8ed9c5"/><circle cx="1080" cy="540" r="6" fill="#f5cc70"/></svg>
```

## Validation and current status

The bilingual JSON draft was parsed successfully and the SVG was rendered to PNG/WebP and visually inspected. No database connection was configured here, so no directory records were created and nothing has been indexed on the live site. Full application validation was unavailable: ESLint configuration is missing, and TypeScript reports existing missing dependencies, stale generated route types and Prisma-client mismatches. This handoff changes no application code.
