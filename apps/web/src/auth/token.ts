import { User } from "oidc-client-ts";
import { oidcConfig } from "./oidc-config";

/**
 * Get the current OIDC access token from the user store.
 * This is a synchronous helper that reads from localStorage where oidc-client-ts stores the user session.
 * Use this in place of `localStorage.getItem("token")` throughout the app.
 */
export function getAccessToken(): string | null {
  const storageKey = `oidc.user:${oidcConfig.authority}:${oidcConfig.client_id}`;
  const raw = localStorage.getItem(storageKey);

  if (!raw) return null;

  try {
    const user = User.fromStorageString(raw);
    if (user.expired) return null;
    return user.access_token;
  } catch {
    return null;
  }
}
