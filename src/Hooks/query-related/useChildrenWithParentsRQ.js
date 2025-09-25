import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useMemo } from "react";
import { collection, query, where, getDocs, getDoc, documentId } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";
import { logger } from "../../Helpers/logger"; // optional if you have a logger

export function useChildrenWithParentsRQ() {
    const queryClient = useQueryClient();
    const { dbService } = useAuth(); // assumes dbService.subscribeDocs exists
    const queryKey = ["usersWithChildren"];

    // Base query to get all users (adjust filters if needed)
    const usersQuery = useMemo(() => {
        return query(collection(db, COLLECTIONS.USERS));
    }, []);

    // Fetch all users and their children
    const queryResult = useQuery({
        queryKey,
        queryFn: async () => {
            const usersSnap = await getDocs(usersQuery);
            const results = [];
            try {
                console.log(usersSnap.docs.length)
                for (const userDoc of usersSnap.docs) {
                    const userData = userDoc.data();
                    const childIds = userData.Children || []; // Array of child IDs
                    let childrenData = [];

                    if (childIds.length > 0) {
                        const childrenRef = collection(db, COLLECTIONS.CHILDREN);
                        for (let i = 0; i < childIds.length; i++) {
                            const childrenQuery = query(childrenRef, where(documentId(), "==", childIds[i]));
                            const childrenSnap = await getDocs(childrenQuery);
                            results.push({
                                id: userDoc.id,
                                ...childrenSnap.docs[0]?.data(),
                                parentName: userData.Name,
                                parentEmail: userData.Email,
                                parentPhone: userData.CellNumber,
                            });
                        }
                    }
                }
            } catch (err) { logger?.error?.("Error fetching users with children:", err); }
            return results;
        },
        onError: (err) => {
            console.error("Error fetching users with children:", err);
        },
    });

    // Optional: real-time updates for Users
    useEffect(() => {
        const unsubscribe = dbService.subscribeDocs(
            usersQuery,
            async (freshUsers) => {
                try {
                    const results = [];
                    for (const userData of freshUsers) {
                        const childIds = userData.Children || [];
                        if (childIds.length > 0) {
                            const childrenRef = collection(db, COLLECTIONS.CHILDREN);
                            for (let i = 0; i < childIds.length; i++) {
                                const childrenQuery = query(childrenRef, where(documentId(), "==", childIds[i]));
                                const childrenSnap = await getDocs(childrenQuery);
                                results.push({
                                    id: userData.id,
                                    ...childrenSnap.docs[0]?.data(),
                                    parentName: userData.Name,
                                    parentEmail: userData.Email,
                                    parentPhone: userData.CellNumber,
                                });
                            }
                        }                    
                    }

                    queryClient.setQueryData(queryKey, results);
                } catch (err) {
                    logger?.error?.("Error refreshing users with children:", err);
                }
            },
            true
        );

        return () => unsubscribe();
    }, [dbService, usersQuery, queryClient, queryKey]);

    return queryResult;
}
