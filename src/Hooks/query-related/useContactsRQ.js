import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider"
import { collection, documentId, query, where } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";
import { useEffect, useMemo } from "react";

export function useContactsRQ() {
  const { dbService, currentUser } = useAuth();
  const isAdmin = currentUser?.Role === 'admin';
  const queryClient = useQueryClient();
  const queryKey = isAdmin ? ['adminAllContacts'] : ['fetchContacts', currentUser.Email];

  const allContacts = useMemo(() => query(
    collection(db, COLLECTIONS.CONTACTS),
    where("archived", "==", false),     // TODO: Make sure dummy data has this field set correctly
  ), [])

  const myContacts = useMemo(() => {
    if (currentUser.Contacts.length === 0) return null; // If the user has no contacts, return null to avoid query errors
    return query(
      collection(db, COLLECTIONS.CONTACTS),
      where(documentId(), "in", currentUser.Contacts), // This only allows up to 30 contacts before the "in" operator fails
      where("archived", "==", false)
    )
  }, [])

  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(isAdmin ? allContacts : myContacts),
    onError: (error) => console.error("Error fetching /Contacts data:", error),
    enabled: currentUser.Contacts.length > 0 || isAdmin, 
    initialData: []
  })

  useEffect(() => {
    if (!myContacts && !isAdmin) return; // If the user has no contacts and is not admin, do not set up a listener
    
    const unsub = dbService.subscribeDocs(isAdmin ? allContacts : myContacts, fresh => {
      queryClient.setQueryData(queryKey, fresh);
    });
    return () => unsub();
  }, [allContacts, dbService, queryKey, queryClient])

  return queryResult;
}