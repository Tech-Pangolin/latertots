import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { collection, query, where } from "firebase/firestore";
import { db } from "../../config/firestore";
import { useEffect, useMemo } from "react";
import { COLLECTIONS } from "../../Helpers/constants";

export function useAllChildrenRQ() {
  const { dbService } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['adminAllChildren'];

  // First, build the query
  const allChildren = useMemo(() => query(
    collection(db, COLLECTIONS.CHILDREN),
    where("archived", "==", false) // Ensure we only fetch non-archived children
  ), [])

  // Second, get the initial fetch of data
  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(allChildren, true),
    onError: (error) => {
      console.error("Error fetching /Children data:", error);
    },
  })

  // Third, set up a real-time listener for changes
  useEffect(() => {
    const unsubscribe = dbService.subscribeDocs(allChildren, fresh => {
      queryClient.setQueryData(queryKey, fresh);
    }, true)
    return () => unsubscribe();
  }, [dbService, queryClient, allChildren, queryKey]);

  return queryResult;
}