import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useMemo, useCallback } from "react";
import { collection, query, where } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";
import _ from "lodash";


export function useAllUsersRQ() {
  const queryClient = useQueryClient();
  const { dbService, currentUser } = useAuth();
  const queryKey = ['adminAllUsers'];

  // Add admin role validation
  const isAdmin = currentUser?.Role === 'admin';


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
      // Validate admin role before fetching
      if (!isAdmin) {
        throw new Error("Unauthorized access. Admin role required.");
      }
      const result = await dbService.fetchDocs(allUsersQuery);
      return result;
    },
    onError: (error) => {
      console.error("❌ HOOK: Error fetching users data", error);
    },
    enabled: !!dbService && !!currentUser && isAdmin, // Only enable for admin users
    placeholderData: [],
    staleTime: 15 * 1000,
  })


  // Lastly, set up a real-time listener for changes
  useEffect(() => {
    if (!dbService || !isAdmin) return; // Only set up subscription for admin users
    
    let isSubscribed = true; // Flag to prevent updates after cleanup
    
    let unsubscribe;
    const setupSubscription = async () => {
      unsubscribe = await dbService.subscribeDocs(allUsersQuery, fresh => {
        if (!isSubscribed) return; // Prevent updates after cleanup
      
      // Get current data to compare
      const currentData = queryClient.getQueryData(queryKey);
      
      // Only update if data has actually changed
      if (!_.isEqual(currentData, fresh)) {
        queryClient.setQueryData(queryKey, fresh);
      }
    }); 
    };
    
    setupSubscription();
    
    return () => {
      isSubscribed = false; 
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [dbService, queryClient, isAdmin]); // Add isAdmin to dependencies

  return queryResult;
}