/**
 * Seed the protocol library with a cross-linked, evidence-referenced starter set.
 * 2 protocols per pillar (canonical frontend pillar ids), each with a "why",
 * real reference sources, and relations (synergy / alternative) to other protocols.
 * Idempotent: upserts by slug; relations are skipped unless both ends exist.
 *
 * Run: pnpm exec tsx scripts/seed-marketplace-protocols.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type SeedProtocol = {
  slug: string
  name: string
  description: string
  why: string
  pillar: "work" | "sleep" | "nutrition" | "mind" | "exercise" | "finance"
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: string
  creator: string
  featured?: boolean
  steps: string[]
  benefits: string[]
  risks?: string[]
  equipment?: string[]
  references: string[]
}

const protocols: SeedProtocol[] = [
  // ————— WORK / COGNITION —————
  {
    slug: "deep-work-blocks",
    name: "Deep Work Blocks",
    description:
      "Schedule 1-2 daily blocks of 60-90 minutes of completely undistracted work on your most cognitively demanding task.",
    why:
      "Every glance at a notification leaves 'attention residue' — part of your mind stays on the interruption for many minutes afterward. Long uninterrupted blocks are the only reliable way to reach the depth where hard problems actually get solved, and 2 focused hours routinely outproduce 8 fragmented ones.",
    pillar: "work",
    difficulty: "intermediate",
    duration: "Ongoing, 60-90 min/day",
    creator: "Cal Newport (popularized)",
    featured: true,
    steps: [
      "The evening before, pick ONE demanding task for tomorrow's block",
      "Schedule a 60-90 minute block at your personal peak-focus time (for most people, morning)",
      "Phone in another room, all notifications off, single browser tab or none",
      "Work only on the chosen task; when your mind wanders, note the distraction on paper and return",
      "End the block with a 1-line note on where to resume next time",
      "Start with one block per day; add a second only after two consistent weeks",
    ],
    benefits: [
      "Meaningful progress on hard projects instead of busywork",
      "Rebuilds sustained-attention capacity eroded by constant switching",
      "Clear daily 'win' that reduces end-of-day guilt",
      "Compounds into rare, valuable skills over months",
    ],
    risks: [
      "Don't schedule blocks against your chronotype — a night owl forcing 6am blocks will fail and blame willpower",
    ],
    equipment: ["Calendar", "Paper for distraction notes"],
    references: [
      "Newport, C. — Deep Work: Rules for Focused Success in a Distracted World (2016)",
      "Leroy, S. — 'Why is it so hard to do my work? The challenge of attention residue' — Organizational Behavior and Human Decision Processes (2009)",
      "Ericsson, K.A. et al. — 'The Role of Deliberate Practice in the Acquisition of Expert Performance' — Psychological Review (1993)",
    ],
  },
  {
    slug: "pomodoro-method",
    name: "Pomodoro Method",
    description:
      "Work in 25-minute focused sprints separated by 5-minute breaks, with a longer break every 4 sprints.",
    why:
      "Task-switching carries a measurable cognitive cost, and open-ended work sessions invite it constantly. A ticking 25-minute container makes starting easy (anyone can focus for 25 minutes), makes distraction feel expensive, and the brief breaks prevent the vigilance decrement that erodes attention during long unbroken effort.",
    pillar: "work",
    difficulty: "beginner",
    duration: "Ongoing, any work session",
    creator: "Francesco Cirillo",
    steps: [
      "Write down the task you're about to work on",
      "Set a timer for 25 minutes and work on only that task",
      "If a distraction pops up, write it down and keep going",
      "When the timer rings, take a real 5-minute break — stand up, look away from screens",
      "After 4 pomodoros, take a 15-30 minute break",
      "Count your daily pomodoros; the count is your honest productivity metric",
    ],
    benefits: [
      "Dramatically lowers the barrier to starting dreaded tasks",
      "Makes procrastination visible and measurable",
      "Built-in breaks prevent burnout during long sessions",
      "Teaches realistic estimation (tasks measured in pomodoros)",
    ],
    risks: [
      "The 25-minute cap can harm tasks needing deep immersion — don't interrupt genuine flow to obey a timer",
    ],
    equipment: ["Any timer"],
    references: [
      "Cirillo, F. — The Pomodoro Technique (2006)",
      "Rubinstein, J., Meyer, D. & Evans, J. — 'Executive control of cognitive processes in task switching' — Journal of Experimental Psychology: Human Perception and Performance (2001)",
      "Ariga, A. & Lleras, A. — 'Brief and rare mental breaks keep you focused' — Cognition (2011)",
    ],
  },

  // ————— SLEEP / RECOVERY —————
  {
    slug: "morning-sunlight-exposure",
    name: "Morning Sunlight Exposure",
    description:
      "Get 10-30 minutes of outdoor light within the first hour after waking, every day.",
    why:
      "Your circadian clock is set primarily by light hitting the retina in the morning. Outdoor light — even on overcast days — is 10-100x brighter than indoor lighting and triggers the cortisol pulse that anchors wakefulness now and melatonin release ~14-16 hours later. It is the single highest-leverage, zero-cost intervention for falling asleep faster at night.",
    pillar: "sleep",
    difficulty: "beginner",
    duration: "Ongoing, 10-30 min/day",
    creator: "Circadian biology (popularized by Andrew Huberman)",
    featured: true,
    steps: [
      "Within 30-60 minutes of waking, go outside — balcony, garden, or a short walk",
      "Stay out 10 minutes on sunny days, 20-30 minutes when overcast",
      "No sunglasses during this window (never stare at the sun)",
      "Light through windows doesn't count — glass filters too much intensity",
      "If you wake before dawn, use bright artificial light and get sunlight when it rises",
    ],
    benefits: [
      "Fall asleep faster at night — melatonin timing shifts earlier",
      "More stable daytime energy and alertness",
      "Improved mood — morning light is a validated depression intervention",
      "Free, and stacks with a morning walk or coffee outside",
    ],
    equipment: [],
    references: [
      "Zeitzer, J.M. et al. — 'Sensitivity of the human circadian pacemaker to nocturnal light' — Journal of Physiology (2000)",
      "Wright, K.P. et al. — 'Entrainment of the human circadian clock to the natural light-dark cycle' — Current Biology (2013)",
      "Huberman Lab — 'Using Light (Sunlight, Blue Light & Red Light) to Optimize Health' toolkit",
    ],
  },
  {
    slug: "caffeine-cutoff",
    name: "Caffeine Cutoff",
    description:
      "Stop all caffeine 8-10 hours before your target bedtime — for an 11pm bedtime, last coffee by 1-3pm.",
    why:
      "Caffeine blocks adenosine, the molecule whose buildup creates sleep pressure. With a half-life around 5 hours, a 4pm coffee leaves half its caffeine active at 9pm — enough to measurably cut deep sleep even in people who fall asleep fine. You don't notice the stolen deep sleep; you just wake less restored and reach for more caffeine, closing the loop.",
    pillar: "sleep",
    difficulty: "beginner",
    duration: "Ongoing",
    creator: "Sleep research consensus",
    steps: [
      "Count back 8-10 hours from your usual bedtime — that's your cutoff",
      "Move your last caffeinated drink before the cutoff (coffee, tea, cola, energy drinks, pre-workout)",
      "Craving the ritual? Switch to decaf or herbal tea after the cutoff",
      "Keep total daily intake under ~400mg while you're at it",
      "Give it 2 weeks before judging — the deep-sleep rebound builds gradually",
    ],
    benefits: [
      "More deep sleep without changing bedtime",
      "Waking up genuinely restored reduces caffeine dependence itself",
      "Fewer 3am wakings with a racing mind",
    ],
    risks: [
      "Slow caffeine metabolizers may need a 12-hour cutoff",
      "Expect 3-5 days of mild withdrawal if you're also cutting total intake",
    ],
    equipment: [],
    references: [
      "Drake, C. et al. — 'Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed' — Journal of Clinical Sleep Medicine (2013)",
      "Clark, I. & Landolt, H.P. — 'Coffee, caffeine, and sleep: A systematic review' — Sleep Medicine Reviews (2017)",
      "Walker, M. — Why We Sleep, ch. 2 on adenosine and caffeine (2017)",
    ],
  },

  // ————— NUTRITION / FUELING —————
  {
    slug: "time-restricted-eating",
    name: "Time-Restricted Eating (16:8)",
    description:
      "Eat all meals within a consistent 8-10 hour daily window — e.g. 10am-6pm — and fast the rest.",
    why:
      "Your metabolism runs on a circadian schedule: the same meal is handled better earlier in the day than late at night. A consistent, earlier eating window aligns food intake with insulin sensitivity, gives digestion a long nightly break, and — for many people — reduces late-night snacking calories without any counting. The consistency matters more than the exact hours.",
    pillar: "nutrition",
    difficulty: "intermediate",
    duration: "Ongoing; 4-week trial recommended",
    creator: "Satchin Panda (research lead)",
    steps: [
      "Pick a 10-hour window that fits your life (e.g. 9am-7pm) — start generous",
      "Keep the window's START time consistent within ~1 hour, even weekends",
      "Outside the window: water, black coffee, plain tea only",
      "After 2 comfortable weeks, narrow toward 8 hours if desired",
      "Front-load: make breakfast/lunch the big meals, dinner the light one",
      "Track adherence for 4 weeks, then honestly assess energy, sleep, and weight",
    ],
    benefits: [
      "Improved insulin sensitivity, especially with an earlier window",
      "Cuts late-night snacking — usually the lowest-quality calories of the day",
      "Simpler than calorie counting — one rule, not per-food decisions",
      "Often improves sleep when eating stops 3+ hours before bed",
    ],
    risks: [
      "Not appropriate with a history of disordered eating — structure can become restriction",
      "Athletes with high energy needs may struggle to eat enough in 8 hours",
      "Honest science note: controlled trials show similar weight loss to plain calorie restriction — the window is a compliance tool, not magic",
    ],
    equipment: [],
    references: [
      "Sutton, E.F. et al. — 'Early Time-Restricted Feeding Improves Insulin Sensitivity, Blood Pressure, and Oxidative Stress' — Cell Metabolism (2018)",
      "Wilkinson, M.J. et al. — 'Ten-Hour Time-Restricted Eating Reduces Weight, Blood Pressure, and Atherogenic Lipids in Patients with Metabolic Syndrome' — Cell Metabolism (2020)",
      "Liu, D. et al. — 'Calorie Restriction with or without Time-Restricted Eating in Weight Loss' — New England Journal of Medicine (2022)",
      "Panda, S. — The Circadian Code (2018)",
    ],
  },
  {
    slug: "protein-first-breakfast",
    name: "Protein-First Breakfast",
    description:
      "Make your first meal of the day deliver 30-40g of protein — eggs, Greek yogurt, fish, or a quality shake.",
    why:
      "Muscle protein synthesis responds meal-by-meal, and most people eat a protein-poor breakfast, an okay lunch, and a protein-heavy dinner — leaving the morning stimulus on the table. A high-protein first meal also outperforms carb-heavy breakfasts on satiety, measurably reducing evening snacking. Distributing protein across the day beats cramming it into dinner.",
    pillar: "nutrition",
    difficulty: "beginner",
    duration: "Ongoing",
    creator: "Sports nutrition consensus",
    steps: [
      "Target 30-40g protein in your first meal (3 eggs + Greek yogurt ≈ 35g)",
      "Prep ahead: boiled eggs, overnight yogurt bowls, or a shake recipe you like",
      "Eat protein first within the meal if appetite is small in the morning",
      "Not a breakfast person? This becomes the rule for whenever your FIRST meal happens",
      "Keep 3 go-to options rotating so it never requires thought",
    ],
    benefits: [
      "Noticeably stronger satiety through the morning — fewer cravings all day",
      "Supports muscle retention, especially past age 30",
      "Stabler blood glucose vs. a carb-first breakfast",
      "Pairs naturally with resistance training for body-composition goals",
    ],
    equipment: [],
    references: [
      "Leidy, H.J. et al. — 'Beneficial effects of a higher-protein breakfast on the appetitive, hormonal, and neural signals controlling energy intake regulation' — American Journal of Clinical Nutrition (2013)",
      "Mamerow, M.M. et al. — 'Dietary protein distribution positively influences 24-h muscle protein synthesis in healthy adults' — Journal of Nutrition (2014)",
      "Paddon-Jones, D. & Rasmussen, B. — 'Dietary protein recommendations and the prevention of sarcopenia' — Current Opinion in Clinical Nutrition and Metabolic Care (2009)",
    ],
  },

  // ————— MIND / MENTAL —————
  {
    slug: "daily-mindfulness-meditation",
    name: "Daily Mindfulness Meditation",
    description:
      "Sit for 10 minutes daily, attention on the breath; when the mind wanders, notice and return — that return IS the exercise.",
    why:
      "Meta-analyses show mindfulness programs produce moderate, reliable improvements in anxiety, depression, and stress — comparable to what many medications achieve, with zero side effects. Mechanistically you're training one repeatable move: noticing that attention drifted and bringing it back. That same move is what you need mid-argument, mid-craving, and mid-distraction.",
    pillar: "mind",
    difficulty: "beginner",
    duration: "Ongoing, 10 min/day",
    creator: "Contemplative traditions; secularized by Jon Kabat-Zinn",
    featured: true,
    steps: [
      "Anchor it to an existing habit — right after morning coffee, same chair, same time",
      "Set a 10-minute timer (start with 5 if 10 feels long)",
      "Sit comfortably, eyes closed or half-open, attention on the breath at the nostrils",
      "Mind wanders (it will, constantly) → notice without judgment → return to breath",
      "Count 'one rep' each return — reps are the workout, not unbroken calm",
      "Track only attendance: did you sit today? Streaks of showing up, not quality",
    ],
    benefits: [
      "Reduced anxiety and rumination with 8 weeks of practice",
      "Faster recovery from emotional spikes",
      "Improved sustained attention that transfers to work",
      "Better sleep onset — the wandering-mind skill works at bedtime too",
    ],
    risks: [
      "A small minority experience increased distress; trauma histories warrant a teacher-guided approach",
    ],
    equipment: ["Timer or any meditation app"],
    references: [
      "Goyal, M. et al. — 'Meditation Programs for Psychological Stress and Well-being: A Systematic Review and Meta-analysis' — JAMA Internal Medicine (2014)",
      "Basso, J.C. et al. — 'Brief, daily meditation enhances attention, memory, mood, and emotional regulation in non-experienced meditators' — Behavioural Brain Research (2019)",
      "Kabat-Zinn, J. — Full Catastrophe Living (1990)",
    ],
  },
  {
    slug: "gratitude-journaling",
    name: "Gratitude Journaling",
    description:
      "Three times a week, write down 3 specific things that went well and briefly why they happened.",
    why:
      "Memory retrieval is trainable: what you repeatedly recall becomes what you habitually notice. Deliberately retrieving positive specifics counteracts the brain's negativity bias — the tendency to rehearse threats and losses. Trials show modest but real improvements in life satisfaction and mood; the effect comes from specificity ('Marta covered my shift') not vague listing ('my friends').",
    pillar: "mind",
    difficulty: "beginner",
    duration: "Ongoing, 5 min × 3/week",
    creator: "Robert Emmons & Michael McCullough (research)",
    steps: [
      "Keep a notebook by your bed or a note file on your phone",
      "3 evenings a week, write 3 things that went well that day",
      "Be specific: name the person, the moment, the detail",
      "Add one line on WHY each happened — this is what deepens the effect",
      "Don't repeat entries; hunting for new material is the actual training",
    ],
    benefits: [
      "Measurably higher life satisfaction over 6-10 weeks",
      "Falls asleep easier — pre-sleep cognition shifts from worries to positives",
      "Antidote to hedonic adaptation ('I have things good and feel nothing')",
      "5 minutes, zero equipment, works when motivation is low",
    ],
    risks: [
      "Effects are modest — this is a supplement to, not substitute for, treating clinical depression",
    ],
    equipment: ["Notebook or notes app"],
    references: [
      "Emmons, R.A. & McCullough, M.E. — 'Counting blessings versus burdens: An experimental investigation of gratitude and subjective well-being in daily life' — Journal of Personality and Social Psychology (2003)",
      "Wood, A.M. et al. — 'Gratitude and well-being: A review and theoretical integration' — Clinical Psychology Review (2010)",
      "Davis, D.E. et al. — 'Thankful for the little things: A meta-analysis of gratitude interventions' — Journal of Counseling Psychology (2016)",
    ],
  },

  // ————— EXERCISE / PHYSICALITY —————
  {
    slug: "daily-walking-baseline",
    name: "Daily Walking Baseline",
    description:
      "Build a floor of 7,000-8,000 steps a day, accumulated any way — commute, calls, errands, or dedicated walks.",
    why:
      "The largest step-count meta-analyses show mortality risk dropping steeply up to ~7,000-8,000 daily steps (the famous 10,000 was a pedometer marketing number, not science). Walking is the exercise with the lowest injury risk, zero cost, no scheduling overhead — which makes it the most sustainable. The best protocol is the one still running in 5 years.",
    pillar: "exercise",
    difficulty: "beginner",
    duration: "Ongoing",
    creator: "Epidemiology consensus",
    featured: true,
    steps: [
      "Check your current daily average (any phone counts steps) — that's your baseline",
      "Add 1,000 steps/day each week until you're consistently at 7,000-8,000",
      "Attach walks to existing life: take calls walking, park farther, one stop early",
      "One dedicated 20-30 min walk daily covers roughly 3,000 steps on its own",
      "Below-average day? Fine. Watch the weekly average, not single days",
    ],
    benefits: [
      "Steep mortality-risk reduction up to ~8k steps/day",
      "Joint-friendly and sustainable at any fitness level",
      "Walking meetings and calls turn dead time into training",
      "Outdoor walks stack with morning light exposure",
    ],
    equipment: ["Phone or any step counter"],
    references: [
      "Paluch, A.E. et al. — 'Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts' — The Lancet Public Health (2022)",
      "Saint-Maurice, P.F. et al. — 'Association of Daily Step Count and Step Intensity With Mortality Among US Adults' — JAMA (2020)",
      "Tudor-Locke, C. et al. — 'How many steps/day are enough? For adults' — International Journal of Behavioral Nutrition and Physical Activity (2011)",
    ],
  },
  {
    slug: "resistance-training-basics",
    name: "Resistance Training Basics",
    description:
      "Two full-body strength sessions per week — 5-6 compound movements, 2-3 hard sets each, progressively loaded.",
    why:
      "Muscle-strengthening activity is independently associated with 10-17% lower all-cause mortality — on top of cardio's benefits, not instead of them. Muscle is also your glucose sink, your fall protection after 60, and the tissue you lose ~1%/year from your 30s onward unless you signal your body to keep it. Two sessions a week captures most of the benefit.",
    pillar: "exercise",
    difficulty: "intermediate",
    duration: "Ongoing, 2 × 45 min/week",
    creator: "WHO guidelines / strength training consensus",
    steps: [
      "Schedule 2 non-consecutive days (e.g. Mon/Thu), 40-50 minutes each",
      "Each session: one push (press), one pull (row), one squat pattern, one hinge (deadlift/hip thrust), one carry or core",
      "2-3 sets of 5-10 reps, ending each set 1-2 reps short of failure",
      "Add small weight or a rep when all sets hit the top of the range — that's progressive overload",
      "New to lifting? Spend 2-4 weeks learning movements with light weight or bodyweight first",
      "Log every session — weight × reps; the log IS the program",
    ],
    benefits: [
      "10-17% lower all-cause mortality independent of aerobic exercise",
      "Preserves muscle and bone through aging — the strongest fall/fracture insurance",
      "Improves insulin sensitivity — muscle is the body's largest glucose sink",
      "Visible body-composition change within 8-12 weeks with adequate protein",
    ],
    risks: [
      "Form before load, always — ego lifting is the main injury source",
      "Existing joint/cardiac conditions: get cleared and coached first",
    ],
    equipment: ["Gym access, or adjustable dumbbells + bands at home"],
    references: [
      "Momma, H. et al. — 'Muscle-strengthening activities are associated with lower risk and mortality in major non-communicable diseases: a systematic review and meta-analysis' — British Journal of Sports Medicine (2022)",
      "WHO — Guidelines on Physical Activity and Sedentary Behaviour (2020)",
      "Westcott, W.L. — 'Resistance training is medicine: effects of strength training on health' — Current Sports Medicine Reports (2012)",
    ],
  },

  // ————— FINANCE —————
  {
    slug: "pay-yourself-first",
    name: "Pay Yourself First",
    description:
      "Automate a fixed transfer to savings/investments the day your income lands — before any spending happens.",
    why:
      "Willpower-based saving fails because it asks you to make the right choice hundreds of times a month; automation asks you to make it once. Behavioral economics is unambiguous here: defaults beat intentions. Auto-enrollment studies show participation jumping from ~49% to ~86% with no change in what people 'wanted'. Spending then adapts to what remains — Parkinson's law working for you instead of against you.",
    pillar: "finance",
    difficulty: "beginner",
    duration: "One-time setup, ongoing",
    creator: "Behavioral economics (Thaler & Benartzi's research)",
    featured: true,
    steps: [
      "Pick a starting rate — even 5% of income; the habit matters more than the amount",
      "Set an automatic transfer dated the day AFTER income arrives",
      "Send it somewhere with friction — separate savings or investment account, not your card account",
      "Increase by 1% every 3-6 months or with every raise (you'll barely notice)",
      "First 3 months' target: 1 month of expenses as emergency buffer, then start investing",
    ],
    benefits: [
      "Saving happens by default — bad months can't zero it out",
      "Removes the monthly willpower battle entirely",
      "Rate increases tied to raises make growth painless",
      "Compounds: 10% automated from age 30 is a fundamentally different retirement",
    ],
    risks: [
      "Set the rate too high and you'll raid savings monthly, teaching yourself the system 'doesn't work' — start low, ratchet up",
    ],
    equipment: ["Bank account with automatic transfers"],
    references: [
      "Thaler, R.H. & Benartzi, S. — 'Save More Tomorrow: Using Behavioral Economics to Increase Employee Saving' — Journal of Political Economy (2004)",
      "Madrian, B.C. & Shea, D.F. — 'The Power of Suggestion: Inertia in 401(k) Participation and Savings Behavior' — Quarterly Journal of Economics (2001)",
      "Housel, M. — The Psychology of Money (2020)",
    ],
  },
  {
    slug: "weekly-money-review",
    name: "Weekly Money Review",
    description:
      "A 15-minute weekly appointment with your accounts: what came in, what went out, anything surprising, anything upcoming.",
    why:
      "Most financial damage isn't dramatic — it's drift: subscription creep, category inflation, a card balance quietly growing. Monthly reviews catch drift 4x slower and each session is 4x more painful, so people skip them. A short weekly cadence keeps every number small, every correction cheap, and kills the low-grade money anxiety that comes from not looking.",
    pillar: "finance",
    difficulty: "beginner",
    duration: "Ongoing, 15 min/week",
    creator: "Personal finance consensus",
    steps: [
      "Book a recurring 15-min calendar slot — same day, same time (Sunday evening works)",
      "Scan every account and card transaction from the week",
      "Flag surprises: unrecognized charges, subscriptions you forgot, categories running hot",
      "Look one week ahead: any bills, renewals, or irregular expenses coming?",
      "One action max per review (cancel X, move Y) — keep it 15 minutes, not a project",
      "End with one number: net saved or overspent this week",
    ],
    benefits: [
      "Catches subscription creep and billing errors within days, not months",
      "Replaces vague money anxiety with a concrete weekly number",
      "Makes the pay-yourself-first rate obvious to tune",
      "15 minutes — short enough to survive busy weeks",
    ],
    equipment: ["Banking app or a simple spreadsheet"],
    references: [
      "Consumer Financial Protection Bureau — 'Track your spending' toolkit",
      "Robin, V. & Dominguez, J. — Your Money or Your Life (1992, rev. 2018)",
      "Soll, J.B., Keeney, R.L. & Larrick, R.P. — 'Consumer misunderstanding of credit card use, payments, and debt' — Journal of Public Policy & Marketing (2013)",
    ],
  },
]

type SeedRelation = {
  from: string
  to: string
  kind: "synergy" | "alternative"
  note: string
}

const relations: SeedRelation[] = [
  {
    from: "deep-work-blocks",
    to: "pomodoro-method",
    kind: "alternative",
    note: "Same subject — focused work — different containers. Pomodoro's 25-minute sprints suit fragmented days and shallow-to-medium tasks; 90-minute blocks suit long, cognitively demanding projects. A common path: build the focus muscle on Pomodoro, then graduate to blocks.",
  },
  {
    from: "daily-mindfulness-meditation",
    to: "deep-work-blocks",
    kind: "synergy",
    note: "Meditation trains exactly the move deep work depends on: noticing your attention drifted and returning it. Ten minutes on the cushion is rep training for every wander during a work block.",
  },
  {
    from: "morning-sunlight-exposure",
    to: "caffeine-cutoff",
    kind: "synergy",
    note: "They attack sleep from opposite ends of the day: morning light anchors the circadian clock, the cutoff protects nighttime adenosine buildup. Together they cover the full 24-hour cycle — a strong minimal sleep stack.",
  },
  {
    from: "morning-sunlight-exposure",
    to: "daily-walking-baseline",
    kind: "synergy",
    note: "Take the morning walk outdoors and both protocols complete in a single habit — the light sets your clock while ~2-3k steps bank toward the daily floor.",
  },
  {
    from: "time-restricted-eating",
    to: "protein-first-breakfast",
    kind: "synergy",
    note: "They can conflict if 16:8 means skipping breakfast — resolve it by opening the eating window with the 30-40g-protein meal. You keep the compressed window AND the morning protein stimulus.",
  },
  {
    from: "protein-first-breakfast",
    to: "resistance-training-basics",
    kind: "synergy",
    note: "Training provides the muscle-protein-synthesis stimulus; distributed protein provides the substrate. Each roughly doubles the return on the other — this is the classic body-composition pairing.",
  },
  {
    from: "daily-walking-baseline",
    to: "resistance-training-basics",
    kind: "synergy",
    note: "Walking builds the aerobic floor, lifting preserves muscle and bone — they cover different systems with almost no overlap. Steps daily + two lifts a week is a complete minimalist week of training.",
  },
  {
    from: "daily-mindfulness-meditation",
    to: "gratitude-journaling",
    kind: "synergy",
    note: "Different mechanisms, same direction: meditation trains in-the-moment attention regulation; gratitude retrains what memory retrieves afterward. Five minutes each covers both angles of mental fitness.",
  },
  {
    from: "pay-yourself-first",
    to: "weekly-money-review",
    kind: "synergy",
    note: "Automation handles the saving; the review catches what automation can't see — subscription creep, drift, upcoming irregular expenses — and tells you when the automated rate is ready to ratchet up.",
  },
  {
    from: "caffeine-cutoff",
    to: "time-restricted-eating",
    kind: "synergy",
    note: "The eating window naturally bounds caffeine too: close the window by mid-afternoon and the caffeine cutoff happens for free. One schedule, two protocols satisfied.",
  },
  // Relations to pre-existing library protocols (skipped automatically if absent)
  {
    from: "morning-sunlight-exposure",
    to: "huberman-sleep-protocol",
    kind: "alternative",
    note: "Morning light is the first and highest-leverage pillar of the full Huberman sleep protocol. Start here if the complete 7-habit protocol feels like too much; graduate to the full stack once this is automatic.",
  },
  {
    from: "resistance-training-basics",
    to: "zone-2-training",
    kind: "synergy",
    note: "Strength and aerobic base are complementary adaptations — lifting doesn't build mitochondria, cardio doesn't preserve muscle. Two lifts plus two or three zone-2 sessions is a complete training week.",
  },
  {
    from: "daily-walking-baseline",
    to: "zone-2-training",
    kind: "alternative",
    note: "Both build aerobic health. Walking is the floor: free, joint-friendly, no scheduling. Zone 2 is the structured upgrade when you want measurable cardiovascular adaptation. Start with steps; add zone 2 when you want more.",
  },
]

async function main() {
  let created = 0
  let updated = 0
  for (const p of protocols) {
    const data = {
      name: p.name,
      description: p.description,
      why: p.why,
      pillar: p.pillar,
      creator: p.creator,
      duration: p.duration,
      difficulty: p.difficulty,
      steps: JSON.stringify(p.steps),
      benefits: JSON.stringify(p.benefits),
      risks: p.risks?.length ? JSON.stringify(p.risks) : null,
      equipment: p.equipment?.length ? JSON.stringify(p.equipment) : null,
      references: JSON.stringify(p.references),
      featured: p.featured ?? false,
      published: true,
    }
    const existing = await prisma.protocol.findUnique({ where: { slug: p.slug } })
    await prisma.protocol.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    })
    existing ? updated++ : created++
  }
  console.log(`Protocols: ${created} created, ${updated} updated`)

  let relCreated = 0
  let relSkipped = 0
  for (const r of relations) {
    const [from, to] = await Promise.all([
      prisma.protocol.findUnique({ where: { slug: r.from }, select: { slug: true } }),
      prisma.protocol.findUnique({ where: { slug: r.to }, select: { slug: true } }),
    ])
    if (!from || !to) {
      relSkipped++
      continue
    }
    await prisma.protocolRelation.upsert({
      where: { fromSlug_toSlug_kind: { fromSlug: r.from, toSlug: r.to, kind: r.kind } },
      update: { note: r.note },
      create: { fromSlug: r.from, toSlug: r.to, kind: r.kind, note: r.note },
    })
    relCreated++
  }
  console.log(`Relations: ${relCreated} upserted, ${relSkipped} skipped (missing endpoint)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
