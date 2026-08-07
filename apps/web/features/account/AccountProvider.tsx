"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { z } from "zod";
import {
  getPlayerStatistics,
  PLAYER_STATISTICS_IMPORT_KEY,
  PLAYER_STATISTICS_KEY,
  type PlayerStatistics,
} from "@/features/player";
import { apiRequest } from "@/lib/api/client";
import { browserStorage } from "@/lib/storage";

const userSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  name: z.string().nullable(),
});
const sessionSchema = z.object({ user: userSchema.nullable() });
const statisticsSchema = z.object({
  gamesPlayed: z.number(),
  totalWordsFound: z.number(),
  highestScore: z.number(),
  longestWord: z.string(),
  averageScore: z.number(),
  totalScore: z.number(),
});
type User = z.infer<typeof userSchema>;

interface AccountContextValue {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}
const AccountContext = createContext<AccountContextValue | null>(null);

async function syncGuestStatistics() {
  const statistics = getPlayerStatistics(browserStorage);
  let importId = browserStorage.get<string>(PLAYER_STATISTICS_IMPORT_KEY);
  if (!importId) {
    importId = crypto.randomUUID();
    browserStorage.set(PLAYER_STATISTICS_IMPORT_KEY, importId);
  }
  const merged = await apiRequest(
    "/account/statistics/sync",
    statisticsSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ importId, statistics }),
    },
  );
  browserStorage.set<PlayerStatistics>(PLAYER_STATISTICS_KEY, merged);
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    const session = await apiRequest("/account/session", sessionSchema);
    setUser(session.user);
    if (session.user) await syncGuestStatistics();
    setLoading(false);
  }, []);
  useEffect(() => {
    // Session discovery is an external-system synchronization performed on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh().catch(() => setLoading(false));
  }, [refresh]);
  const logout = async () => {
    await apiRequest("/account/logout", z.object({ success: z.boolean() }), {
      method: "POST",
    });
    setUser(null);
  };
  return (
    <AccountContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used within AccountProvider");
  return value;
}
