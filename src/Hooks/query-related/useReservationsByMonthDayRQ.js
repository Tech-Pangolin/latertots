import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { collection, doc, query, where } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from "../../Helpers/logger";
import _ from "lodash";
import { luxonDateTimeFromFirebaseTimestamp } from "../../Helpers/datetime";

export function useReservationsByMonthDayRQ({ enabled = true } = {}) {
  const { dbService, currentUser } = useAuth();
  const [monthYear, setMonthYearRaw] = useState({ day: null, week: false, month: new Date().getMonth(), year: new Date().getFullYear() });
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.Role === 'admin';



  const queryKey = useMemo(() => {
    if (monthYear.day != null && !monthYear.week) {
      // Fetch reservations for a specific day
      return ['calendarReservationsByDay', monthYear.day, monthYear.month, monthYear.year];
    } else if (monthYear.day != null && monthYear.week) {
      // Fetch reservations for a specific week
      return ['calendarReservationsByWeek', monthYear.day, monthYear.month, monthYear.year];
    } else {
      // Fetch reservations for the entire month
      return ['calendarReservationsByMonth', monthYear.month, monthYear.year];
    }
  }, [monthYear]);

  const setMonthYear = useCallback((newMonthYear) => {
    // Don't change state unless the new data is functionally different from the existing data
    if (!_.isEqual(monthYear, newMonthYear)) {
      if (!newMonthYear.hasOwnProperty('day')) {
        newMonthYear.day = null;
      }
      if (!newMonthYear.hasOwnProperty('week')) {
        newMonthYear.week = false;
      }
      setMonthYearRaw(newMonthYear)
    }
  }, [JSON.stringify(monthYear)]);

  const reservationQuery = useMemo(() => {
    let dateStart, dateEnd;
    if (monthYear.day != null && monthYear.week == false) {
      // Fetch reservations for a specific day
      dateStart = new Date(monthYear.year, monthYear.month, monthYear.day);
      dateEnd = new Date(monthYear.year, monthYear.month, monthYear.day + 1);
    } else if (monthYear.day != null && monthYear.week == true) {
      // Fetch reservations for a specific week
      const startOfWeek = new Date(monthYear.year, monthYear.month, monthYear.day);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      dateStart = startOfWeek;
      dateEnd = endOfWeek;
    } else {
      // Fetch reservations for the entire month
      dateStart = new Date(monthYear.year, monthYear.month, 1);
      dateEnd = new Date(monthYear.year, monthYear.month + 1, 1);
    }

    const filters = [
      where("start", ">=", dateStart),
      where("start", "<", dateEnd),
      where("archived", "!=", true)
    ];

    if (currentUser.Role !== "admin") {
      filters.push(where("User", "==", doc(collection(db, "Users"), currentUser.uid)));
    }

    return query(
      collection(db, COLLECTIONS.RESERVATIONS),
      ...filters
    )
  }, [monthYear]);

  const transformReservationData = (res) => {
    // Note: After migration, all data will be in the new format
    // This check is no longer needed but kept for backward compatibility

    // Hide orphaned PENDING reservations that have formDraftId but no payment info
    if (res.status === 'pending' &&
      res.formDraftId &&
      (!res.stripePayments?.minimum && !res.stripePayments?.full)) {
      return null; // Don't show orphaned reservations
    }

    return {
      id: res.id,
      status: res.status,
      childId: res.childId,
      title: res.title || "",
      userId: res.userId, 
      start: luxonDateTimeFromFirebaseTimestamp(res.start).toISO(),
      end: luxonDateTimeFromFirebaseTimestamp(res.end).toISO(),
      startDT: luxonDateTimeFromFirebaseTimestamp(res.start),
      endDT: luxonDateTimeFromFirebaseTimestamp(res.end),
      dropOffPickUp: res.dropOffPickUp, 
    };
  };

  const queryResult = useQuery({
    queryKey,
    queryFn: async () => {
      if (!isAdmin && !reservationQuery._query.filters.some(f =>
        f.field.segments.includes('User')
      )) {
        throw new Error("Unauthorized access to reservation data.");
      }
      const result = await dbService.fetchDocs(reservationQuery);
      return result;
    },
    select: (data) => data.map(transformReservationData).filter(Boolean),
    enabled,
    onError: (error) => {
      console.error("Error fetching monthly reservations:", error);
    },
  })

  useEffect(() => {
    if (!enabled) return;

    let unsubscribe;
    let isSubscribed = true;

    const setupSubscription = async () => {
      if (isSubscribed) {
        unsubscribe = await dbService.subscribeDocs(reservationQuery, fresh => {
          if (isSubscribed) {
            queryClient.setQueryData(queryKey, fresh.map(transformReservationData).filter(Boolean));
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
  }, [queryKey, queryClient, enabled]); // Removed reservationQuery from dependencies

  return {
    ...queryResult,
    setMonthYear, // Expose the setter to change the month and year
  };
}