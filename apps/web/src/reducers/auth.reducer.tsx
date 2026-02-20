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

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function pickString(
  sources: Array<Record<string, unknown> | null | undefined>,
  keys: string[],
): string | undefined {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return undefined;
}

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: {
    name?: string;
    socialName?: string;
    email?: string;
  } | null;
  signIn: () => void;
  signOut: () => void;
  isLoading: boolean;
}

export const DefaultRouteContext = createContext<string>("/workflows-schema");
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  accessToken: null,
  user: null,
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
  const profile = (auth.user?.profile ?? null) as Record<string, unknown> | null;
  const accessTokenPayload = decodeJwtPayload(accessToken ?? undefined);

  const socialName = pickString(
    [profile, accessTokenPayload],
    ["socialName", "social_name", "preferred_username", "nickname"],
  );
  const name =
    pickString([profile, accessTokenPayload], ["name", "given_name"]) ?? socialName;
  const email = pickString(
    [profile, accessTokenPayload],
    ["email", "upn", "preferred_username"],
  );

  const user = auth.user
    ? {
        name,
        socialName,
        email,
      }
    : null;
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

  const defaultRoute = "/workflows-schema";

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, accessToken, user, signIn, signOut, isLoading }}
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

/**
 * Wrapper that renders children regardless of auth state.
 * Used for pages that should be publicly viewable but may have
 * enhanced functionality when authenticated.
 */
export const PublicOrPrivateWrapper: FC<PrivateWrapperProps> = ({ children }) => {
  const { isLoading } = useContext(AuthContext);

  if (isLoading) return null;

  return <>{children}</>;
};

export const PublicWrapper: FC<PrivateWrapperProps> = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  const publicPaths = ["/", "/iam-error", "/workflows-schema"];

  if (isAuthenticated && publicPaths.includes(location.pathname)) {
    return <Navigate to="/workflows-schema" />;
  }

  return <>{children}</>;
};
