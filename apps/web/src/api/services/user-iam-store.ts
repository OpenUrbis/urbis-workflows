import { UserIamDetailsResponse } from "../types/iam.dto";

/**
 * Singleton service that stores the current user's IAM details
 * for use across all API clients
 */
class UserIamStore {
  private static instance: UserIamStore;
  private _userIam: UserIamDetailsResponse | null = null;
  private listeners: Set<(userIam: UserIamDetailsResponse | null) => void> = new Set();

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): UserIamStore {
    if (!UserIamStore.instance) {
      UserIamStore.instance = new UserIamStore();
    }
    return UserIamStore.instance;
  }

  /**
   * Get the current user's IAM details
   */
  public getUserIam(): UserIamDetailsResponse | null {
    return this._userIam;
  }

  /**
   * Set the current user's IAM details
   * @param userIam The user's IAM details
   */
  public setUserIam(userIam: UserIamDetailsResponse | null): void {
    this._userIam = userIam;
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(userIam);
      } catch (error) {
        console.error('Error in userIam listener:', error);
      }
    });
  }

  /**
   * Register a listener to be notified when userIam changes
   * @param listener Function to be called when userIam changes
   * @returns Function to unregister the listener
   */
  public addListener(listener: (userIam: UserIamDetailsResponse | null) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call the listener with the current value
    if (this._userIam) {
      listener(this._userIam);
    }
    
    // Return a function to remove the listener
    return () => {
      this.listeners.delete(listener);
    };
  }
}

// Export the singleton instance
export const userIamStore = UserIamStore.getInstance(); 