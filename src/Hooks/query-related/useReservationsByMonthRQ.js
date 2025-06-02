import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { collection, query, where } from "firebase/firestore";
import { db } from "../../config/firestore";
import { COLLECTIONS } from "../../Helpers/constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from "../../Helpers/logger";

export function useReservationsByMonthRQ() {
  const { dbService } = useAuth();
  const [monthYear, setMonthYearRaw] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
  const queryKey = useMemo(() => ['adminCalendarReservationsByMonth', monthYear.month, monthYear.year], [monthYear]);
  const queryClient = useQueryClient();

  const setMonthYear = useCallback((newMonthYear) => {
    if (newMonthYear.month != monthYear.month || newMonthYear.year != monthYear.year) {
      setMonthYearRaw(newMonthYear);
    }
  }, [monthYear]);

  const monthlyReservationQuery = useMemo(() => {
    const dateStart = new Date(monthYear.year, monthYear.month, 1);
    const dateEnd = new Date(monthYear.year, monthYear.month + 1, 1);

    return query(
      collection(db, COLLECTIONS.RESERVATIONS),
      where("start", ">=", dateStart),
      where("start", "<", dateEnd),
      where("archived", "==", false)
    )
  }, [monthYear]);

  const transformReservationData = (res) => {
    // If any required field is missing, skip this entry
    if (
      !res ||
      !res.extendedProps ||
      typeof res.extendedProps.status !== 'string' ||
      !res.start ||
      typeof res.start.seconds !== 'number'
    ) {
      return null;
    }
    return {
      status: res.extendedProps.status,
      title: res.title || "",
      start: new Date(res.start.seconds * 1000),
    };
  };

  const queryResult = useQuery({
    queryKey,
    queryFn: () => dbService.fetchDocs(monthlyReservationQuery, true),
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
    const unsubscribe = dbService.subscribeDocs(monthlyReservationQuery, fresh => {
      queryClient.setQueryData(queryKey, fresh.map(transformReservationData).filter(Boolean));
    }, true);
    return () => unsubscribe();
  }, [queryKey, monthlyReservationQuery, queryClient]);

  return {
    ...queryResult,
    setMonthYear, // Expose the setter to change the month and year
  };
}