import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";


export function useAllUsersRQ() {
  const queryClient = useQueryClient();
  const { dbService, currentUser } = useAuth();
  const queryKey = ['adminAllUsers'];


  // First, build the query
  // Remember that multiple constraints will require an index in Firestore
  const allUsersQuery = useMemo(() => {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where("archived", "==", false),
    );
    return q;
  }, [])
  
  // Next, get the initial fetch of data
  const queryResult = useQuery({
    queryKey,
      queryFn: async () => {
        const result = await dbService.fetchDocs(allUsersQuery, false);
        return result;
      },
    onError: (error) => {
      console.error("❌ HOOK: Error fetching users data", error);
    },
    enabled: !!dbService && !!currentUser, // Only run if dbService and currentUser are available
    initialData: []
  })


  // Lastly, set up a real-time listener for changes
  useEffect(() => {
    if (!dbService) return;
    
    let isSubscribed = true; // Flag to prevent updates after cleanup
    
    const unsubscribe = dbService.subscribeDocs(allUsersQuery, fresh => {
      if (!isSubscribed) return; // Prevent updates after cleanup
      
      // Get current data to compare
      const currentData = queryClient.getQueryData(queryKey);
      
      // Only update if data has actually changed
      if (JSON.stringify(currentData) !== JSON.stringify(fresh)) {
        queryClient.setQueryData(queryKey, fresh);
      } 
    }, false); // Use same auth level as query function
    
    return () => {
      isSubscribed = false; // Prevent further updates
      unsubscribe();
    };
  }, [dbService, queryClient]); // Removed queryKey from dependencies to prevent re-subscription

  return queryResult;
}