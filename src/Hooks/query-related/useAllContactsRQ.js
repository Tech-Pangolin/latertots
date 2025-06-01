import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider"
import { collection, query, where } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";
import { useEffect, useMemo } from "react";

export function useAllContactsRQ() {
  const { dbService } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['adminAllContacts'];

  const allContacts = useMemo( () => query(
    collection(db, COLLECTIONS.CONTACTS),
    where("archived", "==", "false"),     // TODO: Make sure dummy data has this field set correctly
  ), [])

  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(allContacts, true),
    onError: (error) => console.error("Error fetching /Contacts data:", error),
  })

  useEffect(() => {
    const unsub = dbService.subscribeDocs(allContacts, fresh => {
      queryClient.setQueryData(queryKey, fresh);
    }, true);
    return () => unsub();
  },[allContacts, dbService, queryKey, queryClient])

  return queryResult;
}