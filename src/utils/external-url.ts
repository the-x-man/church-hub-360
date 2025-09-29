/**
 * Utility function to open external URLs
 * In Electron: Uses shell.openExternal to open in browser
 * In Web: Uses window.open to open in new tab
 */
export const openExternalUrl = async (url: string): Promise<void> => {
  // Check if we're in an Electron environment
  if (window.electron?.openExternal) {
    try {
      const result = await window.electron.openExternal(url);
      if (!result.success) {
        console.error('Failed to open external URL:', result.error);
        // Fallback to window.open if Electron method fails
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error opening external URL:', error);
      // Fallback to window.open if Electron method fails
      window.open(url, '_blank');
    }
  } else {
    // Web environment - use window.open
    window.open(url, '_blank');
  }
};