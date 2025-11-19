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
  [key: string]: any;
}

const MONTH_INDEX: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
};

function parsePeriod(key: string) {
  const full = key.match(/^FULL(\d{2})$/);
  if (full) return { year: 2000 + parseInt(full[1]), month: null };

  const m1 = key.match(/^([A-Z]{3})(\d{2})$/);
  if (m1) return { year: 2000 + parseInt(m1[2]), month: m1[1] };

  return null;
}

export default function VahanGridTable({
  metricType,
  cachedData,
  setCachedData,
  reloadTrigger
}: {
  metricType: string;
  cachedData: Record<string, FlattenedRow[]>;
  setCachedData: (d: any) => void;
  reloadTrigger: number;
}) {
  const [localData, setLocalData] = useState<FlattenedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState<string>("");
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
              Object.entries(m.period_values).forEach(([k, v]) => {
                row[k] = v;
              });
              rows.push(row);
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
              Object.entries(cat.period_values).forEach(([k, v]) => {
                row[k] = v;
              });
              rows.push(row);
            });
          });
        }

        setCachedData((p: any) => ({ ...p, [metricType]: rows }));
        setLocalData(rows);
      })
      .finally(() => setLoading(false));
  }, [metricType, reloadTrigger]);

  const PERIOD_COLUMNS = useMemo(() => {
    const allKeys = new Set<string>();

    localData.forEach(r => {
      Object.keys(r).forEach(k => {
        if (!["group_label", "group_id", "sub_label"].includes(k)) allKeys.add(k);
      });
    });

    const parsed = Array.from(allKeys)
      .map(k => ({ key: k, p: parsePeriod(k) }))
      .filter(o => o.p !== null);

    const byYear: Record<number, typeof parsed> = {};
    parsed.forEach(obj => {
      const y = obj.p!.year;
      byYear[y] = byYear[y] || [];
      byYear[y].push(obj);
    });

    const result: string[] = [];
    const sortedYears = Object.keys(byYear).map(Number).sort((a, b) => a - b);

    sortedYears.forEach(y => {
      const items = byYear[y];

      const full = items.filter(o => o.p!.month === null).map(o => o.key);
      const months = items
        .filter(o => o.p!.month !== null)
        .sort((a, b) => MONTH_INDEX[a.p!.month!] - MONTH_INDEX[b.p!.month!])
        .map(o => o.key);

      result.push(...full, ...months);
    });

    return result;
  }, [localData]);

  const filtered = localData.filter(r =>
    r.group_label.toLowerCase().includes(searchValue.toLowerCase()) ||
    r.sub_label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortCol] ?? "";
    const bv = b[sortCol] ?? "";
    if (typeof av === "string") {
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const firstCol = IS_FUEL_VIEW ? "Fuel" : "Maker";
  const secondCol = IS_FUEL_VIEW ? "Manufacturer" : "Category";

  const handleSort = (k: string) => {
    setSortCol(k);
    setSortDir(d => (d === "asc" ? "desc" : "asc"));
  };

  return (
    <>
      <FilterBar searchValue={searchValue} setSearchValue={setSearchValue} />

      {loading ? (
        <TableLoader />
      ) : (
        <div className="overflow-auto rounded border bg-white shadow-sm">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="border px-3 py-3">{firstCol}</th>
                <th className="border px-3 py-3">{secondCol}</th>

                {PERIOD_COLUMNS.map(k => (
                  <th
                    key={k}
                    className="border px-3 py-3 cursor-pointer"
                    onClick={() => handleSort(k)}
                  >
                    {k} {sortCol === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginated.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="border px-3 font-medium">
                    {i === 0 || paginated[i - 1].group_id !== row.group_id
                      ? row.group_label
                      : ""}
                  </td>
                  <td className="border px-3">{row.sub_label}</td>

                  {PERIOD_COLUMNS.map(k => (
                    <td key={k} className="border px-2 text-right">
                      {row[k] ?? 0}
                    </td>
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
        perPage={PER_PAGE}
      />
    </>
  );
}
