import { useEffect } from 'react';
import * as Updates from 'expo-updates';

export function useOTAUpdates() {
  useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__) return;

      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          console.log('OTA update available, downloading...');
          await Updates.fetchUpdateAsync();
          console.log('OTA update downloaded, will apply on next restart');
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    }

    checkForUpdates();
  }, []);
}
