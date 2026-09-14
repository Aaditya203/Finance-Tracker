import { useCurrentUser } from "@/components/providers/current-user-provider";
import { DashboardDataResponse } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { getDashboardDataApi } from "../api/dashboard";

export function useDashboard(){
    const {user,isMounted,loading:authLoading} = useCurrentUser();
    const [data,setData] = useState<DashboardDataResponse | null>(null);
    const [isLoading,setIsLoading] = useState(true);
    const [error,setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async()=>{
        setIsLoading(true);
        setError(null);
        try{
            const result = await getDashboardDataApi();
            setData(result);
        }catch(error){
            setError(error instanceof Error? error.message: "Failed to fetch dashboard")
        }finally{
            setIsLoading(false);
        }
    },[])

    useEffect(() => {
        if (isMounted && !authLoading) {
            fetchDashboard();
        }
    }, [isMounted, authLoading, user?.id, fetchDashboard]);

    return{
        data,
        isLoading: isLoading || authLoading,
        error,
        refetch:fetchDashboard,
        currentUser:user,
        isMounted,
        
    }

}