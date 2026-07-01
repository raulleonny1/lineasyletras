export type UserGender = "hombre" | "mujer";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  birthDate: string;
  country: string;
  gender: UserGender;
  createdAt?: string;
}

export type UserRegistrationInput = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  birthDate: string;
  country: string;
  gender: UserGender;
  pin: string;
  privacyAccepted: boolean;
};

export type UserLoginInput = {
  pin: string;
};
