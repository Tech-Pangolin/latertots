import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { collection, query, where } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";
import { logger } from "../../Helpers/logger";
import { useMemo } from "react";

/**
 * Custom hook to fetch unpaid pickup payments (reservations with status='picked-up')
 * @returns {Object} - React Query result with unpaid pickup payments
 */
export function useUnpaidPickupPaymentsRQ() {
  const { dbService, currentUser } = useAuth();
  
  const queryKey = ['unpaidPickupPayments', currentUser?.uid];
  
  const unpaidPickupQuery = useMemo(() => query(
    collection(db, COLLECTIONS.RESERVATIONS),
    where('userId', '==', currentUser?.uid),
    where('status', '==', 'picked-up')
  ), [currentUser?.uid]);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const result = await dbService.fetchDocs(unpaidPickupQuery);
        
        // Filter results to only include reservations with finalCheckoutUrl
        const unpaidPayments = result.filter(reservation => 
          reservation.dropOffPickUp?.finalCheckoutUrl && 
          reservation.dropOffPickUp.finalCheckoutUrl !== null
        );
        
        
        return unpaidPayments;
      } catch (error) {
        logger.error("Error fetching unpaid pickup payments:", error);
        throw error;
      }
    },
    onError: (error) => {
      logger.error("Error fetching unpaid pickup payments:", error);
    },
    enabled: !!currentUser,
    placeholderData: []
  });
}
