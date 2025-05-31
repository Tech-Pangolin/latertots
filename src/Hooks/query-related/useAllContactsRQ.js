import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider"
import { collection } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";
import { useEffect, useMemo } from "react";

export function useAllContactsRQ() {
  const { dbService } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['adminAllContacts']);

  const collectionRef = useMemo( () => collection(db, COLLECTIONS.CONTACTS) );

  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(collectionRef, true),
    onError: (error) => console.error("Error fetching /Contacts data:", error),
  })

  useEffect(() => {
    const unsub = dbService.subscribeDocs(collectionRef, fresh => {
      queryClient.setQueryData(queryKey, fresh);
    }, true);
    return () => unsub();
  },[collectionRef, dbService, queryKey, queryClient])

  return queryResult;
}