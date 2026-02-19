/**
 * GymBear Exercise Library
 * PRD Section 4 — User-Verified Exercise List
 * 24 exercises across 6 muscle groups.
 * These are the ONLY exercises the app will ever suggest or plan around.
 */

export type MuscleGroup = 'chest' | 'shoulders' | 'triceps' | 'biceps' | 'back' | 'legs'

export type Equipment =
  | 'chest_press_machine_flat'
  | 'chest_press_machine_incline'
  | 'chest_press_machine_upright'
  | 'dumbbells'
  | 'lat_pulldown_bar_wide'
  | 'lat_pulldown_bar_shoulder'
  | 'lat_pulldown_vbar'
  | 'lat_pulldown_underhand'
  | 'lat_pulldown_neutral'
  | 'leg_extension_machine'
  | 'leg_curl_machine'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  equipment: Equipment
  equipmentNote: string
  tips: string
  defaultSets: number
  defaultReps: number
  isCompound: boolean          // compound = 90s rest, isolation = 60s rest (PRD 5.3)
}

// PRD Section 4.1 — Chest (4 exercises)
const chestExercises: Exercise[] = [
  {
    id: 'flat_machine_press',
    name: 'Flat Seated Machine Press',
    muscleGroup: 'chest',
    equipment: 'chest_press_machine_flat',
    equipmentNote: 'Chest Press Machine — Flat position',
    tips: 'Keep chest up, squeeze at full extension. Control the negative.',
    defaultSets: 3,
    defaultReps: 10,
    isCompound: true,
  },
  {
    id: 'incline_machine_press',
    name: 'Incline Seated Machine Press',
    muscleGroup: 'chest',
    equipment: 'chest_press_machine_incline',
    equipmentNote: 'Chest Press Machine — Incline position',
    tips: 'Targets upper chest. Drive elbows back on the way down.',
    defaultSets: 3,
    defaultReps: 10,
    isCompound: true,
  },
  {
    id: 'db_chest_press_flat',
    name: 'Dumbbell Chest Press (Flat)',
    muscleGroup: 'chest',
    equipment: 'dumbbells',
    equipmentNote: 'Dumbbells — performed on floor or machine bench',
    tips: 'Floor press limits range of motion — great for heavy loads. Keep wrists neutral.',
    defaultSets: 3,
    defaultReps: 10,
    isCompound: true,
  },
  {
    id: 'db_chest_press_incline',
    name: 'Dumbbell Chest Press (Incline)',
    muscleGroup: 'chest',
    equipment: 'chest_press_machine_incline',
    equipmentNote: 'Dumbbells — chest machine reclined as backrest',
    tips: 'Use the chest machine as an incline backrest. Targets upper chest. Control descent.',
    defaultSets: 3,
    defaultReps: 10,
    isCompound: true,
  },
]

// PRD Section 4.2 — Shoulders (3 exercises)
const shoulderExercises: Exercise[] = [
  {
    id: 'machine_shoulder_press',
    name: 'Seated Machine Shoulder Press',
    muscleGroup: 'shoulders',
    equipment: 'chest_press_machine_upright',
    equipmentNote: 'Chest Press Machine — Upright/Shoulder position',
    tips: 'Keep core tight. Don\'t shrug at the top — focus on delts.',
    defaultSets: 3,
    defaultReps: 10,
    isCompound: true,
  },
  {
    id: 'neutral_db_shoulder_press',
    name: 'Neutral Grip Dumbbell Shoulder Press',
    muscleGroup: 'shoulders',
    equipment: 'dumbbells',
    equipmentNote: 'Dumbbells — palms facing each other, seated or standing',
    tips: 'Neutral grip reduces shoulder impingement. Press straight up, not forward.',
    defaultSets: 3,
    defaultReps: 10,
    isCompound: true,
  },
  {
    id: 'lateral_raise_unilateral',
    name: 'Lateral Raise — Unilateral',
    muscleGroup: 'shoulders',
    equipment: 'dumbbells',
    equipmentNote: 'Single dumbbell — one arm at a time for better isolation',
    tips: 'Lead with the elbow, not the wrist. Stop at shoulder height. Slow negative.',
    defaultSets: 3,
    defaultReps: 12,
    isCompound: false,
  },
]

// PRD Section 4.3 — Triceps (2 exercises)
const tricepsExercises: Exercise[] = [
  {
    id: 'db_skull_crushers',
    name: 'Dumbbell Skull Crushers',
    muscleGroup: 'triceps',
    equipment: 'dumbbells',
    equipmentNote: 'Dumbbells — lying on floor, EZ-curl style with DBs',
    tips: 'Keep upper arms vertical and still. Lower to temples, extend fully at top.',
    defaultSets: 3,
    defaultReps: 12,
    isCompound: false,
  },
  {
    id: 'tricep_pushdown',
    name: 'Tricep Pushdown',
    muscleGroup: 'triceps',
    equipment: 'lat_pulldown_bar_shoulder',
    equipmentNote: 'Lat Pulldown Machine — straight bar or V-bar, standing, push bar downward',
    tips: 'Keep elbows pinned to sides. Full extension at bottom, don\'t let bar fly up.',
    defaultSets: 3,
    defaultReps: 12,
    isCompound: false,
  },
]

// PRD Section 4.4 — Biceps (4 exercises)
const bicepsExercises: Exercise[] = [
  {
    id: 'concentration_curl',
    name: 'Concentration Curl',
    muscleGroup: 'biceps',
    equipment: 'dumbbells',
    equipmentNote: 'Single dumbbell — seated, elbow braced on inner thigh',
    tips: 'Full range of motion. Supinate at the top. No swinging — pure isolation.',
    defaultSets: 3,
    defaultReps: 12,
    isCompound: false,
  },
  {
    id: 'standing_db_curl',
    name: 'Standing Dumbbell Curl',
    muscleGroup: 'biceps',
    equipment: 'dumbbells',
    equipmentNote: 'Dumbbells — bilateral standing curl',
    tips: 'Curl both arms together. Keep elbows at sides. Full supination at the top.',
    defaultSets: 3,
    defaultReps: 12,
    isCompound: false,
  },
  {
    id: 'hammer_curl',
    name: 'Hammer Curl',
    muscleGroup: 'biceps',
    equipment: 'dumbbells',
    equipmentNote: 'Dumbbells — neutral grip (palms facing each other), bilateral',
    tips: 'Neutral grip targets brachialis and brachioradialis. Keep thumbs up throughout.',
    defaultSets: 3,
    defaultReps: 12,
    isCompound: false,
  },
  {
    id: 'incline_db_curl',
    name: 'Incline Dumbbell Curl',
    muscleGroup: 'biceps',
    equipment: 'chest_press_machine_incline',
    equipmentNote: 'Dumbbells — chest press machine reclined as incline bench backrest',
    tips: 'Incline stretch maximises long head activation. Let arms hang fully at bottom.',
    defaultSets: 3,
    defaultReps: 12,
    isCompound: false,
  },
]

// PRD Section 4.5 — Back (9 exercises)
const backExercises: Exercise[] = [
  {
    id: 'wide_grip_pulldown',
    name: 'Wide Grip Lat Pulldown',
    muscleGroup: 'back',
    equipment: 'lat_pulldown_bar_wide',
    equipmentNote: 'Lat Pulldown Machine — overhand, hands outside shoulder width',
    tips: 'Pull to upper chest. Lead with elbows. Lean back slightly, arch the chest.',
    defaultSets: 3,
    defaultReps: 10,
    isCompound: true,
  },
  {
    id: 'shoulder_width_pulldown',
    name: 'Shoulder-Width Lat Pulldown',
    muscleGroup: 'back',
    equipment: 'lat_pulldown_bar_shoulder',
    equipmentNote: 'Lat Pulldown Machine — overhand, shoulder-width grip',
    tips: 'Balanced lat activation. Pull elbows straight down. Squeeze lats at bottom.',
    defaultSets: 3,
    defaultReps: 10,
    isCompound: true,
  },
  {
    id: 'vbar_pulldown',
    name: 'V-Bar Lat Pulldown',
    muscleGroup: 'back',
    equipment: 'lat_pulldown_vbar',
    equipmentNote: 'Lat Pulldown Machine — V-bar attachment, neutral grip',
    tips: 'Neutral grip is easier on the shoulders. Pull V-bar to lower chest.',
    defaultSets: 3,
    defaultReps: 10,
    isCompound: true,
  },
  {
    id: 'underhand_pulldown',
    name: 'Underhand Lat Pulldown',
    muscleGroup: 'back',
    equipment: 'lat_pulldown_underhand',
    equipmentNote: 'Lat Pulldown Machine — supinated (underhand) grip, shoulder width',
    tips: 'Greater bicep involvement. Pull bar to upper chest. Squeeze at bottom.',
    defaultSets: 3,
    defaultReps: 10,
    isCompound: true,
  },
  {
    id: 'neutral_grip_pulldown',
    name: 'Neutral Grip Lat Pulldown',
    muscleGroup: 'back',
    equipment: 'lat_pulldown_neutral',
    equipmentNote: 'Lat Pulldown Machine — neutral grip attachment (parallel handles)',
    tips: 'Great for elbow and shoulder comfort. Drive elbows down and back.',
    defaultSets: 3,
    defaultReps: 10,
    isCompound: true,
  },
  {
    id: 'lat_pullover',
    name: 'Lat Pullover',
    muscleGroup: 'back',
    equipment: 'lat_pulldown_bar_wide',
    equipmentNote: 'Lat Pulldown Machine — straight arm, standing, pull bar from overhead to hips',
    tips: 'Stand back from machine. Keep arms straight. Full stretch at top, squeeze lats at bottom.',
    defaultSets: 3,
    defaultReps: 12,
    isCompound: false,
  },
  {
    id: 'wide_grip_cable_row',
    name: 'Wide Grip Cable Row',
    muscleGroup: 'back',
    equipment: 'lat_pulldown_bar_wide',
    equipmentNote: 'Lat Pulldown Machine — lean back 30-45°, wide overhand pull to upper chest',
    tips: 'Lean back slightly, pull bar to upper chest. Targets upper back and rear delts.',
    defaultSets: 3,
    defaultReps: 10,
    isCompound: true,
  },
  {
    id: 'vbar_cable_row',
    name: 'V-Bar Cable Row',
    muscleGroup: 'back',
    equipment: 'lat_pulldown_vbar',
    equipmentNote: 'Lat Pulldown Machine — lean back, V-bar pull to lower chest/abdomen',
    tips: 'Lean back, pull V-bar to lower chest. Drive elbows past torso. Squeeze mid-back.',
    defaultSets: 3,
    defaultReps: 10,
    isCompound: true,
  },
]

// PRD Section 4.6 — Legs (2 exercises)
const legExercises: Exercise[] = [
  {
    id: 'leg_extension',
    name: 'Leg Extension',
    muscleGroup: 'legs',
    equipment: 'leg_extension_machine',
    equipmentNote: 'Leg Extension / Leg Curl Machine — quad isolation',
    tips: 'Full extension at top. Control the negative. Don\'t swing the weight.',
    defaultSets: 3,
    defaultReps: 12,
    isCompound: false,
  },
  {
    id: 'leg_curl',
    name: 'Leg Curl',
    muscleGroup: 'legs',
    equipment: 'leg_curl_machine',
    equipmentNote: 'Leg Extension / Leg Curl Machine — hamstring isolation',
    tips: 'Full range of motion. Squeeze hamstrings at full contraction. Slow negative.',
    defaultSets: 3,
    defaultReps: 12,
    isCompound: false,
  },
]

// Complete exercise library — 24 exercises total
export const EXERCISES: Exercise[] = [
  ...chestExercises,
  ...shoulderExercises,
  ...tricepsExercises,
  ...bicepsExercises,
  ...backExercises,
  ...legExercises,
]

// Lookup helpers
export const getExerciseById = (id: string): Exercise | undefined =>
  EXERCISES.find((e) => e.id === id)

export const getExercisesByMuscleGroup = (group: MuscleGroup): Exercise[] =>
  EXERCISES.filter((e) => e.muscleGroup === group)

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'shoulders',
  'triceps',
  'biceps',
  'back',
  'legs',
]

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  triceps: 'Triceps',
  biceps: 'Biceps',
  back: 'Back',
  legs: 'Legs',
}
