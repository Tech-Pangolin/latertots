import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { collection, documentId, query, where } from "firebase/firestore";
import { db } from "../../config/firestore";
import { useEffect, useMemo } from "react";
import { COLLECTIONS } from "../../Helpers/constants";

export function useChildrenRQ() {
  const { dbService, currentUser } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.Role === 'admin';
  const queryKey = isAdmin ? ['adminAllChildren'] : ['fetchChildren', currentUser.Email];

  // First, build the query
  const allChildren = useMemo(() => query(
    collection(db, COLLECTIONS.CHILDREN),
    where("archived", "==", false)
  ), [])

  const myChildren = useMemo(() => {
    return query(
      collection(db, COLLECTIONS.CHILDREN),
      where(documentId(), "in", currentUser.Children), // This only allows up to 30 children before the "in" operator fails
      where("archived", "==", false) 
    )
  },[])

  // Second, get the initial fetch of data
  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(isAdmin? allChildren : myChildren, isAdmin ? true : false),
    onError: (error) => {
      console.error("Error fetching /Children data:", error);
    },
  })

  // Third, set up a real-time listener for changes
  useEffect(() => {
    const unsubscribe = dbService.subscribeDocs(isAdmin ? allChildren : myChildren, fresh => {
      queryClient.setQueryData(queryKey, fresh);
    }, isAdmin ? true : false)
    return () => unsubscribe();
  }, [dbService, queryClient, allChildren, myChildren, queryKey]);

  return queryResult;
}