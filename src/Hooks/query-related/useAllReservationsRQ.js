import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useMemo, useState } from "react";
import { collection, query, where, orderBy, limit, getCountFromServer, getDocs } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";

export function useAllReservationsRQ({ 
  enabled = true, 
  page = 1, 
  pageSize = 25 
} = {}) {
  const queryClient = useQueryClient();
  const { dbService } = useAuth();
  const [totalCount, setTotalCount] = useState(0);
  
  const queryKey = ['adminAllReservations', page, pageSize];

  // Build the base query for count
  const countQuery = useMemo(() => query(
    collection(db, COLLECTIONS.RESERVATIONS),
    where("archived", "!=", true)
  ), []);

  // Build the base query for getting all document IDs
  const baseQuery = useMemo(() => query(
    collection(db, COLLECTIONS.RESERVATIONS),
    where("archived", "!=", true),
    orderBy("start", "desc")
  ), []);
  
  // Count query
  const countQueryResult = useQuery({
    queryKey: ['adminAllReservationsCount'],
    queryFn: async () => {
      const snapshot = await getCountFromServer(countQuery);
      return snapshot.data().count;
    },
    enabled,
    onError: (error) => {
      console.error("Error fetching reservations count:", error);
    },
  });

  // Data query - fetch all IDs first, then paginate and fetch full docs
  const dataQueryResult = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('Fetching page', page, 'with pageSize', pageSize);
      
      // First, get all document IDs (lightweight)
      const allDocsSnapshot = await getDocs(baseQuery);
      const allDocIds = allDocsSnapshot.docs.map(doc => doc.id);
      
      // Calculate pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pageDocIds = allDocIds.slice(startIndex, endIndex);
      
      console.log(`Page ${page} of ${Math.ceil(allDocIds.length / pageSize)}: showing docs ${startIndex + 1}-${Math.min(endIndex, allDocIds.length)} of ${allDocIds.length} (${pageDocIds.length} docs on this page)`);
      
      // Fetch full documents for this page
      const pageDocs = [];
      for (const docId of pageDocIds) {
        const docSnapshot = allDocsSnapshot.docs.find(doc => doc.id === docId);
        if (docSnapshot) {
          pageDocs.push({ id: docSnapshot.id, ...docSnapshot.data() });
        }
      }
      
      return pageDocs;
    },
    enabled,
    staleTime: 15000, // 15 seconds between refetches
    onError: (error) => {
      console.error("Error fetching /Reservations data:", error);
    },
  });

  // Update total count when count query completes
  useEffect(() => {
    if (countQueryResult.data !== undefined) {
      setTotalCount(countQueryResult.data);
    }
  }, [countQueryResult.data]);


  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  // Navigation functions
  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      // The component should update the page prop to trigger a new query
      return newPage;
    }
    return page;
  };


  return {
    data: dataQueryResult.data || [],
    isLoading: dataQueryResult.isLoading || countQueryResult.isLoading,
    isError: dataQueryResult.isError || countQueryResult.isError,
    error: dataQueryResult.error || countQueryResult.error,
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage,
    hasPreviousPage,
    goToPage,
  };
}
