import { WebStorageStateStore } from "oidc-client-ts";

export const oidcConfig = {
  authority:
    import.meta.env.VITE_OIDC_AUTHORITY || "http://localhost:3000/auth/oidc",
  client_id:
    import.meta.env.VITE_OIDC_CLIENT_ID ||
    "94a86322-269e-44df-803a-534c0382215d",
  redirect_uri:
    import.meta.env.VITE_OIDC_REDIRECT_URI || window.location.origin,
  silent_redirect_uri:
    import.meta.env.VITE_OIDC_SILENT_REDIRECT_URI ||
    `${window.location.origin}/silent-renew.html`,
  post_logout_redirect_uri: window.location.origin,
  scope: "openid profile email",
  response_type: "code",
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};
