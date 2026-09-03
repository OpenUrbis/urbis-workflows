import React from 'react';
import { useUserIamSync } from '../api/services/use-user-iam-sync';

/**
 * Component that synchronizes the userIam from permission context 
 * with the UserIamStore for API clients to access
 * 
 * This component doesn't render anything visible.
 */
const UserIamSyncProvider: React.FC = () => {
  // Use the sync hook to keep userIam data updated
  useUserIamSync();
  
  // This component doesn't render anything
  return null;
};

export default UserIamSyncProvider; 