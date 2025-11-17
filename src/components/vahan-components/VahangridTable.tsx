import { useEffect, useMemo, useState } from "react";

import { fetchHierarchyData } from "@/lib/vahan-api-utils";
import FilterBar from "./FilterBar";
import TableLoader from "./loader";
import Pagination from "./Pagination";

type CategoryData = { name: string; period_values: Record<string, number> };
type MakerData = { maker: string; categories: CategoryData[] };

interface FlattenedRow {
  maker: string;
  maker_group_id: number; 
  category: string;
  [key: string]: string | number;
}

const PERIOD_ORDER = [
  "FULL_YEAR",
  "JAN","FEB","MAR","APR","MAY","JUN",
  "JUL","AUG","SEP","OCT","NOV","DEC"
];

export default function VahanGridTable({
  metricType,
  cachedData,
  setCachedData,
  reloadTrigger
}: {
  metricType: string;
  cachedData: Record<string, FlattenedRow[]>; 
  setCachedData: (data: any) => void;
  reloadTrigger: number;
}) {
  const [localData, setLocalData] = useState<FlattenedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState<string>("maker");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const perPage = 15;

  // Fetch data only when needed
  useEffect(() => {
    if (!reloadTrigger && cachedData[metricType]) {
      setLocalData(cachedData[metricType]);
      return;
    }

    setLoading(true);
    fetchHierarchyData(metricType)
      .then((res: MakerData[]) => {
        const flatRows: FlattenedRow[] = [];
        let groupId = 0;

        res.forEach(makerObj => {
          groupId++;
          makerObj.categories.forEach(catObj => {
            const row: FlattenedRow = {
              maker: makerObj.maker,
              maker_group_id: groupId,
              category: catObj.name,
            };

            PERIOD_ORDER.forEach(period => {
              const key = Object.keys(catObj.period_values).find(k => k.endsWith(period));
              row[period] = key ? catObj.period_values[key] ?? 0 : 0;
            });

            flatRows.push(row);
          });
        });

        setCachedData((prev: any) => ({ ...prev, [metricType]: flatRows }));
        setLocalData(flatRows);
      })
      .finally(() => setLoading(false));
  }, [metricType, reloadTrigger]);

  // Searching
  const filtered = useMemo(() => (
    localData.filter(
      row =>
        row.maker.toLowerCase().includes(searchValue.toLowerCase()) ||
        row.category.toLowerCase().includes(searchValue.toLowerCase())
    )
  ), [localData, searchValue]);

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? 0;
      const bv = b[sortCol] ?? 0;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const handleSort = (col: string) => {
    setSortCol(col);
    setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <>
      <FilterBar searchValue={searchValue} setSearchValue={setSearchValue} />

      {loading ? (
        <TableLoader />
      ) : (
        <div className="overflow-auto border rounded bg-white">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="border px-2 py-2">Maker</th>
                <th className="border px-2 py-2">Category</th>
                {PERIOD_ORDER.map(p => (
                  <th
                    key={p}
                    className="border px-2 py-2 cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort(p)}
                  >
                    {p} {sortCol === p ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border px-2 font-medium">
                    {idx === 0 || paginated[idx - 1].maker_group_id !== row.maker_group_id
                      ? row.maker
                      : ""}
                  </td>
                  <td className="border px-2">{row.category}</td>
                  {PERIOD_ORDER.map(p => (
                    <td key={p} className="border px-2 text-center">{row[p] as number}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        setPage={setPage}
        total={filtered.length}
        perPage={perPage}
      />
    </>
  );
}
