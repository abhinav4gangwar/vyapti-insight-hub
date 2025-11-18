import { fetchHierarchyData } from "@/lib/vahan-api-utils";
import { useEffect, useMemo, useState } from "react";
import FilterBar from "./FilterBar";
import TableLoader from "./loader";
import Pagination from "./Pagination";

type PeriodMap = Record<string, number>;
type MakerObj = { name: string; period_values: PeriodMap };
type FuelObj = { fuel: string; makers: MakerObj[] };
type CategoryObj = { name: string; period_values: PeriodMap };
type MakerCategoryObj = { maker: string; categories: CategoryObj[] };

interface FlattenedRow {
  group_label: string;
  group_id: number;
  sub_label: string;
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
        const flat: FlattenedRow[] = [];
        let gid = 0;

        if (IS_FUEL_VIEW) {
          res.forEach((fuelObj: FuelObj) => {
            gid++;
            fuelObj.makers.forEach(m => {
              const row: FlattenedRow = {
                group_label: fuelObj.fuel,
                group_id: gid,
                sub_label: m.name
              };
              PERIOD_ORDER.forEach(per => {
                const key = Object.keys(m.period_values).find(k => k.endsWith(per));
                row[per] = key ? m.period_values[key] ?? 0 : 0;
              });
              flat.push(row);
            });
          });
        } else {
          res.forEach((makerObj: MakerCategoryObj) => {
            gid++;
            makerObj.categories.forEach(cat => {
              const row: FlattenedRow = {
                group_label: makerObj.maker,
                group_id: gid,
                sub_label: cat.name
              };
              PERIOD_ORDER.forEach(per => {
                const key = Object.keys(cat.period_values).find(k => k.endsWith(per));
                row[per] = key ? cat.period_values[key] ?? 0 : 0;
              });
              flat.push(row);
            });
          });
        }

        setCachedData((prev: any) => ({ ...prev, [metricType]: flat }));
        setLocalData(flat);
      })
      .finally(() => setLoading(false));
  }, [metricType, reloadTrigger]);

  const filtered = useMemo(() => {
    const s = searchValue.toLowerCase();
    return localData.filter(
      row =>
        row.group_label.toLowerCase().includes(s) ||
        row.sub_label.toLowerCase().includes(s)
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
        <div className="overflow-auto rounded-md border bg-white shadow-sm">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-gray-100 border-b">
              <tr>
                <th className="border px-3 py-3 text-left font-semibold">{firstCol}</th>
                <th className="border px-3 py-3 text-left font-semibold">{secondCol}</th>
                {PERIOD_ORDER.map(p => (
                  <th
                    key={p}
                    className="border px-3 py-3 text-center whitespace-nowrap cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort(p)}
                  >
                    <span className="inline-block px-2 py-1 rounded bg-gray-200 text-xs font-semibold">
                      {p}
                    </span>
                    {sortCol === p ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center p-6 text-gray-500">
                    No matching results
                  </td>
                </tr>
              ) : (
                paginated.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="border px-3 font-medium sticky left-0 bg-inherit">
                      {idx === 0 || paginated[idx - 1].group_id !== row.group_id
                        ? row.group_label
                        : ""}
                    </td>
                    <td className="border px-3">{row.sub_label}</td>
                    {PERIOD_ORDER.map(per => (
                      <td
                        key={per}
                        className="border px-2 text-right font-medium"
                      >
                        {row[per] || 0}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        setPage={setPage}
        total={filtered.length}
        perPage={PER_PAGE}
      />
    </>
  );
}
