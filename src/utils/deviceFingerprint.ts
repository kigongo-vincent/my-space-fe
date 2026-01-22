/**
 * Generates a unique device fingerprint for tracking uploads
 * Uses a combination of browser characteristics to create a stable ID
 */
export function getDeviceId(): string {
  const stored = localStorage.getItem('deviceId')
  if (stored) {
    return stored
  }

  // Generate a unique device ID based on browser characteristics
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Device fingerprint', 2, 2)
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
    navigator.hardwareConcurrency || 0,
    navigator.platform,
  ].join('|')

  // Create a simple hash
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  const deviceId = `device_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`
  localStorage.setItem('deviceId', deviceId)
  return deviceId
}
