import {
  ReactNode,
  FC,
  useContext,
  createContext,
  useEffect,
  useCallback,
  useRef,
  useState,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  AuthProvider as OidcProvider,
  hasAuthParams,
  useAuth,
} from "react-oidc-context";
import { oidcConfig } from "../auth/oidc-config";

function getPath(uri: string): string {
  try {
    return new URL(uri, window.location.origin).pathname;
  } catch {
    return "/callback";
  }
}

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
  isRestoringSession: boolean;
}

export const DefaultRouteContext = createContext<string>("/workflows-schema");
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  accessToken: null,
  user: null,
  signIn: () => {},
  signOut: () => {},
  isLoading: true,
  isRestoringSession: true,
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
  const profile = (auth.user?.profile ?? null) as Record<
    string,
    unknown
  > | null;
  const accessTokenPayload = decodeJwtPayload(accessToken ?? undefined);

  const socialName = pickString(
    [profile, accessTokenPayload],
    ["socialName", "social_name", "preferred_username", "nickname"],
  );
  const name =
    pickString([profile, accessTokenPayload], ["name", "given_name"]) ??
    socialName;
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
  const isAuthCallbackRoute =
    window.location.pathname === getPath(oidcConfig.redirect_uri);
  const isProcessingAuthResponse = hasAuthParams();
  const [isRestoringSession, setIsRestoringSession] = useState(
    () => !isAuthCallbackRoute && !isProcessingAuthResponse,
  );
  const silentSigninState = useRef<"idle" | "pending" | "settled">("idle");
  const isLoading = auth.isLoading || isRestoringSession;

  const signIn = useCallback(() => {
    void auth.signinRedirect();
  }, [auth.signinRedirect]);

  const signOut = useCallback(() => {
    void auth.signoutRedirect();
  }, [auth.signoutRedirect]);

  // Restore an existing provider session before any protected route starts
  // an interactive redirect. The ref makes this safe under React StrictMode.
  useEffect(() => {
    if (isAuthCallbackRoute || isProcessingAuthResponse) {
      setIsRestoringSession(false);
      return;
    }

    if (auth.isAuthenticated) {
      setIsRestoringSession(false);
      return;
    }

    if (silentSigninState.current === "pending") return;

    if (silentSigninState.current === "settled" || auth.error) {
      setIsRestoringSession(false);
      return;
    }

    if (auth.isLoading || auth.activeNavigator) return;

    silentSigninState.current = "pending";

    void auth
      .signinSilent()
      .catch(() => {
        // No active provider session: protected guards will fall back to login.
      })
      .finally(() => {
        silentSigninState.current = "settled";
        setIsRestoringSession(false);
      });
  }, [auth, isAuthCallbackRoute, isProcessingAuthResponse]);

  const defaultRoute = "/workflows-schema";

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        user,
        signIn,
        signOut,
        isLoading,
        isRestoringSession,
      }}
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
  const {
    isAuthenticated,
    isLoading,
    isRestoringSession,
    signIn,
  } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated && !isLoading && !isRestoringSession) {
      signIn();
    }
  }, [isAuthenticated, isLoading, isRestoringSession, signIn]);

  if (isLoading || isRestoringSession) return null;

  return isAuthenticated ? children : null;
};

/**
 * Wrapper that renders children regardless of auth state.
 * Used for pages that should be publicly viewable but may have
 * enhanced functionality when authenticated.
 */
export const PublicOrPrivateWrapper: FC<PrivateWrapperProps> = ({
  children,
}) => {
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
