// src/components/dgtr/TriggersTab.tsx
// FINAL VERSION – Loads ALL Triggers (Auto-Pagination, No Limits)

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dgtrApiClient } from "@/lib/dgtr-api-utils";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

type ChangeType = "NEW_INVESTIGATION" | "STATUS_CONCLUDED" | "UPDATED" | "OTHER";

interface Trigger {
  id: number;
  change_type: ChangeType;
  investigation_id: number;
  slug: string;
  detected_at: string;
  after: {
    title: string;
    country: string;
    status: string;
    detail_page_url: string;
  };
}

interface DayGroup {
  date: string;
  display: string;
  triggers: Trigger[];
}

const changeTypeConfig: Record<ChangeType, { label: string; bg: string; text: string }> = {
  NEW_INVESTIGATION: { label: "New Investigation", bg: "bg-blue-100", text: "text-blue-800" },
  STATUS_CONCLUDED: { label: "Concluded", bg: "bg-red-100", text: "text-red-800" },
  UPDATED: { label: "Updated", bg: "bg-amber-100", text: "text-amber-800" },
  OTHER: { label: "Changed", bg: "bg-purple-100", text: "text-purple-800" },
};

export default function TriggersTab() {
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [openDays, setOpenDays] = useState<Set<string>>(new Set());

  const toggleDay = (date: string): void => {
    setOpenDays(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const fetchAllTriggers = async () => {
    setLoading(true);
    const allTriggers: Trigger[] = [];
    let page = 1;
    const pageSize = 100; // max allowed by backend

    try {
      while (true) {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: pageSize.toString(),
        });
        if (filter !== "all") {
          params.append("change_type", filter);
        }

        const res = await dgtrApiClient.get(`/api/v1/triggers?${params}`);
        const items: Trigger[] = res.data.items || [];

        if (items.length === 0) break; // no more data

        allTriggers.push(...items);
        if (items.length < pageSize) break; // last page

        page++;
      }

      // Group by date
      const map = new Map<string, Trigger[]>();
      allTriggers.forEach(t => {
        const dateKey = t.detected_at.split("T")[0];
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(t);
      });

      const sortedGroups: DayGroup[] = Array.from(map.entries())
        .map(([date, triggers]) => ({
          date,
          display: format(parseISO(date), "dd MMMM yyyy"),
          triggers,
        }))
        .sort((a, b) => b.date.localeCompare(a.date));

      setGroups(sortedGroups);

      // Auto-open most recent day
      if (sortedGroups.length > 0) {
        setOpenDays(new Set([sortedGroups[0].date]));
      }
    } catch (err) {
      console.error("Failed to load all triggers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTriggers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const getStatus = (status: string): "Ongoing" | "Concluded" =>
    status.toLowerCase().includes("ongoing") ? "Ongoing" : "Concluded";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Change Log & Triggers</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All Changes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Changes</SelectItem>
            <SelectItem value="NEW_INVESTIGATION">New Investigations</SelectItem>
            <SelectItem value="STATUS_CONCLUDED">Concluded Cases</SelectItem>
            <SelectItem value="UPDATED">Updated Cases</SelectItem>
            <SelectItem value="OTHER">Other Changes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading all changes from server...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border-2 border-dashed rounded-xl bg-gray-50">
          No changes detected.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ date, display, triggers }) => {
            const isOpen = openDays.has(date);

            return (
              <div key={date} className="border rounded-xl overflow-hidden shadow-md bg-white">
                <button
                  onClick={() => toggleDay(date)}
                  className="w-full px-6 py-5 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 transition-all flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-gray-800">{display}</h3>
                    <Badge variant="secondary" className="text-sm">
                      {triggers.length} change{triggers.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  {isOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                </button>

                {isOpen && (
                  <div className="border-t">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Type</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Investigation</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Country</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {triggers.map((t) => {
                            const config = changeTypeConfig[t.change_type];
                            const inv = t.after;

                            return (
                              <tr key={t.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
                                    {config.label}
                                  </span>
                                </td>
                                <td className="px-6 py-4 max-w-lg">
                                  <Link
                                    to={`/dgtr-db/${t.slug}`}
                                    className="text-blue-600 hover:underline font-medium line-clamp-2"
                                  >
                                    {inv.title}
                                  </Link>
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                  <span className="line-clamp-2" title={inv.country}>
                                    {inv.country}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge
                                    variant={getStatus(inv.status) === "Ongoing" ? "default" : "destructive"}
                                    className={getStatus(inv.status) === "Ongoing" ? "bg-green-600" : "bg-red-600"}
                                  >
                                    {getStatus(inv.status)}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <Link to={`/dgtr-db/${t.slug}`} className="text-blue-600 hover:underline text-sm font-medium">
                                      View Details
                                    </Link>
                                    <a
                                      href={inv.detail_page_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}