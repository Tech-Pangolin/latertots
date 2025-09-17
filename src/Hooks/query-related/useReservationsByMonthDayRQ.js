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
      // If the user is not an admin, filter by the current user's ID
      filters.push(where("User", "==", doc(collection(db, "Users"), currentUser.uid)));
    }

    return query(
      collection(db, COLLECTIONS.RESERVATIONS),
      ...filters
    )
  }, [monthYear]);

  const transformReservationData = (res) => {
    if (!res.hasOwnProperty('extendedProps')) {
      // data already transformed
      return res;
    }
    return {
      id: res.id,
      status: res.extendedProps.status,
      childId: res.extendedProps.childId,
      title: res.title || "",
      start: luxonDateTimeFromFirebaseTimestamp(res.start).toISO(),
      end: luxonDateTimeFromFirebaseTimestamp(res.end).toISO(),
      startDT: luxonDateTimeFromFirebaseTimestamp(res.start),
      endDT: luxonDateTimeFromFirebaseTimestamp(res.end),
    };

  };

  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(reservationQuery, false),
    select: (data) => data.map(transformReservationData).filter(Boolean),
    enabled,
    onError: (error) => {
      console.error("Error fetching monthly reservations:", error);
    },
  })

  logger.info(
    "useReservationsByMonthRQ – queryKey:", queryKey,
    " status:", queryResult.status,
    " data:", queryResult.data
  );

  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribe = dbService.subscribeDocs(reservationQuery, fresh => {
      queryClient.setQueryData(queryKey, fresh.map(transformReservationData).filter(Boolean)); 
    }, false);
    return () => unsubscribe();
  }, [queryKey, reservationQuery, queryClient, enabled]);

  return {
    ...queryResult,
    setMonthYear, // Expose the setter to change the month and year
  };
}