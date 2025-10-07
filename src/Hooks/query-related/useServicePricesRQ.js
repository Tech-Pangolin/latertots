import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useMemo, useCallback } from "react";
import { collection, query } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";
import { logger } from "../../Helpers/logger";

export function useServicePricesRQ() {
  const { dbService, currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const queryKey = ['servicePrices'];

  const servicePricesQuery = useMemo(() => query(
    collection(db, COLLECTIONS.SERVICE_PRICES)
  ), []);
  
  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(servicePricesQuery),
    onError: (error) => {
      logger.error("Error fetching service prices:", error);
    },
    enabled: !!currentUser,
    initialData: [],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Create lookup map keyed by stripeId for O(1) lookups
  const servicePricesMap = useMemo(() => {
    if (!queryResult.data) return {};
    
    const map = {};
    queryResult.data.forEach(price => {
      map[price.stripeId] = price;
    });
    
    return map;
  }, [queryResult.data]);
  
  // Lookup helper function
  const getServicePrice = useCallback((lookupUid) => {
    if (!lookupUid) return null;
    
    const servicePrice = servicePricesMap[lookupUid];
    
    if (!servicePrice) {
      logger.warn(`Service price not found for UID: ${lookupUid}`);
      return null;
    }
    
    return servicePrice;
  }, [servicePricesMap]);
  
  // Real-time subscription for price updates
  useEffect(() => {
    if (!currentUser) return;
    
    let unsubscribe;
    let isSubscribed = true;
    
    const setupSubscription = async () => {
      if (isSubscribed) {
        unsubscribe = await dbService.subscribeDocs(servicePricesQuery, fresh => {
          if (isSubscribed) {
            queryClient.setQueryData(queryKey, fresh);
          }
        });
      }
    };
    
    setupSubscription();
    
    return () => {
      isSubscribed = false;
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [queryClient,  dbService]);
  
  return {
    getServicePrice,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    data: queryResult.data
  };
}
