import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { StyleContext } from "../reducers";
import { AuthContext } from "../reducers/auth.reducer";

interface IamErrorProps {
  error?: Error | null;
  onRetry?: () => void;
}

export const IamError: React.FC<IamErrorProps> = ({
  error: propError,
  onRetry,
}) => {
  const styleContext = useContext(StyleContext);
  const { isAuthenticated, signIn } = useContext(AuthContext);
  const navigate = useNavigate();
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

  // Determine if in high contrast mode
  const isHighContrast = styleContext.state.buttonHoverColorWeight === "800";

  // Determine colors based on the style context - using purple/violet palette (same as NotFound)
  const accentColor = isHighContrast
    ? "rgb(139, 92, 246)" // Use brighter violet-500 for HC mode for better visibility
    : "rgb(139, 92, 246)"; // violet-500 for normal mode

  // Use same color palette for all elements but with higher opacity for HC mode
  const textLargeColor = accentColor;
  const textColor = styleContext.state.textColor;
  const secondaryTextColor = isHighContrast
    ? "rgba(255, 255, 255, 0.95)" // Almost white with high opacity for HC
    : "rgba(75, 85, 99, 0.8)"; // gray-600 for normal mode

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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6 py-12 text-center">
      <div className="w-full max-w-md mx-auto">
        {/* Visual element - warning icon */}
        <div className="relative mb-8">
          <h1
            className={`text-9xl font-extrabold tracking-tight ${isHighContrast ? "opacity-40" : "opacity-15"}`}
            style={{ color: textLargeColor }}
          >
            IAM
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-24 h-24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: accentColor }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={isHighContrast ? 2 : 1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h2
          className={`text-3xl font-bold mb-4 ${isHighContrast ? "tracking-wide" : ""}`}
          style={{ color: textColor }}
        >
          Erro de Permissões
        </h2>

        <p className="text-lg mb-4" style={{ color: secondaryTextColor }}>
          Não foi possível carregar suas permissões de acesso. Isso pode ocorrer
          devido a problemas de conexão ou sessão expirada.
        </p>

        {error && (
          <div
            className={`mb-6 p-4 rounded-lg text-left text-sm ${isHighContrast ? "border border-violet-400" : ""}`}
            style={{
              backgroundColor: isHighContrast
                ? "rgba(0, 0, 0, 0.3)"
                : "rgba(0, 0, 0, 0.05)",
              color: isHighContrast
                ? "rgba(255, 255, 255, 0.9)"
                : secondaryTextColor,
            }}
          >
            <p
              className={`font-medium mb-1 ${isHighContrast ? "text-violet-300" : ""}`}
            >
              Detalhes do erro:
            </p>
            <p className="font-mono">{error.message}</p>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <button
            onClick={handleRetry}
            className="px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:shadow-lg flex items-center hover:brightness-95"
            style={{
              backgroundColor: accentColor,
              border: isHighContrast ? "2px solid white" : "none",
            }}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={isHighContrast ? 2 : 2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
};
