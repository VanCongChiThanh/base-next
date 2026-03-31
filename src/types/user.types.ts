import { Role } from "./enums";
import { VerificationLevel } from "./enums";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isEmailVerified: boolean;
  avatarUrl: string | null;
  verificationLevel?: VerificationLevel;
  createdAt: string;
}
