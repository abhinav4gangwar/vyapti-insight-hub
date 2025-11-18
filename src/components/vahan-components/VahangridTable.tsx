import { fetchHierarchyData } from "@/lib/vahan-api-utils";
import { useEffect, useMemo, useState } from "react";
import FilterBar from "./FilterBar";
import TableLoader from "./loader";
import Pagination from "./Pagination";

type PeriodMap = Record<string, number>;

type MakerObj = {
  name: string;
  period_values: PeriodMap;
};

type FuelObj = {
  fuel: string;
  makers: MakerObj[];
};

type CategoryObj = {
  name: string;
  period_values: PeriodMap;
};

type MakerCategoryObj = {
  maker: string;
  categories: CategoryObj[];
};

interface FlattenedRow {
  group_label: string;      
  group_id: number;          
  sub_label: string;        
  [key: string]: string | number;
}

const PERIOD_ORDER = [
  "FULL_YEAR",
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
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

  // Fetch data only when needed
  useEffect(() => {
    if (!reloadTrigger && cachedData[metricType]) {
      setLocalData(cachedData[metricType]);
      return;
    }

    setLoading(true);
    fetchHierarchyData(metricType)
      .then((res) => {
        const flattened: FlattenedRow[] = [];
        let gid = 0;

        if (IS_FUEL_VIEW) {
          // Fuel → Makers
          res.forEach((fuelObj: FuelObj) => {
            gid++;
            fuelObj.makers.forEach((maker: MakerObj) => {
              const row: FlattenedRow = {
                group_label: fuelObj.fuel,
                group_id: gid,
                sub_label: maker.name
              };

              PERIOD_ORDER.forEach(period => {
                const key = Object.keys(maker.period_values).find(k => k.endsWith(period));
                row[period] = key ? maker.period_values[key] ?? 0 : 0;
              });

              flattened.push(row);
            });
          });
        } else {
          // Maker → Category (vehicle_class view)
          res.forEach((makerObj: MakerCategoryObj) => {
            gid++;
            makerObj.categories.forEach(cat => {
              const row: FlattenedRow = {
                group_label: makerObj.maker, 
                group_id: gid,
                sub_label: cat.name
              };

              PERIOD_ORDER.forEach(period => {
                const key = Object.keys(cat.period_values).find(k => k.endsWith(period));
                row[period] = key ? cat.period_values[key] ?? 0 : 0;
              });

              flattened.push(row);
            });
          });
        }

        setCachedData((prev: any) => ({ ...prev, [metricType]: flattened }));
        setLocalData(flattened);
      })
      .finally(() => setLoading(false));
  }, [metricType, reloadTrigger]);


  // Searching
  const filtered = useMemo(() => {
    const s = searchValue.toLowerCase();
    return localData.filter(
      row =>
        row.group_label.toLowerCase().includes(s) ||
        row.sub_label.toLowerCase().includes(s)
    );
  }, [localData, searchValue]);


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


  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = (col: string) => {
    setSortCol(col);
    setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
  };

  // dynamic column label
  const firstColLabel = IS_FUEL_VIEW ? "Fuel Type" : "Maker";
  const secondColLabel = IS_FUEL_VIEW ? "Maker" : "Category";

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
                <th className="border px-2 py-2">{firstColLabel}</th>
                <th className="border px-2 py-2">{secondColLabel}</th>

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
                    {idx === 0 || paginated[idx - 1].group_id !== row.group_id
                      ? row.group_label
                      : ""}
                  </td>
                  <td className="border px-2">{row.sub_label}</td>
                  {PERIOD_ORDER.map(period => (
                    <td key={period} className="border px-2 text-center">
                      {row[period] as number}
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
