import { createContext, useContext, useState, type ReactNode } from 'react';

export type StylePreference =
  | 'Classy'
  | 'Street wear'
  | 'Professional'
  | 'Old-money'
  | 'Bohemian'
  | 'Minimalist'
  | 'Sporty'
  | 'Casual';

type UserContextType = {
  userId: number | null;
  age: number | null;
  gender: string | null;
  name: string | null;
  stylePreference: StylePreference | null;
  setUser: (id: number, age: number, gender: string, stylePreference: StylePreference | null) => void;
  setOnboardingProfile: (name: string, gender: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [stylePreference, setStylePreference] = useState<StylePreference | null>(null);

  const setUser = (id: number, a: number, g: string, s: StylePreference | null) => {
    setUserId(id);
    setAge(a);
    setGender(g);
    setStylePreference(s);
  };

  const setOnboardingProfile = (n: string, g: string) => {
    setName(n.trim() || null);
    setGender(g);
  };

  return (
    <UserContext.Provider
      value={{ userId, age, gender, name, stylePreference, setUser, setOnboardingProfile }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
