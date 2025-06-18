import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";


export function useAllUsersRQ() {
  const queryClient = useQueryClient();
  const { dbService } = useAuth();
  const queryKey = ['adminAllUsers'];

  // First, build the query
  // Remember that multiple constraints will require an index in Firestore
  const allUsersQuery = useMemo(() => query(
    collection(db, COLLECTIONS.USERS),
    where("archived", "==", false),
  ), [])
  
  // Next, get the initial fetch of data
  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(allUsersQuery, true),
    onError: (error) => {
      console.error("Error fetching /Users data:", error);
    },
  })

  // Lastly, set up a real-time listener for changes
  useEffect(() => {
    const unsubscribe = dbService.subscribeDocs(allUsersQuery, fresh => {
      queryClient.setQueryData(queryKey, fresh);
    }, true);
    return () => unsubscribe();
  }, [dbService, queryClient, allUsersQuery, queryKey]);

  return queryResult;
}