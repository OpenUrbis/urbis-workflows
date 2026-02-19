import {
  ReactNode,
  FC,
  useContext,
  createContext,
  useEffect,
  useCallback,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthProvider as OidcProvider, useAuth } from "react-oidc-context";
import { oidcConfig } from "../auth/oidc-config";

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  signIn: () => void;
  signOut: () => void;
  isLoading: boolean;
}

export const DefaultRouteContext = createContext<string>("/workflows-schema");
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  accessToken: null,
  signIn: () => {},
  signOut: () => {},
  isLoading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Inner component that bridges react-oidc-context to our AuthContext.
 * Must be rendered inside OidcProvider.
 */
const AuthBridge: FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  const isAuthenticated = auth.isAuthenticated;
  const accessToken = auth.user?.access_token ?? null;
  const isLoading = auth.isLoading;

  const signIn = useCallback(() => {
    auth.signinRedirect();
  }, [auth]);

  const signOut = useCallback(() => {
    auth.removeUser();
    auth.signoutRedirect();
  }, [auth]);

  // Attempt silent sign-in on mount if not authenticated and not loading
  useEffect(() => {
    if (!isAuthenticated && !isLoading && !auth.activeNavigator) {
      auth.signinSilent().catch(() => {
        // Silent sign-in failed — user will need to log in explicitly
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultRoute = isAuthenticated ? "/workflows-schema" : "/";

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, accessToken, signIn, signOut, isLoading }}
    >
      <DefaultRouteContext.Provider value={defaultRoute}>
        {children}
      </DefaultRouteContext.Provider>
    </AuthContext.Provider>
  );
};

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  return (
    <OidcProvider {...oidcConfig}>
      <AuthBridge>{children}</AuthBridge>
    </OidcProvider>
  );
};

interface PrivateWrapperProps {
  children: React.ReactElement;
}

export const PrivateWrapper: FC<PrivateWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading, signIn } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      signIn();
    }
  }, [isAuthenticated, isLoading, signIn]);

  if (isLoading) return null;

  return isAuthenticated ? children : null;
};

export const PublicWrapper: FC<PrivateWrapperProps> = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  const publicPaths = ["/", "/iam-error"];

  if (isAuthenticated && publicPaths.includes(location.pathname)) {
    return <Navigate to="/workflows-schema" />;
  }

  return <>{children}</>;
};
