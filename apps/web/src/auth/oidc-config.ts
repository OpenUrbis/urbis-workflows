import { WebStorageStateStore } from "oidc-client-ts";

const getRedirectUri = (uri: string | undefined, defaultPath: string) => {
  if (uri && !uri.startsWith("http")) {
    return `${window.location.origin}${uri}`;
  }

  return uri || `${window.location.origin}${defaultPath}`;
};

export const oidcConfig = {
  authority:
    import.meta.env.VITE_OIDC_AUTHORITY || "http://localhost:3000/auth/oidc",
  client_id:
    import.meta.env.VITE_OIDC_CLIENT_ID ||
    "94a86322-269e-44df-803a-534c0382215d",
  redirect_uri: getRedirectUri(
    import.meta.env.VITE_OIDC_REDIRECT_URI,
    "/callback",
  ),
  silent_redirect_uri: getRedirectUri(
    import.meta.env.VITE_OIDC_SILENT_REDIRECT_URI,
    "/silent-renew.html",
  ),
  post_logout_redirect_uri: window.location.origin,
  scope: "openid profile email",
  response_type: "code",
  automaticSilentRenew: true,
  onSigninCallback: () => {
    const postLoginRedirectPath = sessionStorage.getItem("postLoginRedirectPath");
    if (postLoginRedirectPath) {
      sessionStorage.removeItem("postLoginRedirectPath");
      window.history.replaceState({}, document.title, postLoginRedirectPath);
      return;
    }

    window.history.replaceState({}, document.title, "/workflows-schema");
  },
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};
