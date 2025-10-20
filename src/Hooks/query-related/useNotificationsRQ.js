import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useMemo } from "react";
import { collection, query, where, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";
import { logger } from "../../Helpers/logger";

export function useNotificationsRQ() {
  const { dbService, currentUser } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.Role === 'admin';
  
  const queryKey = isAdmin ? ['adminNotifications'] : ['userNotifications', currentUser.uid];
  
  const notificationsQuery = useMemo(() => {
    if (isAdmin) {
      // Admin sees all admin messages
      return query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('isAdminMessage', '==', true),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Users see their own notifications
      return query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', currentUser.uid),
        where('isAdminMessage', '==', false),
        orderBy('createdAt', 'desc')
      );
    }
  }, [currentUser.uid, isAdmin]);
  
  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(notificationsQuery),
    onError: (error) => {
      logger.error("Error fetching notifications:", error);
    },
    enabled: !!currentUser,
    initialData: []
  });
  
  // Follow existing pattern with real-time subscription
  useEffect(() => {
    if (!currentUser) return;
    
    let unsubscribe;
    let isSubscribed = true;
    
    const setupSubscription = async () => {
      if (isSubscribed) {
        unsubscribe = await dbService.subscribeDocs(notificationsQuery, fresh => {
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
  }, [notificationsQuery, queryClient, queryKey, currentUser, isAdmin]);
  
  // Dismiss notification mutation
  const dismissNotificationMutation = useMutation({
    mutationKey: ['dismissNotification'],
    mutationFn: async (notificationId) => {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await deleteDoc(notificationRef);
    },
    onSuccess: () => {
      // Invalidate the appropriate query cache
      queryClient.invalidateQueries(queryKey);
    },
    onError: (error) => {
      logger.error("Error dismissing notification:", error);
    }
  });
  
  return {
    ...queryResult,
    dismissNotification: dismissNotificationMutation.mutate,
    isDismissing: dismissNotificationMutation.isPending,
    dismissError: dismissNotificationMutation.error
  };
}
