/**
 * GymBear Haptic Feedback — Enhancement §12
 * Thin wrapper around the Vibration API.
 * Silent no-op on unsupported browsers.
 */
export const haptics = {
  light:   (): void => { navigator.vibrate?.(10) },
  medium:  (): void => { navigator.vibrate?.(25) },
  heavy:   (): void => { navigator.vibrate?.(50) },
  success: (): void => { navigator.vibrate?.([15, 50, 30]) },
  warning: (): void => { navigator.vibrate?.([30, 100, 30]) },
  pr:      (): void => { navigator.vibrate?.([50, 100, 100, 100, 200]) },
}
