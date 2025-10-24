import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { logger } from "../../Helpers/logger";

/**
 * Custom hook to fetch payment history from Stripe via cloud function
 * @returns {Object} - React Query result with payment history data
 */
export function usePaymentHistoryRQ() {
  const { currentUser } = useAuth();
  
  const queryKey = ['paymentHistory', currentUser?.uid];
  
  const queryResult = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const getPaymentHistory = httpsCallable(functions, 'getPaymentHistory');
        const result = await getPaymentHistory({ userId: currentUser.uid });
        return result.data.payments;
      } catch (error) {
        logger.error("Error fetching payment history:", error);
        throw error;
      }
    },
    onError: (error) => {
      logger.error("Error fetching payment history:", error);
    },
    enabled: !!currentUser,
    placeholderData: [],
    staleTime: 15 * 1000,
  });
  
  return {
    ...queryResult,
  };
}
