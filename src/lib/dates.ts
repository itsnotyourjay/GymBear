/**
 * Date utilities for GymBear
 */

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
  })
}

export const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
export type DayName = typeof DAY_NAMES[number]

export const DAY_LABELS: Record<DayName, string> = {
  sunday:    'Sun',
  monday:    'Mon',
  tuesday:   'Tue',
  wednesday: 'Wed',
  thursday:  'Thu',
  friday:    'Fri',
  saturday:  'Sat',
}

export function todayDayName(): DayName {
  return DAY_NAMES[new Date().getDay()]
}

export function isGymDay(gymDays: string[]): boolean {
  return gymDays.includes(todayDayName())
}
