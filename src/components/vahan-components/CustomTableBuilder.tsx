import { apiClient } from "@/lib/vahan-api-utils";
import { Check, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import TableLoader from "./loader";
import Pagination from "./Pagination";
import SelectMulti from "./SelectMulti";

const MONTH_INDEX: Record<string, number> = {
  FULL_YEAR: 0,
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
  DEC: 12,
};

const parsePeriods = (keys: string[]) => {
  return keys
    .map((p) => {
      const isFullYear = /^\d{4}$/.test(p);
      
      if (isFullYear) {
        return { 
          key: p, 
          prefix: "FULL_YEAR", 
          year: Number(p),
          sortValue: Number(p) * 100 
        };
      }
      
      const prefix = p.replace(/\d+/g, "");
      const yearSuffix = p.match(/\d+/)?.[0] || "00";
      const year = Number(yearSuffix);
      const fullYear = year < 50 ? 2000 + year : 1900 + year;
      
      return { 
        key: p, 
        prefix, 
        year,
        sortValue: fullYear * 100 + (MONTH_INDEX[prefix] || 0)
      };
    })
    .sort((a, b) => a.sortValue - b.sortValue)
    .map((x) => x.key);
};

export default function CustomTableBuilder() {
  const [metricType, setMetricType] = useState("maker_vs_fuel");

  const [selectedMakers, setSelectedMakers] = useState<string[]>([]);
  const [selectedYaxis, setSelectedYaxis] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  const [distinctLoading, setDistinctLoading] = useState(true);
  const [distinctMakers, setDistinctMakers] = useState<string[]>([]);
  const [distinctYaxis, setDistinctYaxis] = useState<string[]>([]);
  const [distinctYears, setDistinctYears] = useState<string[]>([]);

  const [orientation, setOrientation] = useState("row_major");
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    setDistinctLoading(true);
    Promise.all([
      apiClient.get("/metrics/distinct/x_axis"),
      apiClient.get("/metrics/distinct/y_axis"),
      apiClient.get("/metrics/distinct/year"),
    ])
      .then(([xRes, yRes, yRes2]) => {
        setDistinctMakers(xRes.data?.map(String) ?? []);
        setDistinctYaxis(yRes.data?.map(String) ?? []);
        setDistinctYears(yRes2.data?.map(String) ?? []);
      })
      .finally(() => setDistinctLoading(false));
  }, []);

  const fetchCustom = async () => {
    setLoading(true);
    setTableData([]);

    const params = new URLSearchParams();
    params.append("metric_type", metricType);

    selectedMakers.forEach((m) => params.append("makers", m));
    selectedYaxis.forEach((c) => params.append("yaxis", c));
    selectedYears.forEach((y) => params.append("years", y));
    selectedMonths.forEach((m) => params.append("periods", m));
    params.append("orientation", orientation);

    const res = await apiClient.get(`/metrics/custom?${params.toString()}`);
    
  
    const data = res.data || [];
    const transformed = data.map((item: any) => ({
      name: item.name,
      ...(item.values || {})
    }));
    
    setTableData(transformed);
    setPage(1);
    setLoading(false);
  };

  const displayedRows = tableData.slice((page - 1) * perPage, page * perPage);

  const columns = useMemo(() => {
    if (tableData.length === 0) return [];
    
    // Get all unique keys from all rows
    const allKeys = new Set<string>();
    tableData.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });
    
    const keys = Array.from(allKeys);
    const staticCols = ["name"];
    const dynamicCols = parsePeriods(keys.filter((k) => k !== "name"));
    
    return [...staticCols, ...dynamicCols];
  }, [tableData]);

  const toggleMonth = (m: string) => {
    setSelectedMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  return (
    <div className="p-4 space-y-5">
      <h2 className="text-lg font-semibold">🧩 Custom Table Builder</h2>

      <div className="bg-gray-50 border rounded-lg p-4 grid grid-cols-2 gap-4">
        <div>
          <label className="font-medium text-sm">Metric Type</label>
          <select
            value={metricType}
            onChange={(e) => setMetricType(e.target.value)}
            className="border rounded px-2 py-1 w-full mt-1"
          >
            <option value="maker_vs_fuel">Maker vs Fuel</option>
            <option value="maker_vs_vehicle_class">Maker vs Vehicle Class</option>
          </select>
        </div>

        {distinctLoading ? (
          <div className="col-span-2 p-3 text-sm text-gray-500">
            Loading filters...
          </div>
        ) : (
          <>
            <SelectMulti
              label="Years"
              options={distinctYears}
              selected={selectedYears}
              setSelected={setSelectedYears}
            />

            <SelectMulti
              label="Makers"
              options={distinctMakers}
              selected={selectedMakers}
              setSelected={setSelectedMakers}
            />

            <SelectMulti
              label="Fuel / Vehicle Class"
              options={distinctYaxis}
              selected={selectedYaxis}
              setSelected={setSelectedYaxis}
            />

            <div className="col-span-2">
              <label className="font-medium text-sm">Months</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.keys(MONTH_INDEX)
                  .filter((m) => m !== "FULL_YEAR")
                  .map((m) => (
                    <span
                      key={m}
                      onClick={() => toggleMonth(m)}
                      className={`px-3 py-1 border rounded cursor-pointer text-xs ${
                        selectedMonths.includes(m)
                          ? "bg-black text-white"
                          : "bg-white"
                      }`}
                    >
                      {m}
                    </span>
                  ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="font-medium text-sm">Orientation</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                className="border rounded px-2 py-1 w-full mt-1"
              >
                <option value="row_major">Rows = Makers / Category</option>
                <option value="column_major">Columns = Makers / Category</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={fetchCustom}
          className="bg-black text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Check size={18} /> Generate
        </button>

        <RefreshCcw
          size={22}
          className="cursor-pointer hover:rotate-180 transition-transform duration-300"
          onClick={fetchCustom}
        />
      </div>

      {loading ? (
        <TableLoader />
      ) : tableData.length > 0 ? (
        <>
          <div className="overflow-auto border rounded bg-white">
            <table className="min-w-full text-xs sm:text-sm border-collapse">
              <thead className="bg-gray-100 sticky top-0 text-left">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="border px-2 py-2">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {displayedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={col} className="border px-2 py-1 text-center">
                        {row[col] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            total={tableData.length}
            perPage={perPage}
            setPage={setPage}
          />
        </>
      ) : null}
    </div>
  );
}