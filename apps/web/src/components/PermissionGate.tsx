import React, { ReactNode, memo } from "react";
import { usePermissions } from "../reducers/permission.context";

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that conditionally renders its children based on user permissions
 *
 * @param permission - The permission code required to render the children
 * @param children - The content to render if the user has the required permission
 * @param fallback - Optional content to render if the user doesn't have the required permission
 */
export const PermissionGate = memo<PermissionGateProps>(
  ({ permission, children, fallback = null }) => {
    const { hasPermission, loading } = usePermissions();

    // If permissions are still loading, render nothing to avoid flicker
    if (loading) {
      return null;
    }

    // If user has the permission, render the children
    if (hasPermission(permission)) {
      return <>{children}</>;
    }

    // Otherwise, render the fallback
    return <>{fallback}</>;
  }
);
