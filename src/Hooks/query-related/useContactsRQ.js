import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider"
import { collection, documentId, query, where } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";
import { useEffect, useMemo } from "react";
import { logger } from "../../Helpers/logger";

export function useContactsRQ(forceUserMode = false) {
  const { dbService, currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  // Only use admin mode if user is admin AND not forced to user mode
  const isAdmin = currentUser?.Role === 'admin' && !forceUserMode;
  
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
  }, [JSON.stringify(currentUser.Contacts)]);

  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(isAdmin ? allContacts : myContacts),
    onError: (error) => logger.error("Error fetching /Contacts data:", error),
    enabled: currentUser.Contacts.length > 0 || isAdmin, 
    placeholderData: [],
    staleTime: 15 * 1000,
  })

  useEffect(() => {
    if (!myContacts && !isAdmin) return; // If the user has no contacts and is not admin, do not set up a listener

    let unsub;
    let isSubscribed = true;
    
    const setupSubscription = async () => {
      if (isSubscribed) {
        unsub = await dbService.subscribeDocs(isAdmin ? allContacts : myContacts, fresh => {
          if (isSubscribed) {
            queryClient.setQueryData(queryKey, fresh);
          }
        });
      }
    };
    
    setupSubscription();
    return () => {
      isSubscribed = false;
      if (unsub && typeof unsub === 'function') {
        unsub();
      }
    };
  }, [allContacts, dbService, queryKey, queryClient])

  return queryResult;
}