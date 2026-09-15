import { useCallback, useEffect, useState } from "react";
import { friendlyDataError } from "@/lib/aegis";
import { requireSupabase } from "@/lib/supabase";

export type TableRow = { id: string };

/**
 * Reads rows from a Supabase table (RLS scopes them to the signed-in user) and
 * exposes loading/error state plus a manual refresh for after writes.
 */
export function useTableData<T extends { id: string } = TableRow>(
  table: string,
  orderBy = "created_at",
  ascending = false
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const client = requireSupabase();
      const { data, error: queryError } = await client
        .from(table)
        .select("*")
        .order(orderBy, { ascending });
      if (queryError) throw queryError;
      setRows((data ?? []) as T[]);
      setError(null);
    } catch (caught) {
      setError(friendlyDataError(caught, table));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [table, orderBy, ascending]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, loading, error, refresh, setRows };
}
