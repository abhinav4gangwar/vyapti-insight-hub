import { fetchHierarchyData } from "@/lib/vahan-api-utils";
import { useEffect, useMemo, useState } from "react";
import FilterBar from "./FilterBar";
import TableLoader from "./loader";
import Pagination from "./Pagination";

type PeriodMap = Record<string, number>;

interface MakerEntry {
  name: string;
  period_values: PeriodMap;
}

interface FuelEntry {
  fuel: string;
  makers: MakerEntry[];
}

interface CategoryEntry {
  name: string;
  period_values: PeriodMap;
}

interface MakerCategoryEntry {
  maker: string;
  categories: CategoryEntry[];
}

interface FlattenedRow {
  group_label: string;
  group_id: number;
  sub_label: string;
  [key: string]: string | number;
}

const MONTH_INDEX: Record<string, number> = {
  FULL: 0,
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12
};

const sortPeriods = (keys: string[]) => {
  return keys
    .map(k => {
      const prefix = k.slice(0, k.length - 2);
      const year = Number(k.slice(-2));
      const month = MONTH_INDEX[prefix] ?? 99;
      return { k, prefix, year, month };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    })
    .map(x => x.k);
};

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
  const [sortCol, setSortCol] = useState<string>("group_label");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const PER_PAGE = 15;
  const IS_FUEL_VIEW = metricType === "maker_vs_fuel";

  useEffect(() => {
    if (!reloadTrigger && cachedData[metricType]) {
      setLocalData(cachedData[metricType]);
      return;
    }

    setLoading(true);
    fetchHierarchyData(metricType)
      .then(res => {
        const rows: FlattenedRow[] = [];
        let groupId = 0;

        if (IS_FUEL_VIEW) {
          res.forEach((fuelObj: FuelEntry) => {
            groupId++;
            fuelObj.makers.forEach(m => {
              const row: FlattenedRow = {
                group_label: fuelObj.fuel,
                group_id: groupId,
                sub_label: m.name
              };

              const ordered = sortPeriods(Object.keys(m.period_values));
              ordered.forEach(p => {
                row[p] = m.period_values[p] ?? 0;
              });

              rows.push(row);
            });
          });
        } else {
          res.forEach((makerObj: MakerCategoryEntry) => {
            groupId++;
            makerObj.categories.forEach(cat => {
              const row: FlattenedRow = {
                group_label: makerObj.maker,
                group_id: groupId,
                sub_label: cat.name
              };

              const ordered = sortPeriods(Object.keys(cat.period_values));
              ordered.forEach(p => {
                row[p] = cat.period_values[p] ?? 0;
              });

              rows.push(row);
            });
          });
        }

        setCachedData((prev: any) => ({ ...prev, [metricType]: rows }));
        setLocalData(rows);
      })
      .finally(() => setLoading(false));
  }, [metricType, reloadTrigger]);

  const allColumns = useMemo(() => {
    if (localData.length === 0) return [];
    const cols = new Set<string>();
    localData.forEach(row => {
      Object.keys(row).forEach(k => {
        if (!["group_label", "group_id", "sub_label"].includes(k)) {
          cols.add(k);
        }
      });
    });
    return sortPeriods(Array.from(cols));
  }, [localData]);

  const filtered = useMemo(() => {
    const s = searchValue.toLowerCase();
    return localData.filter(
      r =>
        r.group_label.toLowerCase().includes(s) ||
        r.sub_label.toLowerCase().includes(s)
    );
  }, [localData, searchValue]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? 0;
      const bv = b[sortCol] ?? 0;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = (col: string) => {
    setSortCol(col);
    setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
  };

  const firstCol = IS_FUEL_VIEW ? "Fuel" : "Maker";
  const secondCol = IS_FUEL_VIEW ? "Manufacturer" : "Category";

  return (
    <>
      <FilterBar searchValue={searchValue} setSearchValue={setSearchValue} />

      {loading ? (
        <TableLoader />
      ) : (
        <div className="overflow-auto border rounded bg-white shadow-sm">
          <table className="min-w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-gray-100 border-b">
              <tr>
                <th className="border px-3 py-3 text-left">{firstCol}</th>
                <th className="border px-3 py-3 text-left">{secondCol}</th>
                {allColumns.map(col => (
                  <th
                    key={col}
                    className="border px-3 py-3 text-center whitespace-nowrap cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort(col)}
                  >
                    {col}
                    {sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={allColumns.length + 2} className="text-center p-6 text-gray-500">
                    No results found
                  </td>
                </tr>
              ) : (
                paginated.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="border px-3 font-medium">
                      {idx === 0 || paginated[idx - 1].group_id !== row.group_id
                        ? row.group_label
                        : ""}
                    </td>
                    <td className="border px-3">{row.sub_label}</td>
                    {allColumns.map(col => (
                      <td key={col} className="border px-2 text-right">
                        {row[col] || 0}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} setPage={setPage} total={filtered.length} perPage={PER_PAGE} />
    </>
  );
}
