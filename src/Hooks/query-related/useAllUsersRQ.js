import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useMemo } from "react";
import { collection } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";


export function useAllUsersRQ() {
  const queryClient = useQueryClient();
  const { dbService } = useAuth();
  const queryKey = ['adminAllUsers'];

  // First, build the query
  const collectionRef = useMemo(() => collection(db, COLLECTIONS.USERS));

  // Next, get the initial fetch of data
  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(collectionRef, true),
    onError: (error) => {
      console.error("Error fetching /Users data:", error);
    },
  })

  // Lastly, set up a real-time listener for changes
  useEffect(() => {
    const unsubscribe = dbService.subscribeDocs(collectionRef, fresh => {
      queryClient.setQueryData(queryKey, fresh);
    }, true);
    return () => unsubscribe();
  }, [dbService, queryClient, collectionRef, queryKey]);

  return queryResult;
}