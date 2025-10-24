import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { logger } from "../../Helpers/logger";

/**
 * Custom hook to fetch registered payment methods from Stripe via cloud function
 * @returns {Object} - React Query result with payment methods data
 */
export function usePaymentMethodsRQ() {
  const { currentUser } = useAuth();
  
  const queryKey = ['paymentMethods', currentUser?.uid];
  
  const queryResult = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const getPaymentMethods = httpsCallable(functions, 'getPaymentMethods');
        const result = await getPaymentMethods({ userId: currentUser.uid });
        return result.data.paymentMethods;
      } catch (error) {
        logger.error("Error fetching payment methods:", error);
        throw error;
      }
    },
    onError: (error) => {
      logger.error("Error fetching payment methods:", error);
    },
    enabled: !!currentUser,
    placeholderData: [],
    staleTime: 30 * 1000, // 30 seconds
  });
  
  return {
    ...queryResult,
  };
}
