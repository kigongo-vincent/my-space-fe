/**
 * Resolves file URLs with local file priority
 * If a file was uploaded from this device and exists locally, use the local version
 * Otherwise, fall back to the server URL
 */

import { FileItem } from "../store/Filestore"
import { getDeviceId } from "./deviceFingerprint"
import { getLocalFile } from "./localFileStorage"

export async function resolveFileUrl(file: FileItem): Promise<string | null> {
  // If no file ID, can't resolve
  if (!file.id) {
    return file.url || null
  }

  // Check if file was uploaded from this device
  const currentDeviceId = getDeviceId()
  if (file.deviceId && file.deviceId === currentDeviceId) {
    // Try to get local file
    const localFile = await getLocalFile(file.id)
    if (localFile) {
      // Create a blob URL from the local file
      return URL.createObjectURL(localFile)
    }
  }

  // Fall back to server URL
  return file.url || file.thumbnail || null
}

/**
 * Resolves file URL synchronously (returns server URL immediately)
 * Use this when you need a URL right away and can't wait for async local check
 */
export function resolveFileUrlSync(file: FileItem): string | null {
  return file.url || file.thumbnail || null
}
