import { useEffect } from 'react';
import { usePermissions } from '../../reducers/permission.context';
import { userIamStore } from './user-iam-store';

/**
 * Custom hook that synchronizes the permission context userIam with the UserIamStore
 * 
 * This should be used in a top-level component that wraps the application
 */
export const useUserIamSync = (): void => {
  const { userIam } = usePermissions();
  
  useEffect(() => {
    // Update the userIamStore whenever userIam changes in the permission context
    userIamStore.setUserIam(userIam);
    
    // No cleanup needed, as the userIamStore is persistent
  }, [userIam]);
}; 