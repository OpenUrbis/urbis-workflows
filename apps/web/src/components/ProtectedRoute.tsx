import React, { useContext, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { usePermissions } from "../reducers/permission.context";
import { Spinner } from "./LegacyUi";
import { StyleContext } from "../reducers";
import { AuthContext } from "../reducers/auth.reducer";

interface ProtectedRouteProps {
  requiredPermission?: string;
  fallbackPath?: string;
}

/**
 * A component that protects routes based on user permissions
 *
 * @param requiredPermission - The permission code required to access the route
 * @param fallbackPath - The path to redirect to if the user doesn't have the required permission
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredPermission,
  fallbackPath = "/not-found",
}) => {
  const styleContext = useContext(StyleContext);
  const { isAuthenticated, isLoading: authLoading, signIn } = useContext(AuthContext);
  const { hasPermission, loading, error } = usePermissions();

  // If not authenticated and not loading, trigger OIDC sign-in
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      signIn();
    }
  }, [isAuthenticated, authLoading, signIn]);

  // While auth is loading, show nothing
  if (authLoading) return null;

  // If not authenticated (sign-in redirect in progress), show nothing
  if (!isAuthenticated) return null;

  // If there's an error loading permissions and the user is authenticated,
  // redirect to the IAM error page
  if (error) {
    return <Navigate to="/iam-error" replace />;
  }

  // If still loading permissions, show a loading indicator
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center pt-40 space-y-4">
        <div
          style={{
            color:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#eab308"
                : "#fde047",
          }}
        >
          <Spinner size="xl" />
        </div>
      </div>
    );
  }

  // If no permission is required or user has the required permission, render the route
  if (!requiredPermission || hasPermission(requiredPermission)) {
    return <Outlet />;
  }

  // Otherwise, redirect to the fallback path
  return <Navigate to={fallbackPath} replace />;
};
