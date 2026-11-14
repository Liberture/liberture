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

Original editable SVG illustration: a seated person leaning forward with feet on a stable footstool, a raised-knee guide and an enlarged schematic anatomy inset. Uses Liberture’s dark background, nutrition green and contour pattern. Artwork copy is stored in `messages/royal-flush-artwork.json` with English and Spanish entries. Downloadable SVG and PNG are included at the repository root.

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
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="Inter, Helvetica Neue, Arial, sans-serif" role="img" aria-labelledby="title desc"><title id="title">The Royal Flush: supported toilet posture</title><desc id="desc">A person seated with feet on a footstool and knees above hips. A schematic inset shows a less acute anorectal bend.</desc><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#07071a"/><stop offset="1" stop-color="#160d33"/></linearGradient><radialGradient id="glow"><stop stop-color="#34d399" stop-opacity=".17"/><stop offset="1" stop-color="#34d399" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><ellipse cx="930" cy="310" rx="450" ry="430" fill="url(#glow)"/>
<path d="M1081.7,310.0 L1077.6,317.4 L1073.2,324.5 L1068.9,331.2 L1064.9,337.7 L1061.4,344.1 L1058.5,350.7 L1056.1,357.5 L1054.1,364.6 L1052.2,372.0 L1050.0,379.7 L1047.2,387.5 L1043.4,395.2 L1038.6,402.5 L1032.5,409.1 L1025.2,414.8 L1016.7,419.3 L1007.4,422.6 L997.4,424.6 L987.2,425.5 L976.9,425.4 L966.8,424.6 L957.1,423.5 L947.7,422.2 L938.7,421.2 L930.0,420.5 L921.3,420.3 L912.5,420.6 L903.5,421.3 L894.0,422.1 L884.2,422.8 L874.0,423.1 L863.7,422.6 L853.6,421.2 L843.9,418.6 L834.8,414.8 L826.9,409.7 L820.1,403.7 L814.6,396.7 L810.4,389.2 L807.3,381.3 L805.1,373.4 L803.5,365.6 L802.1,358.2 L800.6,351.0 L798.6,344.1 L796.2,337.5 L793.1,330.9 L789.5,324.2 L785.6,317.3 L781.7,310.0 L778.2,302.4 L775.6,294.4 L774.2,286.2 L774.3,278.0 L776.0,270.0 L779.5,262.3 L784.7,255.3 L791.2,249.0 L798.9,243.4 L807.3,238.7 L816.0,234.6 L824.7,230.9 L833.2,227.5 L841.3,224.2 L848.8,220.6 L856.0,216.7 L862.8,212.3 L869.7,207.5 L876.7,202.4 L884.2,197.2 L892.2,192.2 L900.8,187.7 L910.1,184.1 L919.9,181.6 L930.0,180.5 L940.2,180.8 L950.1,182.5 L959.7,185.6 L968.6,189.7 L976.9,194.6 L984.5,200.0 L991.5,205.5 L998.1,210.9 L1004.6,216.0 L1011.2,220.6 L1018.1,224.8 L1025.4,228.7 L1033.3,232.4 L1041.5,236.2 L1050.0,240.3 L1058.4,244.8 L1066.4,250.0 L1073.5,256.0 L1079.5,262.7 L1084.0,270.0 L1086.7,277.8 L1087.8,285.9 L1087.1,294.1 L1085.0,302.2 L1081.7,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1107.1,310.0 L1103.8,318.7 L1100.7,327.3 L1098.0,335.6 L1095.9,344.1 L1094.1,352.7 L1092.6,361.5 L1091.1,370.7 L1089.2,380.0 L1086.6,389.5 L1082.9,398.8 L1077.8,407.8 L1071.4,416.2 L1063.4,423.7 L1054.1,430.0 L1043.7,435.2 L1032.4,439.1 L1020.5,441.8 L1008.5,443.4 L996.5,444.3 L984.7,444.7 L973.3,444.9 L962.2,445.2 L951.4,445.8 L940.8,446.7 L930.0,448.1 L919.0,449.7 L907.7,451.3 L896.0,452.8 L883.9,453.7 L871.6,453.8 L859.4,452.7 L847.4,450.4 L836.1,446.7 L825.6,441.5 L816.3,435.2 L808.2,427.8 L801.3,419.6 L795.6,410.9 L790.9,402.1 L786.8,393.3 L783.0,384.6 L779.2,376.3 L775.2,368.3 L770.8,360.4 L765.9,352.7 L760.6,344.8 L755.1,336.7 L749.7,328.2 L744.9,319.3 L741.1,310.0 L738.5,300.4 L737.6,290.6 L738.5,280.8 L741.4,271.3 L746.0,262.2 L752.3,253.7 L759.9,246.0 L768.5,239.0 L777.5,232.6 L786.8,226.7 L795.8,221.2 L804.6,215.8 L812.9,210.2 L820.8,204.4 L828.6,198.3 L836.3,191.8 L844.2,185.2 L852.6,178.5 L861.7,172.1 L871.6,166.2 L882.3,161.3 L893.7,157.6 L905.6,155.3 L917.8,154.5 L930.0,155.3 L942.0,157.4 L953.6,160.8 L964.5,165.2 L974.9,170.1 L984.7,175.3 L994.1,180.5 L1003.3,185.5 L1012.4,190.1 L1021.8,194.3 L1031.4,198.3 L1041.5,202.2 L1051.9,206.2 L1062.4,210.5 L1072.9,215.4 L1082.9,221.2 L1092.0,227.8 L1099.9,235.3 L1106.4,243.6 L1111.1,252.6 L1114.0,262.2 L1115.1,272.0 L1114.6,281.8 L1112.9,291.5 L1110.2,300.9 L1107.1,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1134.9,310.0 L1133.6,320.2 L1132.7,330.5 L1132.1,340.8 L1131.7,351.4 L1131.1,362.3 L1130.0,373.3 L1128.0,384.5 L1124.8,395.7 L1120.1,406.5 L1113.7,416.8 L1105.6,426.2 L1096.0,434.7 L1084.9,441.9 L1072.6,447.9 L1059.7,452.8 L1046.2,456.5 L1032.7,459.5 L1019.3,461.8 L1006.2,463.9 L993.3,465.9 L980.7,468.1 L968.3,470.6 L955.8,473.3 L943.1,476.2 L930.0,479.1 L916.5,481.7 L902.6,483.7 L888.4,484.7 L874.0,484.4 L859.8,482.8 L846.1,479.6 L833.1,474.8 L821.0,468.6 L810.1,461.2 L800.3,452.8 L791.7,443.7 L784.1,434.3 L777.1,424.9 L770.6,415.5 L764.2,406.4 L757.7,397.5 L750.9,388.8 L743.8,380.1 L736.4,371.3 L728.9,362.3 L721.7,352.8 L715.1,342.8 L709.5,332.3 L705.3,321.3 L702.9,310.0 L702.5,298.5 L704.1,287.2 L707.8,276.1 L713.2,265.5 L720.2,255.5 L728.3,246.1 L737.1,237.4 L746.2,229.2 L755.3,221.3 L764.2,213.6 L772.8,206.0 L781.0,198.1 L789.1,190.0 L797.3,181.7 L805.7,173.2 L814.8,164.7 L824.6,156.6 L835.4,149.1 L847.1,142.5 L859.8,137.2 L873.3,133.4 L887.3,131.1 L901.6,130.4 L915.9,131.3 L930.0,133.5 L943.6,136.8 L956.7,140.8 L969.3,145.2 L981.4,149.7 L993.3,154.1 L1005.1,158.2 L1017.0,162.1 L1029.1,165.7 L1041.6,169.4 L1054.3,173.2 L1067.1,177.4 L1079.8,182.4 L1092.0,188.3 L1103.5,195.2 L1113.7,203.2 L1122.5,212.3 L1129.5,222.3 L1134.7,232.9 L1138.1,244.1 L1139.8,255.5 L1140.1,266.8 L1139.4,278.0 L1138.1,289.0 L1136.5,299.6 L1134.9,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1167.4,310.0 L1168.5,322.0 L1169.6,334.2 L1170.4,346.7 L1170.6,359.4 L1169.8,372.3 L1167.6,385.3 L1163.8,398.0 L1158.0,410.3 L1150.4,421.9 L1140.8,432.5 L1129.6,442.1 L1117.0,450.5 L1103.4,457.7 L1089.1,463.8 L1074.5,469.1 L1059.9,473.7 L1045.4,478.0 L1031.2,482.1 L1017.3,486.3 L1003.4,490.6 L989.4,495.2 L975.3,499.8 L960.7,504.3 L945.6,508.4 L930.0,511.7 L914.0,514.1 L897.6,515.1 L881.2,514.5 L865.1,512.2 L849.5,508.3 L834.6,502.7 L820.8,495.7 L808.0,487.5 L796.3,478.6 L785.5,469.1 L775.5,459.4 L766.0,449.7 L756.7,440.2 L747.4,430.9 L737.9,421.6 L728.2,412.4 L718.4,403.1 L708.5,393.4 L699.0,383.2 L690.2,372.3 L682.4,360.9 L676.2,348.7 L671.8,336.1 L669.5,323.1 L669.4,310.0 L671.5,297.0 L675.5,284.3 L681.3,272.0 L688.3,260.3 L696.2,249.2 L704.6,238.6 L713.2,228.4 L721.6,218.4 L729.9,208.4 L737.9,198.4 L745.9,188.1 L754.0,177.7 L762.4,167.3 L771.6,156.9 L781.8,146.8 L793.0,137.4 L805.5,128.9 L819.2,121.6 L833.9,115.9 L849.5,111.7 L865.6,109.3 L881.9,108.4 L898.3,109.0 L914.3,110.7 L930.0,113.3 L945.2,116.5 L960.0,119.8 L974.6,123.2 L988.9,126.3 L1003.4,129.4 L1018.0,132.2 L1032.8,135.2 L1047.9,138.4 L1063.1,142.2 L1078.2,146.8 L1092.9,152.4 L1106.9,159.3 L1119.7,167.5 L1131.1,176.9 L1140.8,187.5 L1148.7,199.0 L1154.8,211.1 L1159.1,223.7 L1162.0,236.5 L1163.8,249.2 L1164.8,261.8 L1165.4,274.1 L1165.9,286.2 L1166.5,298.1 L1167.4,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1204.8,310.0 L1207.6,324.0 L1209.6,338.3 L1210.5,352.8 L1209.8,367.5 L1207.3,382.1 L1202.8,396.4 L1196.0,410.1 L1187.2,423.1 L1176.4,435.1 L1164.0,446.0 L1150.3,455.8 L1135.7,464.5 L1120.6,472.4 L1105.4,479.6 L1090.1,486.3 L1075.0,492.8 L1060.1,499.3 L1045.2,505.8 L1030.2,512.5 L1014.9,519.1 L999.2,525.5 L982.8,531.5 L965.8,536.6 L948.1,540.7 L930.0,543.3 L911.6,544.2 L893.2,543.3 L875.0,540.6 L857.4,536.1 L840.6,530.0 L824.8,522.6 L809.9,514.3 L795.8,505.2 L782.6,495.8 L769.9,486.3 L757.5,476.8 L745.2,467.5 L732.8,458.2 L720.3,448.8 L707.7,439.2 L695.2,429.2 L683.0,418.6 L671.6,407.3 L661.4,395.1 L652.7,382.1 L645.9,368.4 L641.2,354.1 L638.8,339.4 L638.8,324.7 L640.8,310.0 L644.7,295.6 L650.0,281.7 L656.5,268.3 L663.6,255.3 L670.9,242.7 L678.4,230.3 L685.7,218.0 L692.9,205.7 L700.2,193.3 L707.7,180.8 L715.7,168.2 L724.6,155.7 L734.5,143.5 L745.8,131.9 L758.6,121.3 L772.8,111.8 L788.4,103.9 L805.0,97.6 L822.6,92.9 L840.6,90.0 L858.9,88.5 L877.1,88.3 L895.1,89.0 L912.7,90.4 L930.0,92.1 L947.0,93.9 L963.8,95.7 L980.7,97.4 L997.7,99.1 L1014.9,100.9 L1032.4,103.1 L1050.0,106.0 L1067.6,109.8 L1084.8,114.9 L1101.4,121.3 L1117.0,129.2 L1131.3,138.5 L1143.9,149.3 L1154.8,161.2 L1164.0,174.0 L1171.4,187.5 L1177.3,201.2 L1182.0,215.1 L1185.8,229.0 L1189.1,242.7 L1192.1,256.2 L1195.2,269.5 L1198.4,282.9 L1201.7,296.3 L1204.8,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1245.2,310.0 L1248.3,326.0 L1249.7,342.3 L1249.1,358.7 L1246.2,375.0 L1241.0,390.8 L1233.4,406.1 L1223.7,420.6 L1212.1,434.1 L1198.9,446.5 L1184.7,458.0 L1169.7,468.6 L1154.4,478.6 L1138.9,488.0 L1123.5,497.1 L1108.1,506.1 L1092.7,515.1 L1077.1,524.1 L1061.2,533.0 L1044.7,541.7 L1027.4,549.8 L1009.3,557.1 L990.4,563.2 L970.7,567.8 L950.5,570.7 L930.0,571.6 L909.5,570.6 L889.3,567.6 L869.7,563.0 L850.8,556.8 L832.7,549.5 L815.5,541.4 L799.0,532.8 L783.0,523.9 L767.4,515.0 L751.9,506.1 L736.4,497.2 L720.9,488.1 L705.4,478.7 L690.0,468.8 L675.0,458.2 L660.7,446.7 L647.6,434.2 L636.1,420.6 L626.5,406.1 L619.0,390.8 L613.9,374.9 L611.2,358.7 L610.6,342.3 L612.1,326.0 L615.2,310.0 L619.5,294.4 L624.6,279.1 L630.2,264.3 L636.0,249.6 L641.8,235.1 L647.7,220.6 L653.7,206.0 L660.0,191.3 L667.0,176.5 L675.0,161.8 L684.3,147.4 L695.1,133.5 L707.6,120.6 L721.9,108.8 L737.8,98.4 L755.1,89.6 L773.6,82.4 L792.9,77.0 L812.7,73.1 L832.7,70.5 L852.6,68.9 L872.3,68.1 L891.8,67.8 L910.9,67.7 L930.0,67.6 L949.1,67.6 L968.3,67.6 L987.7,67.9 L1007.5,68.6 L1027.4,70.2 L1047.4,72.8 L1067.2,76.8 L1086.5,82.3 L1104.9,89.5 L1122.2,98.4 L1138.0,108.8 L1152.2,120.7 L1164.6,133.7 L1175.4,147.6 L1184.7,162.0 L1192.7,176.6 L1199.7,191.4 L1206.1,206.1 L1212.2,220.6 L1218.2,235.1 L1224.1,249.6 L1230.0,264.2 L1235.7,279.1 L1240.9,294.4 L1245.2,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1285.5,310.0 L1287.3,328.0 L1286.7,346.1 L1283.6,364.0 L1277.9,381.5 L1269.9,398.3 L1259.7,414.4 L1247.7,429.6 L1234.4,443.9 L1220.2,457.3 L1205.5,470.1 L1190.4,482.3 L1175.2,494.2 L1160.0,506.0 L1144.7,517.6 L1129.1,529.2 L1112.9,540.6 L1096.1,551.8 L1078.4,562.3 L1059.7,572.0 L1039.9,580.5 L1019.0,587.4 L997.4,592.6 L975.1,595.7 L952.6,596.8 L930.0,595.9 L907.7,593.1 L886.0,588.7 L864.9,583.0 L844.5,576.4 L824.8,569.1 L805.6,561.4 L786.8,553.5 L768.1,545.6 L749.5,537.5 L730.9,529.2 L712.4,520.5 L693.9,511.1 L675.9,500.9 L658.6,489.6 L642.4,477.2 L627.7,463.5 L614.9,448.6 L604.3,432.6 L596.0,415.8 L590.1,398.3 L586.6,380.5 L585.1,362.6 L585.3,344.8 L586.9,327.3 L589.5,310.0 L592.7,293.0 L596.2,276.3 L599.9,259.6 L603.8,243.0 L607.9,226.3 L612.6,209.5 L618.0,192.5 L624.5,175.7 L632.6,159.0 L642.4,142.8 L654.1,127.4 L667.9,113.1 L683.6,100.1 L701.0,88.6 L720.0,78.7 L740.0,70.5 L760.8,63.8 L782.1,58.5 L803.5,54.3 L824.8,50.9 L846.0,48.1 L867.0,45.6 L887.9,43.3 L908.9,41.1 L930.0,39.1 L951.4,37.4 L973.2,36.3 L995.3,36.1 L1017.6,37.0 L1039.9,39.5 L1061.8,43.7 L1083.1,49.7 L1103.4,57.6 L1122.5,67.4 L1140.0,78.7 L1156.0,91.4 L1170.4,105.2 L1183.3,119.7 L1194.9,134.7 L1205.5,149.9 L1215.4,165.1 L1224.8,180.3 L1234.0,195.5 L1243.1,210.8 L1252.1,226.3 L1260.7,242.1 L1268.7,258.3 L1275.8,275.0 L1281.6,292.3 L1285.5,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1322.7,310.0 L1322.2,329.7 L1319.0,349.3 L1313.2,368.5 L1305.1,387.0 L1295.0,404.9 L1283.4,421.9 L1270.6,438.2 L1257.0,453.8 L1243.0,468.9 L1228.8,483.7 L1214.3,498.2 L1199.7,512.6 L1184.6,526.9 L1168.9,541.0 L1152.3,554.8 L1134.7,568.0 L1115.8,580.3 L1095.5,591.4 L1074.0,601.0 L1051.3,608.8 L1027.7,614.5 L1003.5,618.1 L978.9,619.6 L954.3,619.2 L930.0,617.0 L906.1,613.4 L882.8,608.7 L860.1,603.3 L837.8,597.3 L815.9,591.0 L794.1,584.5 L772.5,577.8 L750.8,570.7 L729.2,563.1 L707.7,554.8 L686.5,545.4 L666.0,534.9 L646.6,522.9 L628.5,509.5 L612.3,494.6 L598.2,478.4 L586.4,461.1 L577.0,442.9 L569.9,424.0 L565.0,404.9 L561.9,385.6 L560.3,366.4 L559.8,347.4 L560.0,328.6 L560.7,310.0 L561.7,291.5 L563.0,272.9 L564.7,254.3 L567.0,235.4 L570.3,216.5 L574.9,197.5 L581.1,178.7 L589.3,160.2 L599.7,142.3 L612.3,125.4 L627.2,109.6 L644.2,95.3 L662.9,82.5 L683.2,71.3 L704.4,61.6 L726.4,53.3 L748.7,46.1 L771.1,39.9 L793.5,34.2 L815.9,29.0 L838.2,24.0 L860.7,19.3 L883.4,14.8 L906.5,10.8 L930.0,7.4 L954.0,5.0 L978.3,3.9 L1002.9,4.5 L1027.3,6.8 L1051.3,11.2 L1074.7,17.7 L1096.9,26.2 L1117.9,36.5 L1137.5,48.4 L1155.6,61.6 L1172.2,75.7 L1187.7,90.5 L1202.0,105.6 L1215.7,120.9 L1228.8,136.3 L1241.6,151.8 L1254.2,167.4 L1266.5,183.3 L1278.4,199.6 L1289.7,216.5 L1300.0,234.0 L1308.8,252.2 L1315.7,271.0 L1320.5,290.3 L1322.7,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1354.9,310.0 L1352.0,331.2 L1346.6,352.1 L1339.0,372.4 L1329.7,392.1 L1319.0,411.1 L1307.4,429.5 L1295.2,447.5 L1282.5,465.0 L1269.5,482.4 L1256.1,499.5 L1242.2,516.6 L1227.5,533.5 L1211.8,550.0 L1194.7,566.0 L1176.3,581.2 L1156.2,595.1 L1134.5,607.5 L1111.3,618.2 L1086.8,626.8 L1061.3,633.3 L1035.2,637.7 L1008.7,640.0 L982.2,640.5 L955.9,639.5 L930.0,637.2 L904.5,634.1 L879.4,630.3 L854.6,626.1 L830.0,621.6 L805.4,616.7 L780.9,611.4 L756.3,605.4 L731.7,598.5 L707.4,590.5 L683.7,581.2 L660.9,570.2 L639.5,557.5 L619.6,543.2 L601.8,527.2 L586.2,509.8 L573.0,491.3 L562.0,471.8 L553.2,451.8 L546.3,431.5 L541.0,411.1 L536.8,390.8 L533.6,370.5 L530.9,350.3 L528.7,330.2 L526.9,310.0 L525.7,289.6 L525.1,269.1 L525.7,248.3 L527.7,227.4 L531.5,206.4 L537.5,185.7 L546.0,165.4 L556.9,145.9 L570.4,127.4 L586.2,110.2 L604.2,94.4 L623.9,80.0 L644.9,67.2 L667.0,55.6 L689.6,45.3 L712.5,35.8 L735.6,27.1 L758.7,18.8 L782.0,10.9 L805.4,3.3 L829.2,-3.9 L853.5,-10.7 L878.4,-16.7 L903.9,-21.6 L930.0,-25.2 L956.5,-27.0 L983.2,-26.9 L1009.8,-24.6 L1035.9,-20.0 L1061.3,-13.3 L1085.7,-4.5 L1108.8,6.0 L1130.6,18.1 L1151.1,31.3 L1170.4,45.3 L1188.7,59.8 L1206.3,74.7 L1223.2,89.7 L1239.8,105.0 L1256.1,120.5 L1272.1,136.3 L1287.6,152.7 L1302.4,169.8 L1316.2,187.7 L1328.5,206.4 L1338.8,226.0 L1346.9,246.4 L1352.4,267.3 L1355.1,288.6 L1354.9,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1382.6,310.0 L1378.2,332.6 L1371.8,354.6 L1363.9,376.2 L1354.8,397.3 L1345.0,417.9 L1334.6,438.2 L1323.7,458.2 L1312.3,478.1 L1300.2,497.9 L1287.1,517.6 L1272.8,536.9 L1257.1,555.7 L1239.6,573.8 L1220.3,590.7 L1199.0,606.2 L1175.9,619.9 L1151.1,631.7 L1124.9,641.4 L1097.7,648.9 L1069.9,654.4 L1041.7,657.9 L1013.4,659.9 L985.4,660.6 L957.5,660.2 L930.0,659.1 L902.7,657.5 L875.5,655.4 L848.3,652.8 L821.0,649.7 L793.6,645.8 L766.2,641.0 L738.9,634.8 L712.1,627.1 L686.0,617.6 L661.0,606.2 L637.5,592.8 L615.9,577.6 L596.3,560.7 L579.0,542.3 L563.8,522.8 L550.9,502.5 L539.8,481.6 L530.3,460.5 L522.2,439.2 L515.0,417.9 L508.5,396.6 L502.6,375.2 L497.2,353.7 L492.5,332.0 L488.6,310.0 L485.9,287.6 L484.8,265.0 L485.7,242.2 L488.9,219.4 L494.8,196.9 L503.4,174.9 L514.8,153.7 L528.9,133.6 L545.3,114.7 L563.8,97.2 L584.0,81.0 L605.4,66.1 L627.6,52.4 L650.4,39.6 L673.5,27.6 L696.8,16.1 L720.4,5.0 L744.3,-5.8 L768.6,-16.1 L793.6,-25.8 L819.3,-34.8 L845.9,-42.6 L873.3,-49.0 L901.4,-53.6 L930.0,-56.1 L958.8,-56.3 L987.5,-54.2 L1015.8,-49.7 L1043.3,-43.0 L1069.9,-34.4 L1095.3,-24.0 L1119.6,-12.3 L1142.8,0.4 L1165.0,13.7 L1186.5,27.6 L1207.4,41.8 L1227.9,56.2 L1248.0,71.1 L1267.8,86.4 L1287.1,102.4 L1305.7,119.3 L1323.2,137.1 L1339.3,155.9 L1353.4,175.9 L1365.2,196.9 L1374.4,218.7 L1380.7,241.2 L1384.2,264.1 L1384.7,287.1 L1382.6,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1407.9,310.0 L1403.4,333.8 L1397.6,357.3 L1390.9,380.3 L1383.4,403.1 L1375.3,425.7 L1366.4,448.2 L1356.8,470.7 L1346.0,493.0 L1333.9,515.0 L1320.0,536.7 L1304.2,557.6 L1286.2,577.6 L1266.0,596.2 L1243.5,613.2 L1219.1,628.3 L1192.9,641.4 L1165.3,652.3 L1136.6,661.3 L1107.3,668.3 L1077.7,673.6 L1048.0,677.6 L1018.3,680.4 L988.8,682.4 L959.4,683.8 L930.0,684.5 L900.5,684.8 L870.9,684.4 L841.0,683.1 L811.0,680.6 L781.0,676.8 L751.2,671.2 L721.9,663.7 L693.6,654.1 L666.4,642.2 L640.9,628.3 L617.3,612.4 L595.7,594.8 L576.3,575.7 L558.9,555.6 L543.4,534.7 L529.5,513.3 L516.9,491.7 L505.4,469.8 L494.8,447.9 L484.7,425.7 L475.3,403.4 L466.7,380.7 L459.0,357.6 L452.6,334.0 L447.9,310.0 L445.3,285.6 L445.2,261.0 L447.9,236.4 L453.6,212.1 L462.3,188.4 L473.9,165.5 L488.1,143.7 L504.8,123.0 L523.3,103.5 L543.4,85.3 L564.5,68.1 L586.4,51.9 L608.8,36.4 L631.6,21.4 L654.8,7.0 L678.5,-7.1 L702.8,-20.7 L727.9,-33.7 L753.9,-45.8 L781.0,-56.8 L809.2,-66.3 L838.4,-74.0 L868.5,-79.5 L899.1,-82.7 L930.0,-83.5 L960.8,-81.7 L991.2,-77.6 L1020.9,-71.3 L1049.8,-63.2 L1077.7,-53.6 L1104.6,-42.8 L1130.7,-31.2 L1156.0,-18.9 L1180.8,-6.2 L1205.2,7.0 L1229.2,20.7 L1252.9,34.9 L1276.1,50.0 L1298.6,66.1 L1320.0,83.3 L1340.0,101.8 L1358.2,121.7 L1374.1,142.8 L1387.3,165.1 L1397.7,188.4 L1405.2,212.4 L1409.7,236.8 L1411.4,261.3 L1410.7,285.8 L1407.9,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1434.1,310.0 L1431.1,335.2 L1427.1,360.2 L1422.4,385.1 L1416.8,410.0 L1410.2,434.8 L1402.4,459.6 L1393.0,484.3 L1381.7,508.7 L1368.2,532.5 L1352.2,555.4 L1333.7,577.2 L1312.7,597.5 L1289.2,616.0 L1263.6,632.6 L1236.3,647.2 L1207.5,659.8 L1177.8,670.5 L1147.4,679.6 L1116.6,687.1 L1085.8,693.5 L1054.9,699.0 L1023.9,703.8 L992.8,707.8 L961.6,711.3 L930.0,714.0 L898.1,715.7 L865.9,716.1 L833.4,715.1 L800.9,712.1 L768.7,707.1 L737.1,699.7 L706.5,690.0 L677.2,677.9 L649.5,663.5 L623.7,647.2 L599.9,629.2 L577.9,609.9 L557.8,589.6 L539.3,568.6 L522.2,547.0 L506.1,525.2 L490.9,503.1 L476.5,480.7 L462.7,458.0 L449.8,434.8 L437.9,411.1 L427.3,386.7 L418.6,361.7 L412.1,336.1 L408.1,310.0 L407.1,283.7 L409.2,257.4 L414.6,231.3 L423.0,205.9 L434.4,181.2 L448.5,157.5 L464.7,134.8 L482.6,113.2 L501.9,92.7 L522.2,73.0 L543.2,54.0 L564.7,35.6 L586.9,17.7 L609.6,0.2 L633.2,-16.8 L657.8,-33.2 L683.5,-48.7 L710.5,-63.1 L739.0,-76.0 L768.7,-87.1 L799.7,-96.0 L831.6,-102.5 L864.2,-106.5 L897.1,-107.9 L930.0,-106.8 L962.5,-103.5 L994.5,-98.2 L1025.7,-91.2 L1056.1,-82.9 L1085.8,-73.5 L1114.8,-63.4 L1143.3,-52.7 L1171.5,-41.4 L1199.3,-29.5 L1226.8,-16.8 L1253.9,-3.2 L1280.3,11.6 L1305.8,27.7 L1329.9,45.4 L1352.2,64.6 L1372.4,85.4 L1390.0,107.7 L1404.8,131.3 L1416.7,155.9 L1425.6,181.2 L1431.6,207.0 L1435.2,232.9 L1436.5,258.8 L1436.0,284.5 L1434.1,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1464.0,310.0 L1463.3,336.8 L1461.6,363.7 L1458.7,390.7 L1454.4,417.7 L1448.4,444.8 L1440.3,471.6 L1429.7,498.1 L1416.5,524.0 L1400.4,548.8 L1381.4,572.4 L1359.7,594.4 L1335.5,614.6 L1309.1,632.9 L1280.9,649.4 L1251.5,664.0 L1221.0,676.9 L1190.0,688.4 L1158.6,698.6 L1126.9,707.9 L1095.0,716.3 L1062.9,724.0 L1030.4,731.0 L997.5,737.2 L964.0,742.3 L930.0,746.1 L895.5,748.2 L860.8,748.4 L826.0,746.3 L791.5,741.7 L757.6,734.5 L724.7,724.8 L693.2,712.6 L663.2,698.2 L635.0,681.9 L608.5,664.0 L583.8,644.8 L560.6,624.7 L538.7,604.0 L517.9,582.8 L498.0,561.1 L478.8,539.1 L460.5,516.5 L443.0,493.3 L426.6,469.5 L411.6,444.8 L398.4,419.2 L387.5,392.8 L379.2,365.7 L374.0,338.0 L372.0,310.0 L373.4,282.0 L378.2,254.2 L386.0,227.0 L396.7,200.5 L409.9,174.8 L425.0,150.0 L441.7,126.2 L459.6,103.1 L478.4,80.7 L498.0,58.9 L518.3,37.5 L539.4,16.6 L561.6,-3.9 L584.9,-23.7 L609.6,-42.8 L635.9,-60.7 L663.9,-77.2 L693.6,-91.9 L724.9,-104.4 L757.6,-114.5 L791.3,-122.1 L825.8,-127.1 L860.6,-129.5 L895.4,-129.6 L930.0,-127.5 L964.1,-123.7 L997.6,-118.4 L1030.6,-111.9 L1063.0,-104.5 L1095.0,-96.3 L1126.7,-87.5 L1158.1,-77.8 L1189.3,-67.3 L1220.1,-55.7 L1250.4,-42.8 L1279.8,-28.3 L1308.1,-12.1 L1334.7,6.0 L1359.3,25.9 L1381.4,47.6 L1400.8,71.0 L1417.4,95.6 L1431.1,121.4 L1441.9,147.9 L1450.1,174.8 L1456.1,201.9 L1460.1,229.1 L1462.6,256.2 L1463.8,283.1 L1464.0,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1499.0,310.0 L1500.4,338.7 L1500.3,367.6 L1498.2,396.7 L1493.9,425.8 L1487.0,454.8 L1477.1,483.3 L1464.1,511.0 L1447.9,537.8 L1428.6,563.2 L1406.5,587.0 L1381.9,609.1 L1355.1,629.4 L1326.7,648.0 L1297.0,664.9 L1266.4,680.5 L1235.2,694.8 L1203.5,708.0 L1171.4,720.4 L1138.9,732.1 L1105.8,742.9 L1072.1,752.9 L1037.7,761.7 L1002.5,769.1 L966.6,774.8 L930.0,778.5 L893.1,779.8 L856.0,778.5 L819.3,774.4 L783.1,767.6 L748.0,758.1 L714.1,746.2 L681.7,732.2 L650.8,716.3 L621.5,698.9 L593.6,680.5 L566.9,661.1 L541.3,641.1 L516.7,620.5 L492.8,599.4 L469.7,577.6 L447.4,555.0 L426.3,531.5 L406.6,507.0 L388.7,481.5 L373.0,454.8 L360.1,427.1 L350.2,398.5 L343.7,369.3 L340.6,339.7 L341.0,310.0 L344.7,280.5 L351.4,251.5 L360.7,223.1 L372.3,195.4 L385.6,168.5 L400.4,142.2 L416.3,116.6 L433.1,91.5 L450.9,66.8 L469.7,42.4 L489.6,18.6 L511.0,-4.8 L534.0,-27.4 L558.9,-48.9 L585.8,-69.0 L614.7,-87.4 L645.7,-103.8 L678.4,-117.8 L712.6,-129.3 L748.0,-138.1 L784.2,-144.4 L820.7,-148.3 L857.4,-150.0 L893.8,-149.7 L930.0,-147.9 L965.8,-144.8 L1001.2,-140.6 L1036.2,-135.6 L1071.1,-129.7 L1105.8,-122.9 L1140.4,-115.1 L1174.7,-106.1 L1208.7,-95.5 L1242.0,-83.3 L1274.2,-69.0 L1305.1,-52.7 L1334.0,-34.2 L1360.8,-13.6 L1385.0,8.8 L1406.5,33.0 L1425.2,58.6 L1441.1,85.2 L1454.4,112.6 L1465.4,140.4 L1474.4,168.5 L1481.7,196.7 L1487.7,224.9 L1492.5,253.1 L1496.3,281.5 L1499.0,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1538.2,310.0 L1540.6,340.7 L1540.7,371.7 L1538.0,402.8 L1532.1,433.7 L1522.9,464.1 L1510.2,493.8 L1494.1,522.4 L1474.9,549.6 L1452.8,575.4 L1428.2,599.6 L1401.7,622.2 L1373.5,643.2 L1344.2,662.9 L1314.0,681.3 L1283.0,698.7 L1251.5,715.3 L1219.3,731.0 L1186.4,745.9 L1152.7,759.9 L1117.9,772.7 L1082.2,784.1 L1045.3,793.7 L1007.6,801.2 L969.0,806.3 L930.0,808.7 L890.8,808.2 L851.9,804.8 L813.5,798.6 L776.0,789.8 L739.7,778.6 L704.7,765.3 L670.9,750.4 L638.5,734.2 L607.2,716.9 L577.0,698.7 L547.5,679.8 L518.9,660.2 L491.0,639.8 L464.0,618.4 L438.0,596.0 L413.4,572.3 L390.6,547.2 L370.0,520.8 L352.0,493.1 L337.1,464.1 L325.6,434.1 L317.6,403.5 L313.1,372.3 L312.1,341.1 L314.2,310.0 L319.1,279.3 L326.4,249.0 L335.7,219.3 L346.5,190.2 L358.8,161.5 L372.1,133.3 L386.6,105.4 L402.3,77.9 L419.3,50.7 L438.0,24.0 L458.6,-2.0 L481.3,-27.1 L506.3,-50.9 L533.8,-73.2 L563.6,-93.5 L595.6,-111.5 L629.6,-127.1 L665.3,-140.1 L702.1,-150.6 L739.7,-158.6 L777.8,-164.3 L816.0,-168.1 L854.2,-170.2 L892.2,-171.0 L930.0,-170.5 L967.7,-169.1 L1005.3,-166.6 L1042.8,-163.2 L1080.4,-158.7 L1117.9,-152.7 L1155.2,-145.1 L1192.1,-135.6 L1228.2,-123.9 L1263.1,-109.9 L1296.4,-93.5 L1327.8,-74.6 L1356.8,-53.6 L1383.3,-30.5 L1407.1,-5.7 L1428.2,20.4 L1446.9,47.6 L1463.2,75.5 L1477.5,103.9 L1490.1,132.6 L1501.2,161.5 L1511.2,190.6 L1519.9,220.0 L1527.5,249.6 L1533.6,279.6 L1538.2,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1578.9,310.0 L1581.0,342.8 L1579.7,375.7 L1574.9,408.4 L1566.4,440.7 L1554.2,472.3 L1538.6,502.8 L1519.8,532.0 L1498.3,559.9 L1474.4,586.4 L1448.6,611.4 L1421.4,635.2 L1393.0,657.8 L1363.7,679.5 L1333.5,700.2 L1302.5,720.1 L1270.5,739.2 L1237.4,757.4 L1203.1,774.4 L1167.5,789.9 L1130.5,803.7 L1092.2,815.4 L1052.7,824.6 L1012.3,831.0 L971.3,834.6 L930.0,835.1 L888.9,832.6 L848.3,827.4 L808.5,819.6 L769.7,809.6 L731.9,797.8 L695.2,784.4 L659.6,769.8 L624.8,754.1 L590.8,737.6 L557.5,720.1 L525.0,701.7 L493.2,682.1 L462.4,661.3 L432.8,639.0 L405.0,615.1 L379.3,589.6 L356.2,562.4 L336.0,533.6 L319.1,503.5 L305.8,472.3 L296.0,440.2 L289.7,407.7 L286.6,375.0 L286.5,342.4 L288.9,310.0 L293.5,278.0 L299.9,246.3 L307.7,215.0 L316.9,184.1 L327.4,153.4 L339.2,122.9 L352.6,92.6 L367.8,62.8 L385.2,33.4 L405.0,4.9 L427.4,-22.6 L452.6,-48.6 L480.6,-72.8 L511.2,-95.0 L544.2,-114.8 L579.3,-132.1 L616.0,-147.0 L653.9,-159.4 L692.6,-169.6 L731.9,-177.8 L771.4,-184.2 L811.0,-189.1 L850.6,-192.8 L890.3,-195.4 L930.0,-196.9 L969.9,-197.3 L1010.0,-196.5 L1050.2,-194.1 L1090.5,-190.0 L1130.5,-183.7 L1170.1,-175.2 L1208.8,-164.0 L1246.3,-150.2 L1282.0,-133.8 L1315.8,-114.8 L1347.2,-93.5 L1376.2,-70.2 L1402.7,-45.1 L1426.8,-18.8 L1448.6,8.6 L1468.5,36.6 L1486.6,65.2 L1503.2,94.2 L1518.6,123.6 L1532.6,153.4 L1545.5,183.6 L1556.8,214.3 L1566.5,245.7 L1574.0,277.6 L1578.9,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1618.1,310.0 L1618.2,344.6 L1614.5,379.2 L1607.0,413.3 L1595.7,446.7 L1581.0,479.2 L1563.3,510.6 L1542.9,540.7 L1520.4,569.7 L1496.1,597.4 L1470.4,624.1 L1443.5,649.8 L1415.5,674.7 L1386.5,698.9 L1356.2,722.2 L1324.7,744.6 L1291.6,765.9 L1256.9,785.7 L1220.5,803.9 L1182.4,819.9 L1142.6,833.5 L1101.5,844.3 L1059.3,852.2 L1016.4,857.0 L973.2,858.8 L930.0,857.6 L887.2,853.8 L845.1,847.6 L803.8,839.4 L763.3,829.5 L723.6,818.2 L684.7,805.7 L646.4,792.1 L608.8,777.5 L571.7,761.7 L535.3,744.6 L499.8,726.0 L465.5,705.8 L432.6,683.6 L401.8,659.6 L373.4,633.5 L347.8,605.6 L325.4,575.9 L306.4,544.8 L290.9,512.4 L279.0,479.2 L270.3,445.5 L264.6,411.5 L261.6,377.6 L260.9,343.7 L262.1,310.0 L264.9,276.5 L269.2,243.2 L275.0,210.0 L282.3,177.0 L291.4,144.0 L302.5,111.2 L316.0,78.8 L332.1,47.0 L351.2,16.1 L373.4,-13.5 L398.7,-41.6 L427.0,-67.9 L458.2,-91.9 L491.9,-113.7 L527.6,-133.0 L565.0,-150.1 L603.7,-164.9 L643.1,-177.7 L683.2,-188.7 L723.6,-198.2 L764.3,-206.4 L805.2,-213.4 L846.4,-219.2 L888.0,-223.9 L930.0,-227.2 L972.4,-228.8 L1015.1,-228.6 L1057.8,-226.2 L1100.5,-221.2 L1142.6,-213.5 L1183.9,-202.9 L1223.8,-189.5 L1262.0,-173.2 L1298.3,-154.3 L1332.4,-133.0 L1364.2,-109.8 L1393.7,-85.0 L1421.1,-59.0 L1446.6,-31.9 L1470.4,-4.1 L1492.7,24.3 L1513.6,53.3 L1533.3,82.9 L1551.7,113.1 L1568.6,144.0 L1583.7,175.7 L1596.6,208.3 L1606.9,241.6 L1614.2,275.6 L1618.1,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<path d="M1653.0,310.0 L1650.6,346.3 L1644.4,382.2 L1634.5,417.5 L1621.3,452.0 L1605.3,485.5 L1586.8,518.0 L1566.2,549.5 L1544.1,580.1 L1520.5,609.8 L1495.5,638.7 L1469.3,666.9 L1441.7,694.4 L1412.5,721.0 L1381.5,746.6 L1348.5,770.8 L1313.5,793.4 L1276.3,813.9 L1237.1,832.1 L1196.0,847.5 L1153.4,860.1 L1109.6,869.5 L1064.9,875.9 L1019.9,879.3 L974.8,879.9 L930.0,878.0 L885.6,874.0 L841.9,868.1 L798.7,860.7 L756.1,851.9 L714.0,841.9 L672.3,830.6 L631.1,818.1 L590.5,804.1 L550.5,788.4 L511.5,770.8 L473.8,751.1 L437.9,729.2 L404.2,705.0 L373.2,678.5 L345.1,650.0 L320.3,619.5 L299.0,587.5 L281.0,554.3 L266.4,520.2 L254.7,485.5 L245.8,450.5 L239.3,415.4 L234.8,380.3 L232.1,345.1 L231.0,310.0 L231.4,274.8 L233.6,239.6 L237.7,204.4 L244.0,169.1 L252.9,134.0 L264.6,99.2 L279.6,65.1 L298.0,32.0 L319.8,0.2 L345.1,-30.0 L373.6,-58.2 L405.1,-84.3 L439.0,-108.3 L475.0,-130.0 L512.7,-149.5 L551.5,-167.1 L591.2,-183.0 L631.6,-197.2 L672.6,-210.2 L714.0,-221.9 L755.9,-232.4 L798.5,-241.6 L841.7,-249.4 L885.5,-255.5 L930.0,-259.6 L974.9,-261.4 L1020.1,-260.5 L1065.2,-256.8 L1109.7,-250.0 L1153.4,-240.1 L1195.8,-227.1 L1236.6,-211.2 L1275.5,-192.8 L1312.4,-172.1 L1347.3,-149.5 L1380.3,-125.4 L1411.4,-100.1 L1440.8,-73.8 L1468.8,-46.6 L1495.5,-18.7 L1521.0,10.0 L1545.1,39.5 L1567.7,69.9 L1588.5,101.4 L1607.1,134.0 L1623.2,167.6 L1636.1,202.2 L1645.6,237.7 L1651.3,273.7 L1653.0,310.0 Z" fill="none" stroke="#34d399" stroke-opacity=".13"/>
<circle cx="106.0" cy="81.0" r="5.5" fill="#8B5CF6"/>
<circle cx="98.0" cy="94.85640646055101" r="5.5" fill="#06B6D4"/>
<circle cx="82.0" cy="94.85640646055101" r="5.5" fill="#10B981"/>
<circle cx="74.0" cy="81.0" r="5.5" fill="#EC4899"/>
<circle cx="82.0" cy="67.14359353944899" r="5.5" fill="#F59E0B"/>
<circle cx="98.0" cy="67.14359353944899" r="5.5" fill="#EAB308"/>
<text x="122" y="90" font-size="26" fill="#ffffff" font-weight="700">Liberture</text>
<rect x="72" y="118" width="254" height="32" rx="16" fill="#34d399" fill-opacity=".10" stroke="#34d399" stroke-opacity=".4"/>
<text x="88" y="140" font-size="15" fill="#34d399" font-weight="600">NUTRITION PROTOCOL</text>
<text x="72" y="226" font-size="59" fill="#ffffff" font-weight="700">The Royal Flush</text>
<text x="72" y="290" font-size="27" fill="#c9c6dd" font-weight="400">Feet up. Less strain.</text>
<text x="72" y="327" font-size="27" fill="#c9c6dd" font-weight="400">A small lift can change the angle.</text>
<rect x="72" y="364" width="510" height="36" rx="10" fill="#ffffff" fill-opacity=".045"/><circle cx="92" cy="382" r="5" fill="#34d399"/>
<text x="109" y="389" font-size="21" fill="#e9e7f5" font-weight="400">Support both feet</text>
<rect x="72" y="410" width="510" height="36" rx="10" fill="#ffffff" fill-opacity=".045"/><circle cx="92" cy="428" r="5" fill="#34d399"/>
<text x="109" y="435" font-size="21" fill="#e9e7f5" font-weight="400">Raise knees above hips</text>
<rect x="72" y="456" width="510" height="36" rx="10" fill="#ffffff" fill-opacity=".045"/><circle cx="92" cy="474" r="5" fill="#34d399"/>
<text x="109" y="481" font-size="21" fill="#e9e7f5" font-weight="400">Lean forward &amp; breathe</text>
<g transform="translate(695 139)"><rect x="16" y="127" width="48" height="99" rx="10" fill="#c9c6dd" fill-opacity=".12" stroke="#8d89aa" stroke-width="2"/><path d="M40 224H212Q207 285 152 295L164 354H73L88 294Q42 279 40 224Z" fill="#c9c6dd" fill-opacity=".10" stroke="#8d89aa" stroke-width="3"/><path d="M45 219H213" stroke="#c9c6dd" stroke-width="9" stroke-linecap="round"/><g transform="translate(-28 0)"><circle cx="190" cy="40" r="29" fill="#34d399"/><path d="M175 85C161 107 149 130 147 153C147 177 156 198 174 207C183 212 192 207 204 201L255 169Q266 163 270 177L301 282" fill="none" stroke="#34d399" stroke-width="34" stroke-linejoin="round" stroke-linecap="round"/><path d="M184 103Q194 127 217 150Q223 155 234 158L263 164M300 287H337" stroke="#a7f3d0" stroke-width="16" stroke-linecap="round" fill="none"/><path d="M274 308H356M285 309L279 355M345 309L352 355" stroke="#fbbf24" stroke-width="10" stroke-linecap="round"/></g><path d="M18 364H380" stroke="#8d89aa" stroke-opacity=".4" stroke-width="2"/><path d="M248 165H355M172 211H355M349 204V173L343 180M349 173L355 180" stroke="#34d399" stroke-width="2" stroke-dasharray="4 5" fill="none"/></g>
<path d="M847 346L1015 246" stroke="#a7f3d0" stroke-opacity=".55" stroke-dasharray="4 5"/><g transform="translate(1060 162) scale(1.35) translate(-1070 -210)"><circle cx="1070" cy="210" r="69" fill="#100d29" stroke="#34d399" stroke-opacity=".65" stroke-width="2"/><path d="M1059 163C1046 194 1077 211 1076 253" stroke="#a7f3d0" stroke-width="24" fill="none"/><path d="M1059 163C1046 194 1077 211 1076 253" stroke="#100d29" stroke-width="17" fill="none"/><path d="M1040 207Q1062 233 1099 202" stroke="#fbbf24" stroke-width="9" fill="none" stroke-linecap="round"/>
</g><text x="1060" y="282" text-anchor="middle" font-size="17" fill="#a7f3d0" font-weight="400">A gentler bend</text>
<text x="72" y="595" font-size="18" fill="#8d89aa" font-weight="400">May help bowel emptying. Results vary.</text>
</svg>
```

## Validation and current status

The bilingual JSON draft was parsed successfully and the SVG was rendered to PNG/WebP and visually inspected. No database connection was configured here, so no directory records were created and nothing has been indexed on the live site. Full application validation was unavailable: ESLint configuration is missing, and TypeScript reports existing missing dependencies, stale generated route types and Prisma-client mismatches. This handoff changes no application code.
