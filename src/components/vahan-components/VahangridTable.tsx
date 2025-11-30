import { fetchHierarchyData } from "@/lib/vahan-api-utils";
import { useEffect, useMemo, useState } from "react";
import FilterBar from "./FilterBar";
import TableLoader from "./loader";
import Pagination from "./Pagination";
import { exportToExcel } from "./utils/excel-export";


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

const extractYears = (keys: string[]) => {
  const years = new Set<number>();
  keys.forEach(k => {
    const y = Number(k.slice(-2));
    if (!isNaN(y)) years.add(y);
  });
  return Array.from(years).sort();
};

const orderPeriods = (keys: string[], selectedYears: number[]) => {
  return keys
    .filter(k => selectedYears.includes(Number(k.slice(-2))))
    .map(k => {
      const prefix = k.replace(/\d+$/, "");
      const year = Number(k.slice(-2));
      return { k, prefix, year };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return MONTH_INDEX[a.prefix] - MONTH_INDEX[b.prefix];
    })
    .map(v => v.k);
};

export default function VahanGridTable({
  metricType,
  cachedData,
  setCachedData,
  reloadTrigger
}: {
  metricType: string;
  cachedData: Record<string, FlattenedRow[]>;
  setCachedData: (v: any) => void;
  reloadTrigger: number;
}) {
  const [localData, setLocalData] = useState<FlattenedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState<string>("group_label");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [showYoy, setShowYoy] = useState(false);

  const PER_PAGE = 15;
  const IS_FUEL = metricType === "maker_vs_fuel";

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

        if (IS_FUEL) {
          res.forEach((fuelObj: FuelEntry) => {
            gid++;
            fuelObj.makers.forEach(m => {
              const row: FlattenedRow = {
                group_label: fuelObj.fuel,
                group_id: gid,
                sub_label: m.name
              };
              Object.entries(m.period_values).forEach(([k, v]) => {
                row[k] = v ?? 0;
              });
              flat.push(row);
            });
          });
        } else {
          res.forEach((makerObj: MakerCategoryEntry) => {
            gid++;
            makerObj.categories.forEach(cat => {
              const row: FlattenedRow = {
                group_label: makerObj.maker,
                group_id: gid,
                sub_label: cat.name
              };
              Object.entries(cat.period_values).forEach(([k, v]) => {
                row[k] = v ?? 0;
              });
              flat.push(row);
            });
          });
        }

        const keys = Object.keys(flat[0] || {});
        const years = extractYears(keys);
        setSelectedYears(years);

        setCachedData((p: any) => ({ ...p, [metricType]: flat }));
        setLocalData(flat);
      })
      .finally(() => setLoading(false));
  }, [metricType, reloadTrigger]);
  
  const allColumns = useMemo(() => {
    if (localData.length === 0) return [];

    const keySet = new Set<string>();

    localData.forEach(row => {
      Object.keys(row).forEach(k => {
        if (!["group_label", "group_id", "sub_label"].includes(k)) {
          keySet.add(k);
        }
      });
    });

    const keys = Array.from(keySet).filter(k => !k.endsWith("_YOY"));

    const ordered = orderPeriods(keys, selectedYears);

    if (!showYoy) return ordered;

    const yoyCols = ordered
      .filter(k => k.startsWith("FULL"))
      .map(k => k + "_YOY");

    return [...ordered, ...yoyCols];
  }, [localData, selectedYears, showYoy]);

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

  const toggleYear = (y: number) =>
    setSelectedYears(p =>
      p.includes(y) ? p.filter(v => v !== y) : [...p, y].sort()
    );

  const handleExport = () => {
    if (filtered.length === 0) {
      alert("No data to export!");
      return;
    }
    
    exportToExcel(filtered, metricType, selectedYears);
  };

  const firstCol = IS_FUEL ? "Fuel" : "Maker";
  const secondCol = IS_FUEL ? "Manufacturer" : "Category";

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <FilterBar searchValue={searchValue} setSearchValue={setSearchValue} />
        
        <button
          onClick={handleExport}
          disabled={loading || localData.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Export to Excel
        </button>
      </div>

      {localData.length > 0 && (
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            {extractYears(Object.keys(localData[0])).map(y => (
              <label key={y} className="text-sm flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedYears.includes(y)}
                  onChange={() => toggleYear(y)}
                />
                {2000 + y}
              </label>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showYoy}
              onChange={() => setShowYoy(v => !v)}
            />
            Show YoY (FULL only)
          </label>
        </div>
      )}

      {loading ? (
        <TableLoader />
      ) : (
        <div className="overflow-auto border rounded bg-white shadow-sm">
          <table className="min-w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-gray-100 border-b">
              <tr>
                <th className="border px-3 py-3">{firstCol}</th>
                <th className="border px-3 py-3">{secondCol}</th>

                {allColumns.map(col => (
                  <th
                    key={col}
                    className="border px-3 py-3 text-center cursor-pointer hover:bg-gray-200 whitespace-nowrap"
                    onClick={() => {
                      setSortCol(col);
                      setSortDir(d => (d === "asc" ? "desc" : "asc"));
                    }}
                  >
                    {col}
                    {sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginated.map((row, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="border px-3 font-medium">
                    {idx === 0 ||
                    paginated[idx - 1].group_id !== row.group_id
                      ? row.group_label
                      : ""}
                  </td>

                  <td className="border px-3">{row.sub_label}</td>

                  {allColumns.map(col => {
                    const isYoy = col.endsWith("_YOY");
                    const baseCol = col.replace("_YOY", "");
                    return (
                      <td key={col} className="border px-2 text-right leading-tight">
                        {!isYoy ? (
                          <>
                            <div>{row[col] || 0}</div>
                            {showYoy && row[baseCol + "_YOY"] != null && (
                              <div className="text-xs text-gray-500">
                                ({row[baseCol + "_YOY"]}%)
                              </div>
                            )}
                          </>
                        ) : null}
                      </td>
                    );
                  })}
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
        perPage={15}
      />
    </>
  );
}