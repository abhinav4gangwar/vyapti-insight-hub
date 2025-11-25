
import { useEffect, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dgtrApiClient } from "@/lib/dgtr-api-utils";
import InvestigationCard from "./Investigationcard";
import { Trigger } from "./types";

const changeTypeOptions = [
  { value: "all_changes", label: "All Changes" },
  { value: "NEW_INVESTIGATION", label: "New Investigations" },
  { value: "STATUS_CONCLUDED", label: "Newly Concluded" },
  { value: "UPDATED", label: "Updated" },
  { value: "OTHER", label: "Other Changes" },
] as const;

export default function TriggersTab() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [changeTypeFilter, setChangeTypeFilter] = useState("all_changes");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchTriggers = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (changeTypeFilter !== "all_changes") {
      params.append("change_type", changeTypeFilter);
    }

    try {
      const res = await dgtrApiClient.get(`/api/v1/triggers?${params}`);
      setTriggers(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to load triggers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchTriggers();
  }, [changeTypeFilter]);

  useEffect(() => {
    fetchTriggers();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent Changes & Triggers</h2>
        <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {changeTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading triggers...</div>
      ) : triggers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No recent changes detected.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {triggers.map((t) => (
            <InvestigationCard
              key={t.id}
              investigation={t.investigation}
              triggerType={t.change_type}
              detectedAt={t.detected_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}