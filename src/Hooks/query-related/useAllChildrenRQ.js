import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { collection } from "firebase/firestore";
import { db } from "../../config/firestore";
import { useEffect, useMemo } from "react";
import { COLLECTIONS } from "../../Helpers/constants";

export function useAllChildrenRQ() {
  const { dbService } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['adminAllChildren']);

  // First, build the query
  const collectionRef = useMemo(() => collection(db, COLLECTIONS.CHILDREN));

  // Second, get the initial fetch of data
  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(collectionRef, true),
    onError: (error) => {
      console.error("Error fetching /Children data:", error);
    },
  })

  // Third, set up a real-time listener for changes
  useEffect(() => {
    const unsubscribe = dbService.subscribeDocs(collectionRef, fresh => {
      queryClient.setQueryData(queryKey, fresh);
    }, true)
    return () => unsubscribe();
  }, [dbService, queryClient, collectionRef, queryKey]);

  return queryResult;
}