import { apiClient } from "@/lib/vahan-api-utils";
import { Check, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import TableLoader from "./loader";
import Pagination from "./Pagination";
import SelectMulti from "./SelectMulti";

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

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

  /** FETCH DISTINCT VALUES ONCE **/
  useEffect(() => {
    setDistinctLoading(true);
    Promise.all([
      apiClient.get("/metrics/distinct/x_axis"),
      apiClient.get("/metrics/distinct/y_axis"),
      apiClient.get("/metrics/distinct/year")
    ])
    .then(([xRes, yRes, yearRes]) => {
      setDistinctMakers(xRes.data?.map(String) ?? []);
      setDistinctYaxis(yRes.data?.map(String) ?? []);
      setDistinctYears(yearRes.data?.map(String) ?? []);
    })
    .finally(() => setDistinctLoading(false));
  }, []);

  /** FETCH CUSTOM TABLE **/
  const fetchCustom = async () => {
    setLoading(true);
    setTableData([]);

    const params = new URLSearchParams();
    params.append("metric_type", metricType);

    selectedMakers.forEach(m => params.append("makers", m));
    selectedYaxis.forEach(c => params.append("yaxis", c));
    selectedYears.forEach(y => params.append("years", y));
    selectedMonths.forEach(m => params.append("periods", m));
  
    params.append("orientation", orientation);

    const res = await apiClient.get(`/metrics/custom?${params.toString()}`);

    setTableData(res.data || []);
    setPage(1);
    setLoading(false);
  };

  /** PAGINATION */
  const displayedRows = tableData.slice((page - 1) * perPage, page * perPage);
  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];

  const toggleMonth = (m: string) =>
    setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  return (
    <div className="p-4 space-y-5">
      <h2 className="text-lg font-semibold">🧩 Custom Table Builder</h2>

      {/* FILTER PANEL */}
      <div className="bg-gray-50 border rounded-lg p-4 grid grid-cols-2 gap-4">

        {/* METRIC TYPE */}
        <div>
          <label className="font-medium text-sm">Metric Type</label>
          <select
            value={metricType}
            onChange={e => setMetricType(e.target.value)}
            className="border rounded px-2 py-1 w-full mt-1"
          >
            <option value="maker_vs_fuel">Maker vs Fuel</option>
            <option value="maker_vs_vehicle_class">Maker vs Vehicle Class</option>
          </select>
        </div>

        {distinctLoading ? (
          <div className="col-span-2 p-3 text-sm text-gray-500">Loading filters...</div>
        ) : (
          <>
            {/* YEARS */}
            <SelectMulti
              label="Years"
              options={distinctYears}
              selected={selectedYears}
              setSelected={setSelectedYears}
            />

            {/* MAKERS */}
            <SelectMulti
              label="Makers"
              options={distinctMakers}
              selected={selectedMakers}
              setSelected={setSelectedMakers}
            />

            {/* CATEGORY (Fuel / VClass) */}
            <SelectMulti
              label="Fuel / Vehicle Class"
              options={distinctYaxis}
              selected={selectedYaxis}
              setSelected={setSelectedYaxis}
            />

            {/* MONTHS */}
            <div className="col-span-2">
              <label className="font-medium text-sm">Months</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {MONTHS.map(m => (
                  <span
                    key={m}
                    onClick={() => toggleMonth(m)}
                    className={`px-3 py-1 border rounded cursor-pointer text-xs ${
                      selectedMonths.includes(m) ? "bg-black text-white" : "bg-white"
                    }`}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* ORIENTATION */}
            <div className="col-span-2">
              <label className="font-medium text-sm">Orientation</label>
              <select
                value={orientation}
                onChange={e => setOrientation(e.target.value)}
                className="border rounded px-2 py-1 w-full mt-1"
              >
                <option value="row_major">Rows = Makers / Category</option>
                <option value="column_major">Columns = Makers / Category</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-4">
        <button
          onClick={fetchCustom}
          className="bg-black text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Check size={18}/> Generate
        </button>

        <RefreshCcw
          size={22}
          className="cursor-pointer hover:rotate-180 transition-transform duration-300"
          onClick={fetchCustom}
        />
      </div>

      {/* OUTPUT TABLE */}
      {loading ? (
        <TableLoader />
      ) : tableData.length > 0 ? (
        <>
          <div className="overflow-auto border rounded bg-white">
            <table className="min-w-full text-xs sm:text-sm border-collapse">
              <thead className="bg-gray-100 sticky top-0 text-left">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="border px-2 py-2">{col}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {displayedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {columns.map(col => (
                      <td key={col} className="border px-2 py-1 text-center">{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} total={tableData.length} perPage={perPage} setPage={setPage}/>
        </>
      ) : null}
    </div>
  );
}
