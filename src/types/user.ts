export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUri?: string | null;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}
