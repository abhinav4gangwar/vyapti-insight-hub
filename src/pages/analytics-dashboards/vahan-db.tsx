import CustomTableBuilder from "@/components/vahan-components/CustomTableBuilder";
import VahanGridTable from "@/components/vahan-components/VahangridTable";
import { apiClient } from "@/lib/vahan-api-utils";
import { useState } from "react";

export default function VahanDashboardPage() {
  const [activeTab, setActiveTab] = useState("maker_vs_fuel");
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

  const tabs = [
    { key: "maker_vs_vehicle_class", label: "Vehicle Class View" },
    { key: "maker_vs_fuel", label: "Fuel View" },
    { key: "custom", label: "Custom Table Builder" },
  ];

  return (
    <div className="p-6 space-y-4">
      
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Vahan Dashboard</h1>

        <button
          onClick={triggerScrape}
          className="px-4 py-2 border rounded bg-black text-white disabled:opacity-50"
          disabled={scraping}
        >
          {scraping ? "Scraping..." : "Run Scraper"}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b pb-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded border-b-2 transition-all ${
              activeTab === tab.key
                ? "border-black font-semibold"
                : "border-transparent hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}

        
      </div>

      {/* RENDER CONTENT */}
      {activeTab === "maker_vs_fuel" || activeTab === "maker_vs_vehicle_class" ? (
        <VahanGridTable
          metricType={activeTab}
          cachedData={cachedData}
          setCachedData={setCachedData}
          reloadTrigger={reloadTrigger}
        />
      ) : (
        <CustomTableBuilder />
      )}
    </div>
  );
}
