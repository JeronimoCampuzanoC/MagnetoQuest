export interface User {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  sector?: string | null;
  target_position?: string | null;
  city?: string | null;
}

export class AuthService {
  /**
   * Validates a username against the real database
   * @param username The username to validate
   * @returns Promise that resolves to user data if valid, null if invalid
   */
  static async validateUser(username: string): Promise<User | null> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (response.status === 404) {
        return null; // User not found
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.user || null;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Get list of all users from database for testing purposes
   * @returns Array of usernames
   */
  static async getValidUsernames(): Promise<string[]> {
    try {
      const response = await fetch('/api/appusers');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const users = await response.json();
      return users.map((user: any) => user.name);
    } catch (error) {
      console.error('Error fetching users:', error);
      return ['Error loading users'];
    }
  }

  /**
   * Register a new user
   * @param name Username
   * @param email Email (optional)
   * @returns Promise that resolves to user data if successful
   */
  static async registerUser(name: string, email?: string): Promise<User | null> {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim(), email: email?.trim() }),
      });

      if (response.status === 409) {
        // User already exists
        const data = await response.json();
        return {
          id: data.user.id_app_user,
          username: data.user.name,
          name: data.user.name,
          email: data.user.email
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.user.id_app_user,
        username: data.user.name,
        name: data.user.name,
        email: data.user.email
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Get current logged in user from localStorage
   * @returns User data if logged in, null otherwise
   */
  static getCurrentUser(): User | null {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) return null;
    
    try {
      return JSON.parse(userInfo);
    } catch (error) {
      console.error('Error parsing user info:', error);
      return null;
    }
  }

  /**
   * Get current logged in user ID
   * @returns User ID if logged in, null otherwise
   */
  static getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.id || null;
  }

  /**
   * Save user session to localStorage
   * @param user User to save
   */
  static saveSession(user: User): void {
    localStorage.setItem("username", user.username);
    localStorage.setItem("userInfo", JSON.stringify(user));
  }

  /**
   * Clear user session from localStorage
   */
  static clearSession(): void {
    localStorage.removeItem("username");
    localStorage.removeItem("userInfo");
  }
}