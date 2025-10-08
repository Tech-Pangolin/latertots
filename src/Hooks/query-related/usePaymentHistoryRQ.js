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
  
  console.log('🔍 [usePaymentHistoryRQ] Hook called with currentUser:', currentUser);
  console.log('🔍 [usePaymentHistoryRQ] currentUser?.uid:', currentUser?.uid);
  console.log('🔍 [usePaymentHistoryRQ] enabled condition:', !!currentUser);
  
  const queryKey = ['paymentHistory', currentUser?.uid];
  
  const queryResult = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        console.log('🔍 [usePaymentHistoryRQ] Starting payment history fetch for user:', currentUser?.uid);
        const getPaymentHistory = httpsCallable(functions, 'getPaymentHistory');
        const result = await getPaymentHistory({ userId: currentUser.uid });
        console.log('✅ [usePaymentHistoryRQ] Payment history fetch successful:', result.data);
        return result.data.payments;
      } catch (error) {
        console.error('❌ [usePaymentHistoryRQ] Payment history fetch failed:', error);
        logger.error("Error fetching payment history:", error);
        throw error; // Re-throw so React Query can handle it
      }
    },
    onError: (error) => {
      console.error('❌ [usePaymentHistoryRQ] React Query error:', error);
      logger.error("Error fetching payment history:", error);
    },
    enabled: !!currentUser,
    initialData: [],
    staleTime: 5 * 60 * 1000, // 5 minutes - similar to useServicePricesRQ
  });
  
  return {
    ...queryResult,
    // Add any helper methods here if needed in the future
  };
}
