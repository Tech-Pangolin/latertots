import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { collection, documentId, DocumentReference, query, where } from "firebase/firestore";
import { db } from "../../config/firestore";
import { useEffect, useMemo } from "react";
import { COLLECTIONS } from "../../Helpers/constants";
import { logger } from "../../Helpers/logger";
export function useChildrenRQ(forceUserMode = false) {
  const { dbService, currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  // Only use admin mode if user is admin AND not forced to user mode
  const isAdmin = currentUser?.Role === 'admin' && !forceUserMode;
  
  const queryKey = useMemo(() => {
    return isAdmin ? ['adminAllChildren'] : ['fetchChildren', currentUser.Email];
  }, [currentUser?.Email, isAdmin]);

  // First, build the query
  const allChildrenQuery = useMemo(() => query(
    collection(db, COLLECTIONS.CHILDREN),
    where("archived", "==", false)
  ), [])

  const myChildrenQuery = useMemo(() => {
    if (currentUser.Children.length === 0) return null; // If the user has no children, return null to avoid query errors
    return query(
      collection(db, COLLECTIONS.CHILDREN),
      where(documentId(), "in", currentUser.Children), // This only allows up to 30 children before the "in" operator fails
      where("archived", "==", false)
    )
  }, [JSON.stringify(currentUser.Children)]);

  // Second, get the initial fetch of data
  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(isAdmin ? allChildrenQuery : myChildrenQuery),
    onError: (error) => {
      logger.error("Error fetching /Children data:", error);
    },
    enabled: currentUser.Children.length > 0 || isAdmin, // Only run if the user has children or is an admin
    initialData: []
  })

  // Third, set up a real-time listener for changes
  useEffect(() => {
    if (!myChildrenQuery && !isAdmin) return; // If the user has no children and is not admin, do not set up a listener
    let unsubscribe;
    let isSubscribed = true;
    
    const setupSubscription = async () => {
      if (isSubscribed) {
        unsubscribe = await dbService.subscribeDocs(isAdmin ? allChildrenQuery : myChildrenQuery, fresh => {
          if (isSubscribed) {
            queryClient.setQueryData(queryKey, fresh);
          }
        });
      }
    };
    
    setupSubscription();
    return () => {
      isSubscribed = false;
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [dbService, queryClient, allChildrenQuery, myChildrenQuery, queryKey]);

  return queryResult;
}