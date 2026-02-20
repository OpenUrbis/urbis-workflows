import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../reducers/auth.reducer";
import { Button, Card, CardContent } from "@open-urbis/map-ui";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface IamErrorProps {
  error?: Error | null;
  onRetry?: () => void;
}

export const IamError: React.FC<IamErrorProps> = ({
  error: propError,
  onRetry,
}) => {
  const { isAuthenticated, signIn } = useContext(AuthContext);
  const location = useLocation();
  const [error, setError] = useState<Error | null>(propError || null);
  const [forcedDisplay, setForcedDisplay] = useState<boolean>(false);

  // Special effect to handle forced reloads - runs once on component mount
  useEffect(() => {
    const forceReloadFlag = sessionStorage.getItem("iamErrorForceReload");

    if (forceReloadFlag === "true") {
      console.log("Forced reload detected, ensuring error display");
      // Clear the flag
      sessionStorage.removeItem("iamErrorForceReload");

      // Force the component to display regardless of other conditions
      setForcedDisplay(true);

      // Ensure we have an error to display
      const storedError = sessionStorage.getItem("iamError");
      if (storedError) {
        try {
          const parsedError = JSON.parse(storedError);
          setError(new Error(parsedError.message));
        } catch (e) {
          setError(new Error("Erro desconhecido ao carregar permissões"));
        }
      } else {
        setError(new Error("Erro desconhecido ao carregar permissões"));
      }
    }
  }, []); // Empty dependency array means this runs once on mount

  // Retrieve error from sessionStorage if not provided as prop
  useEffect(() => {
    if (!propError) {
      const storedError = sessionStorage.getItem("iamError");
      if (storedError) {
        try {
          const parsedError = JSON.parse(storedError);
          setError(new Error(parsedError.message));
        } catch (e) {
          setError(new Error("Erro desconhecido ao carregar permissões"));
        }
      } else if (!error) {
        // If no error in props or sessionStorage, set a default error
        setError(new Error("Erro desconhecido ao carregar permissões"));
      }
    } else {
      setError(propError);
    }
  }, [propError, error]);

  // Ensure error page is shown regardless of authentication state
  // This fixes the blank page issue when the backend is not available
  useEffect(() => {
    const checkAndClearRedirectFlag = () => {
      // If we came from a failed backend request, we should show this page
      // regardless of authentication state
      const fromFailedRequest = sessionStorage.getItem("iamError");
      if (fromFailedRequest && !isAuthenticated) {
        // We'll still show the error page but won't redirect to login
        return;
      }
    };

    checkAndClearRedirectFlag();
  }, [isAuthenticated]);

  // Redirect to OIDC sign-in if not authenticated and we don't have a stored error
  useEffect(() => {
    const hasStoredError = sessionStorage.getItem("iamError");
    const isErrorPage = window.location.pathname === "/iam-error";

    if (!isAuthenticated && !hasStoredError && !isErrorPage) {
      signIn();
    }
  }, [isAuthenticated, signIn]);

  // Check for error information in URL parameters when component mounts
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const errorFromUrl = queryParams.get("error");

    if (errorFromUrl) {
      setError(new Error(decodeURIComponent(errorFromUrl)));

      // Store in session for persistence
      sessionStorage.setItem(
        "iamError",
        JSON.stringify({
          message: decodeURIComponent(errorFromUrl),
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, [location]);

  // Handle retry by explicitly clearing session storage and forcing a refresh
  const handleRetry = () => {
    console.log("Retry button clicked, attempting to reconnect");

    // Set a temporary flag to indicate we're in the retry process
    sessionStorage.setItem("iamErrorRetrying", "true");

    // Clear all error-related items from sessionStorage
    sessionStorage.removeItem("iamError");
    sessionStorage.removeItem("iamErrorRedirectNeeded");
    sessionStorage.removeItem("iamErrorForceReload");

    // If onRetry prop is provided, use it
    if (onRetry) {
      onRetry();
    } else {
      // Most reliable way to ensure a clean state is a hard refresh to the home page
      window.location.href = "/";
    }
  };

  // Show error page even if not authenticated but we have an error in sessionStorage
  // or if we were redirected here via forced reload mechanism
  const hasStoredError = Boolean(sessionStorage.getItem("iamError"));
  if (!isAuthenticated && !hasStoredError && !forcedDisplay) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <Card className="w-full max-w-xl border-muted/80">
        <CardContent className="p-8 sm:p-10 text-center">
          <div className="relative mb-6">
            <p className="text-7xl sm:text-8xl font-black tracking-tight text-muted/40">
              IAM
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
            Erro de Permissões
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            Não foi possível carregar suas permissões de acesso. Isso pode
            ocorrer devido a problemas de conexão ou sessão expirada.
          </p>

          {error && (
            <div className="mb-8 rounded-lg border border-muted/80 bg-muted/40 p-4 text-left">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Detalhes do erro:
              </p>
              <p className="font-mono text-xs sm:text-sm text-foreground break-words">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              type="button"
              size="sm"
              className="h-10 px-5 rounded-lg"
              onClick={handleRetry}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
