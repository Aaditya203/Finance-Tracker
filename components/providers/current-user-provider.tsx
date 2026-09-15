"use client";

import { createContext, useContext, useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { getCurrentUserApi } from "@/lib/api/auth";

export type WorkspaceUser = { id: string; name: string; email: string; telegramUserID?: string | null };

interface CurrentUserContextType {
  user: WorkspaceUser | null;
  loading: boolean;
  isMounted: boolean;
  refetchUser: () => Promise<void>;
}

const emptySubscribe = () => () => {};

const CurrentUserContext = createContext<CurrentUserContextType>({
  user: null,
  loading: true,
  isMounted: false,
  refetchUser: async () => {},
});

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const refetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCurrentUserApi();
      if (data && typeof data === "object" && "id" in data && data.id) {
        setUser(data as WorkspaceUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    getCurrentUserApi()
      .then((data) => {
        if (!isCancelled) {
          if (data && typeof data === "object" && "id" in data && data.id) {
            setUser(data as WorkspaceUser);
          } else {
            setUser(null);
          }
        }
      })
      .catch(() => {
        if (!isCancelled) setUser(null);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <CurrentUserContext.Provider value={{ user, loading, isMounted, refetchUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}

