import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ApiClient } from "../api";
import { UserIamDetailsResponse } from "../api/types/iam.dto";
import { ActivityTemplate } from "../api/types/schema";
import { AuthContext } from "./auth.reducer";

interface PermissionContextType {
  userIam: UserIamDetailsResponse | null;
  loading: boolean;
  error: Error | null;
  hasPermission: (permission: string) => boolean;
  hasActivityAccess: (
    activity: ActivityTemplate,
    accessType?: "read" | "write"
  ) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType>({
  userIam: null,
  loading: true,
  error: null,
  hasPermission: () => false,
  hasActivityAccess: () => false,
  refreshPermissions: async () => {},
});

export const usePermissions = () => useContext(PermissionContext);

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({
  children,
}) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [userIam, setUserIam] = useState<UserIamDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(isAuthenticated);
  const [error, setError] = useState<Error | null>(null);

  const apiClient = new ApiClient({
    baseURL: process.env.REACT_APP_BACK_END_API || "",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const fetchUserIam = async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.iam.getCurrentUserIamDetails();
      setUserIam(response);
      setError(null);
      // Clear any existing IAM error when successful
      sessionStorage.removeItem("iamError");
      sessionStorage.removeItem("iamErrorRedirectNeeded");
    } catch (err) {
      console.error("Failed to fetch user IAM details:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch user IAM details";

      // Create a standard error object
      const standardError = new Error(errorMessage);
      setError(standardError);

      // Immediately save to sessionStorage to ensure it's available
      sessionStorage.setItem(
        "iamError",
        JSON.stringify({
          message: errorMessage,
          timestamp: new Date().toISOString(),
        })
      );

      // Set flag to indicate redirect is needed
      sessionStorage.setItem("iamErrorRedirectNeeded", "true");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we're in a retry scenario from the error page
    const isRetrying = sessionStorage.getItem("iamErrorRetrying") === "true";

    if (isRetrying) {
      // Clear the retry flag
      sessionStorage.removeItem("iamErrorRetrying");
      console.log("Retrying IAM permissions fetch after error");
    }

    // Call fetchUserIam
    fetchUserIam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const hasPermission = (permission: string): boolean => {
    // If not authenticated, always return false
    if (!isAuthenticated || !userIam) return false;

    // Check direct permissions
    const hasDirectPermission = userIam.directPermissions?.some(
      (p) => p.code === permission
    );
    if (hasDirectPermission) return true;

    // Check permissions from roles
    const hasRolePermission = userIam.directRoles?.some((role) =>
      role.permissions?.some((p) => p.code === permission)
    );
    if (hasRolePermission) return true;

    // Check permissions from groups
    const hasGroupPermission = userIam.groups?.some((group) =>
      group.roles?.some((role) =>
        role.permissions?.some((p) => p.code === permission)
      )
    );
    if (hasGroupPermission) return true;

    return false;
  };

  const hasActivityAccess = (
    activity: ActivityTemplate,
    accessType: "read" | "write" = "read"
  ): boolean => {
    // If no IAM details available, deny access
    if (!userIam) return false;

    // If user has write access, they automatically have read access
    if (accessType === "read") {
      const hasWriteAccess = checkActivityAccess(activity, "write");
      if (hasWriteAccess) return true;
    }

    return checkActivityAccess(activity, accessType);
  };

  // Helper function to avoid recursion in hasActivityAccess
  const checkActivityAccess = (
    activity: ActivityTemplate,
    accessType: "read" | "write"
  ): boolean => {
    // Check access level - user must have sufficient level
    if (
      activity.accessLevel &&
      userIam &&
      userIam.accessLevel < activity.accessLevel
    ) {
      return false;
    }

    // If there are no specific permissions beyond access level, user has access
    if (
      !activity.permissions ||
      (!activity.permissions.users?.length &&
        !activity.permissions.roles?.length &&
        !activity.permissions.groups?.length)
    ) {
      return true;
    }

    // Check user direct permissions
    const hasUserPermission = activity.permissions.users?.some(
      (permUser: any) =>
        permUser.id === userIam?.id &&
        (accessType === "read"
          ? permUser.access === "read" || permUser.access === "write"
          : permUser.access === "write")
    );
    if (hasUserPermission) return true;

    // Check role permissions
    const hasRolePermission = activity.permissions.roles?.some((role: any) =>
      userIam?.directRoles?.some(
        (userRole: any) =>
          userRole.id === role.id &&
          (accessType === "read"
            ? role.access === "read" || role.access === "write"
            : role.access === "write")
      )
    );
    if (hasRolePermission) return true;

    // Check group permissions
    const hasGroupPermission = activity.permissions.groups?.some((group: any) =>
      userIam?.groups?.some(
        (userGroup: any) =>
          userGroup.id === group.id &&
          (accessType === "read"
            ? group.access === "read" || group.access === "write"
            : group.access === "write")
      )
    );
    if (hasGroupPermission) return true;

    return false;
  };

  const refreshPermissions = async () => {
    await fetchUserIam();
  };

  // Only redirect to IAM error page if:
  // 1. User is authenticated (we're not on a public route) OR we have a pending redirect
  // 2. There's an error fetching permissions
  // 3. We're not currently loading
  const needsRedirect =
    sessionStorage.getItem("iamErrorRedirectNeeded") === "true";
  if ((isAuthenticated || needsRedirect) && error && !loading) {
    // Only redirect if we're not already on the error page
    if (window.location.pathname !== "/iam-error") {
      // Clear the redirect flag to prevent redirect loops
      sessionStorage.removeItem("iamErrorRedirectNeeded");

      // Prepare error message for URL
      const errorParam = encodeURIComponent(error.message);

      // Force a FULL page reload in ALL cases by using window.location.href
      // This resolves the blank page issue by ensuring a complete refresh
      console.log("Redirecting to IAM error page");

      // Set a flag to indicate this is a forced reload
      sessionStorage.setItem("iamErrorForceReload", "true");

      // Perform the redirect with error information
      window.location.href = `/iam-error?error=${errorParam}`;

      // Return null to prevent further rendering while we're redirecting
      return null;
    }
  }

  return (
    <PermissionContext.Provider
      value={{
        userIam,
        loading,
        error,
        hasPermission,
        hasActivityAccess,
        refreshPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};
