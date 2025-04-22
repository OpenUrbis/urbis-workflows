import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { usePermissions } from "../reducers/permission.context";
import { Spinner } from "@chakra-ui/react";
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
  const { isAuthenticated } = useContext(AuthContext);
  const { hasPermission, loading, error } = usePermissions();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If there's an error loading permissions and the user is authenticated,
  // redirect to the IAM error page
  if (error) {
    return <Navigate to="/iam-error" replace />;
  }

  // If still loading permissions, show a loading indicator
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center pt-40 space-y-4">
        <Spinner
          size="xl"
          color={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "yellow.500"
              : "yellow.300"
          }
          thickness="3px"
        />
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
