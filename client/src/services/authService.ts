// Simulated user database
const USERS_DATABASE = [
  { id: 1, username: "admin", name: "Administrador" },
  { id: 2, username: "user1", name: "Usuario Uno" },
  { id: 3, username: "user2", name: "Usuario Dos" },
  { id: 4, username: "testuser", name: "Usuario de Prueba" },
  { id: 5, username: "demo", name: "Usuario Demo" },
  { id: 6, username: "guest", name: "Invitado" },
];

export interface User {
  id: number;
  username: string;
  name: string;
}

export class AuthService {
  /**
   * Simulates an API call to validate a username
   * @param username The username to validate
   * @returns Promise that resolves to user data if valid, null if invalid
   */
  static async validateUser(username: string): Promise<User | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    
    const user = USERS_DATABASE.find(u => 
      u.username.toLowerCase() === username.toLowerCase()
    );
    
    return user || null;
  }

  /**
   * Get list of valid usernames for testing purposes
   * @returns Array of valid usernames
   */
  static getValidUsernames(): string[] {
    return USERS_DATABASE.map(u => u.username);
  }

  /**
   * Get current logged in user from localStorage
   * @returns User data if logged in, null otherwise
   */
  static getCurrentUser(): User | null {
    const username = localStorage.getItem("username");
    if (!username) return null;
    
    return USERS_DATABASE.find(u => u.username === username) || null;
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