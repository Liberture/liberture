import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function addBlueprintProtocols() {
  console.log('🔬 Adding Bryan Johnson Blueprint Protocols...\n');

  const bryanSlug = 'bryan-johnson';

  // Verify Bryan Johnson exists
  const bryan = await prisma.person.findUnique({
    where: { slug: bryanSlug },
  });

  if (!bryan) {
    console.error('❌ Bryan Johnson not found in database');
    return;
  }

  console.log(`✅ Found Bryan Johnson: ${bryan.name}\n`);

  const protocols = [
    {
      name: 'Blueprint Sleep Protocol',
      slug: 'blueprint-sleep-protocol',
      description: 'Bryan Johnson\'s data-driven sleep optimization routine achieving perfect sleep scores and biological age reversal through precise timing, environment control, and recovery tracking.',
      pillar: 'Recovery',
      creator: bryanSlug,
      difficulty: 'intermediate',
      duration: '8-9 hours nightly',
      steps: JSON.stringify([
        'Complete all meals by 11:00 AM (13+ hour fast before sleep)',
        'Dim all lights and reduce blue light exposure after 6:00 PM',
        'Take sleep stack supplements: melatonin (300mcg), magnesium threonate, L-theanine',
        'Wear blue light blocking glasses 2 hours before bed',
        'Set bedroom temperature to 60-67°F (15-19°C)',
        'Use blackout curtains and eliminate all light sources',
        'Go to bed at 8:30 PM consistently (same time every night)',
        'Track sleep with Oura Ring and Eight Sleep Pod',
        'Wake naturally after 8+ hours without alarm when possible',
        'Expose eyes to bright light immediately upon waking',
      ]),
      benefits: JSON.stringify([
        'Perfect sleep scores (95-100/100 on sleep trackers)',
        'Deep sleep percentage increased to 20-25% (vs 10-15% average)',
        'Biological age markers reversed by multiple years',
        'Enhanced cognitive performance and decision-making',
        'Optimized growth hormone and melatonin production',
        'Reduced inflammation and accelerated cellular repair',
        'Consistent energy levels throughout the day',
        'Improved insulin sensitivity and metabolic health',
      ]),
      risks: JSON.stringify([
        'Requires strict schedule adherence (social life impacts)',
        'Early bedtime (8:30 PM) may conflict with work/family',
        '13-hour fast can be challenging initially',
        'Significant upfront cost for tracking devices ($500-2000)',
        'May require job flexibility or lifestyle changes',
      ]),
      equipment: JSON.stringify([
        'Oura Ring (sleep tracking)',
        'Eight Sleep Pod (temperature control)',
        'Blue light blocking glasses',
        'Blackout curtains',
        'Red light bulbs or fixtures',
        'Bedroom thermometer',
        'Sleep supplements (melatonin, magnesium, L-theanine)',
      ]),
      featured: true,
    },
    {
      name: 'Blueprint Nutrition Protocol',
      slug: 'blueprint-nutrition-protocol',
      description: 'Bryan Johnson\'s algorithmic vegan nutrition system with 100+ supplements, precise meal timing, and 2,250 calories daily to achieve optimal biomarkers and reverse biological aging.',
      pillar: 'Fueling',
      creator: bryanSlug,
      difficulty: 'advanced',
      duration: 'Daily (3 meals by 11 AM)',
      steps: JSON.stringify([
        'Wake at 5:00 AM and consume first meal immediately',
        'Meal 1 (Super Veggie): Broccoli, cauliflower, black lentils, garlic, ginger, lime, hemp seeds, extra virgin olive oil (300 cal)',
        'Meal 2 (Nutty Pudding): Macadamia nuts, walnuts, flaxseed, Brazil nuts, cocoa, cinnamon, pomegranate juice, pea protein (500 cal)',
        'Meal 3 (by 11:00 AM): Sweet potato, vegetables, berries, ezekiel bread, extra virgin olive oil (450 cal)',
        'Take 100+ supplements across 3 doses (morning, midday, evening)',
        'Consume 1 tablespoon extra virgin olive oil with each meal',
        'Drink precise amounts of water throughout day (no arbitrary amounts)',
        'Fast for 13+ hours (11 AM to next morning)',
        'Track all biomarkers weekly (blood glucose, inflammation, lipids)',
        'Adjust protocol based on continuous data feedback',
      ]),
      benefits: JSON.stringify([
        'Perfect liver fat levels (0%)',
        'Inflammation reduced 66% below average 10-year-old',
        'Heart function equivalent to 37-year-old (at age 45+)',
        'Biological age reversal of 5.1 years',
        'Optimal cognitive function and mental clarity',
        'Stabilized blood sugar and insulin sensitivity',
        'Enhanced gut microbiome diversity',
        'Reduced oxidative stress and cellular damage',
        'Optimal nutrient levels across all markers',
      ]),
      risks: JSON.stringify([
        'Extremely restrictive and socially isolating',
        'Requires precise meal prep and timing (3-4 hours daily)',
        'Supplement stack costs $1,500-2,000/month',
        'Risk of nutrient deficiencies without proper monitoring',
        'May trigger orthorexia or unhealthy food relationships',
        'Requires continuous blood work and biomarker testing',
        'Not suitable for children, pregnant women, or certain conditions',
      ]),
      equipment: JSON.stringify([
        '100+ pharmaceutical-grade supplements',
        'High-speed blender (Vitamix or equivalent)',
        'Food scale (gram precision)',
        'Glass meal prep containers',
        'Continuous glucose monitor (CGM)',
        'Blood testing kit (InsideTracker or similar)',
        'Extra virgin olive oil (high-quality, tested)',
        'Organic whole food ingredients',
      ]),
      featured: true,
    },
    {
      name: 'Blueprint Exercise Protocol',
      slug: 'blueprint-exercise-protocol',
      description: 'Bryan Johnson\'s data-optimized fitness routine combining high-intensity interval training, strength work, and recovery to achieve 18-year-old fitness levels at age 45+.',
      pillar: 'Physicality',
      creator: bryanSlug,
      difficulty: 'advanced',
      duration: '1 hour daily (6 days/week)',
      steps: JSON.stringify([
        'Monday: High-Intensity Interval Training (25 min biking, 180+ bpm heart rate)',
        'Tuesday: Strength training - Back, biceps, legs (7 exercises, 3 sets each)',
        'Wednesday: HIIT + Core work',
        'Thursday: Strength training - Chest, shoulders, triceps (7 exercises)',
        'Friday: HIIT + Flexibility',
        'Saturday: Full body strength + Recovery',
        'Sunday: Complete rest (recovery day)',
        'Track all workouts with heart rate monitor and performance metrics',
        'Maintain heart rate zones: Zone 2 (120-140 bpm) and Zone 5 (180+ bpm)',
        'Follow with red light therapy and recovery protocol',
      ]),
      benefits: JSON.stringify([
        'VO2 max in top 1.5% for age group',
        'Physical fitness equivalent to 18-year-old',
        'Muscle mass preserved while maintaining low body fat (5-8%)',
        'Enhanced cardiovascular health (37-year-old heart at 45+)',
        'Optimized testosterone and growth hormone levels',
        'Improved bone density and injury resistance',
        'Consistent energy and stamina throughout day',
        'Reduced biological aging markers',
      ]),
      risks: JSON.stringify([
        'High-intensity training can cause injury without proper form',
        'Requires significant time commitment (7+ hours/week)',
        'Risk of overtraining if recovery is insufficient',
        'May exacerbate existing joint or cardiovascular issues',
        'Expensive equipment and gym membership required',
      ]),
      equipment: JSON.stringify([
        'Heart rate monitor (chest strap or watch)',
        'Stationary bike (high-quality)',
        'Weight training equipment (dumbbells, barbells, machines)',
        'Yoga mat',
        'Resistance bands',
        'Red light therapy panel (Joovv or equivalent)',
        'Theragun or massage gun',
        'Blood flow restriction (BFR) bands (optional)',
      ]),
      featured: true,
    },
    {
      name: 'Blueprint Longevity Stack',
      slug: 'blueprint-longevity-stack',
      description: 'Bryan Johnson\'s comprehensive supplement and therapy protocol using 100+ supplements, shockwave therapy, plasma exchanges, and advanced biomarker tracking for radical life extension.',
      pillar: 'Cognition',
      creator: bryanSlug,
      difficulty: 'expert',
      duration: 'Daily + monthly therapies',
      steps: JSON.stringify([
        'Morning stack: 30+ supplements including NAD+ boosters, metformin, acarbose, rapamycin',
        'Midday stack: 40+ supplements including antioxidants, anti-inflammatories, nootropics',
        'Evening stack: 30+ supplements including sleep aids, recovery compounds',
        'Weekly: Shockwave therapy for muscle recovery and blood flow',
        'Monthly: Comprehensive blood work (100+ biomarkers)',
        'Quarterly: MRI scans of 70+ organs',
        'Bi-annually: Plasma exchange (1 liter of plasma replacement)',
        'Daily: Red light therapy (10-20 minutes)',
        'Daily: Continuous glucose monitoring and HRV tracking',
        'Annual: Full genome sequencing and epigenetic age testing',
      ]),
      benefits: JSON.stringify([
        'Biological age reversal of 5.1 years',
        'Epigenetic age reduced to late 20s (at chronological age 45+)',
        'Slowed aging rate to 0.76 years per calendar year',
        'Cognitive performance in top 1% for age',
        'Eliminated 90% of gray hair',
        'Inflammation markers 66% below 10-year-old average',
        'Perfect organ function across 70+ measured systems',
        'Enhanced mitochondrial function and cellular health',
      ]),
      risks: JSON.stringify([
        'Extremely expensive ($2 million/year for full protocol)',
        'Many therapies are experimental with limited long-term data',
        'Risk of adverse supplement interactions',
        'Plasma exchanges carry infection and reaction risks',
        'Requires medical team supervision',
        'May not be legal or available in all jurisdictions',
        'Time commitment of 10-15 hours/week for protocols',
      ]),
      equipment: JSON.stringify([
        '100+ pharmaceutical-grade supplements',
        'Continuous glucose monitor (CGM)',
        'HRV tracking device (Oura Ring, Whoop)',
        'Red light therapy panel',
        'Shockwave therapy device (or clinic access)',
        'Blood testing lab partnership',
        'MRI and imaging facility access',
        'Medical team (doctors, nutritionists, coaches)',
        'Data tracking and analysis software',
      ]),
      featured: true,
    },
    {
      name: 'Blueprint Measurement Protocol',
      slug: 'blueprint-measurement-protocol',
      description: 'Bryan Johnson\'s obsessive data tracking system measuring 70+ organs, 100+ biomarkers, and continuous health metrics to optimize every aspect of human performance.',
      pillar: 'Mental',
      creator: bryanSlug,
      difficulty: 'intermediate',
      duration: 'Continuous + weekly reviews',
      steps: JSON.stringify([
        'Wear continuous glucose monitor (CGM) 24/7',
        'Wear Oura Ring for sleep, HRV, and activity tracking',
        'Track meals, supplements, and exact timing in app',
        'Weekly: Comprehensive blood panel (100+ biomarkers)',
        'Monthly: VO2 max testing and fitness assessments',
        'Quarterly: Full MRI scan of 70+ organs',
        'Quarterly: DEXA scan for body composition',
        'Daily: Blood pressure, weight, body temperature',
        'Annual: Genome sequencing and epigenetic age testing',
        'Review all data weekly and adjust protocols accordingly',
      ]),
      benefits: JSON.stringify([
        'Complete visibility into health status at all times',
        'Early detection of any declining biomarkers',
        'Ability to test and optimize interventions precisely',
        'Data-driven decision making (no guesswork)',
        'Motivation through visible progress tracking',
        'Identification of personal optimal ranges',
        'Peace of mind from comprehensive monitoring',
      ]),
      risks: JSON.stringify([
        'Can become obsessive or anxiety-inducing',
        'Extremely expensive ($50,000-100,000/year for full protocol)',
        'Time-consuming data review and analysis',
        'Risk of over-optimization and analysis paralysis',
        'May detect false positives causing unnecessary worry',
        'Not practical for most people (cost/access)',
      ]),
      equipment: JSON.stringify([
        'Continuous glucose monitor (Dexcom, FreeStyle Libre)',
        'Oura Ring or Whoop strap',
        'Blood pressure monitor',
        'Smart scale (Withings, FitTrack)',
        'Thermometer',
        'Blood testing partnership (LabCorp, Quest, InsideTracker)',
        'MRI and imaging facility access',
        'DEXA scan facility',
        'Genome sequencing service (23andMe Medical, Nebula)',
        'Data tracking software/dashboard',
      ]),
      featured: false,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const protocol of protocols) {
    try {
      // Check if already exists
      const existing = await prisma.protocol.findUnique({
        where: { slug: protocol.slug },
      });

      if (existing) {
        console.log(`⏭️  ${protocol.name} - Already exists`);
        skipped++;
        continue;
      }

      await prisma.protocol.create({
        data: {
          id: randomUUID(),
          ...protocol,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`✅ ${protocol.name} - Created`);
      created++;
    } catch (error) {
      console.error(`❌ ${protocol.name} - Error:`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📝 Total: ${protocols.length}`);

  // Now update Bryan Johnson's bio with the AI-enriched version
  console.log(`\n\n📝 Applying AI-enriched bio to Bryan Johnson...`);
  
  const enrichedBio = `Bryan Johnson **revolutionizes human optimization** by treating his body as a startup ripe for disruption, pouring $2 million annually into the **Blueprint protocol**—a data-driven algorithm that slashes his biological aging to just 277 days per year.

From the ashes of chronic depression, nightly overeating, and entrepreneurial burnout after selling Braintree (and Venmo) to PayPal for $800 million, Johnson pivots boldly. He emerges as the **most measured human in history**, tracking every biomarker across 70+ organs with MRI scans, blood tests, and brain interfaces from his company Kernel. His **breakthrough insight**: Trust algorithms over intuition. Blueprint synthesizes thousands of scientific studies into precise protocols—vegan fueling with three meals ending at 11 a.m., 100+ supplements, shockwave therapy, stem cell injections, and plasma exchanges—that deliver jaw-dropping results: a heart functioning like a 37-year-old's (at age 45+), inflammation 66% below a 10-year-old's, 80% less gray hair, perfect liver fat, and 18-year-old fitness levels.

Johnson **democratizes longevity**, sharing every recipe, workout, and dataset for free online, inspiring biohackers worldwide to reverse epigenetic age by 5.1 years without his budget. He funds family experiments, like multi-generational plasma swaps that shaved 25 years off his father's biological clock using his "super blood." Through Blueprint's $60 million raise from Silicon Valley elites, he scales **practical tools**—olive oils, supplements, fasting windows (10-16 hours)—that anyone applies for sharper cognition, faster recovery, and peak physicality.

In Johnson's world, death becomes optional. He **rewrites life's OS**, proving quantified self-tracking and protocol optimization unlock god-like performance, fueling consciousness expansion and radical life extension for all.`;

  await prisma.person.update({
    where: { slug: bryanSlug },
    data: {
      bio: enrichedBio,
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Bio updated (${enrichedBio.length} characters)`);
  console.log(`\n🎉 Done! Bryan Johnson now has 5 Blueprint protocols linked to his profile.`);
  console.log(`\n🌐 View at: https://liberture.com/people/bryan-johnson`);

  await prisma.$disconnect();
}

addBlueprintProtocols();
