import { useCurrentUser } from "@/components/providers/current-user-provider";
import { DashboardDataResponse } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { getDashboardDataApi } from "../api/dashboard";

export function useDashboard() {
    const { user, isMounted, loading: authLoading } = useCurrentUser();
    const [data, setData] = useState<DashboardDataResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshIndex, setRefreshIndex] = useState(0);

    const refetch = useCallback(() => {
        setIsLoading(true);
        setRefreshIndex((prev) => prev + 1);
    }, []);

    useEffect(() => {
        if (!isMounted || authLoading) return;
        let isCancelled = false;

        getDashboardDataApi()
            .then((result) => {
                if (!isCancelled) {
                    setData(result);
                    setError(null);
                }
            })
            .catch((err) => {
                if (!isCancelled) {
                    setError(err instanceof Error ? err.message : "Failed to fetch dashboard");
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [isMounted, authLoading, user, refreshIndex]);

    return {
        data,
        isLoading: isLoading || authLoading,
        error,
        refetch,
        currentUser: user,
        isMounted,
    };
}