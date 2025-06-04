import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { collection, query, where } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from "../../Helpers/logger";
import _ from "lodash";

export function useReservationsByMonthDayRQ() {
  const { dbService } = useAuth();
  const [monthYear, setMonthYearRaw] = useState({ day: null, month: new Date().getMonth(), year: new Date().getFullYear() });
  const queryClient = useQueryClient();


  const queryKey = useMemo(() => {
    if (monthYear.day != null) {
      return ['adminCalendarReservationsByDay', monthYear.day, monthYear.month, monthYear.year];
    } else {
      return ['adminCalendarReservationsByMonth', monthYear.month, monthYear.year];
    }
  }, [monthYear]);

  const setMonthYear = useCallback((newMonthYear) => {
    if (_.isEqual(monthYear, newMonthYear)) {
      if (!newMonthYear.hasOwnProperty('day')) {
        newMonthYear.day = null;
      }
      console.log("Setting monthYear:", newMonthYear);
      setMonthYearRaw(newMonthYear);
    }
  }, [JSON.stringify(monthYear)]);

  const reservationQuery = useMemo(() => {
    let dateStart, dateEnd;
    if (monthYear.day != null) {
      // Fetch reservations for a specific day
      dateStart = new Date(monthYear.year, monthYear.month, monthYear.day);
      dateEnd = new Date(monthYear.year, monthYear.month, monthYear.day + 1);
    } else {
      // Fetch reservations for the entire month
      dateStart = new Date(monthYear.year, monthYear.month, 1);
      dateEnd = new Date(monthYear.year, monthYear.month + 1, 1);
    }

    return query(
      collection(db, COLLECTIONS.RESERVATIONS),
      where("start", ">=", dateStart),
      where("start", "<", dateEnd),
      where("archived", "==", false)
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
      title: res.title || "",
      start: new Date(res.start.seconds * 1000),
      end: new Date(res.end.seconds * 1000),
    };

  };

  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(reservationQuery, true),
    select: (data) => data.map(transformReservationData).filter(Boolean),
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
    const unsubscribe = dbService.subscribeDocs(reservationQuery, fresh => {
      queryClient.setQueryData(queryKey, fresh.map(transformReservationData).filter(Boolean)); 
    }, true);
    return () => unsubscribe();
  }, [queryKey, reservationQuery, queryClient]);

  return {
    ...queryResult,
    setMonthYear, // Expose the setter to change the month and year
  };
}