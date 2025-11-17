import VahanGridTable from "@/components/vahan-components/VahangridTable";
import { apiClient } from "@/lib/vahan-api-utils";
import { useState } from "react";


export default function VahanDashboardPage() {
  const [metricType, setMetricType] = useState("maker_vs_fuel");
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [cachedData, setCachedData] = useState<any>({});
  const [scraping, setScraping] = useState(false);

  const triggerScrape = async () => {
    setScraping(true);
    try {
      await apiClient.get("/scraper/run");
      alert("Scraping completed!");
      setCachedData({});
      setReloadTrigger(prev => prev + 1);
    } catch {
      alert("Scraping failed!");
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Vahan Dashboard</h1>
        <button
          onClick={triggerScrape}
          className="px-4 py-2 border rounded bg-black text-white disabled:opacity-50"
          disabled={scraping}
        >
          {scraping ? "Scraping..." : "Run Scraper"}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {["maker_vs_fuel", "maker_vs_vehicle_class"].map(key => (
          <button
            key={key}
            onClick={() => setMetricType(key)}
            className={`px-4 py-2 border rounded ${
              metricType === key ? "bg-black text-white" : ""
            }`}
          >
            {key.replace(/_/g, " ").toUpperCase()}
          </button>
        ))}

        <button
          onClick={() => setReloadTrigger(prev => prev + 1)}
          className="px-4 py-2 border rounded"
        >
          Refresh Data
        </button>
      </div>

      <VahanGridTable
        metricType={metricType}
        cachedData={cachedData}
        setCachedData={setCachedData}
        reloadTrigger={reloadTrigger}
      />
    </div>
  );
}
