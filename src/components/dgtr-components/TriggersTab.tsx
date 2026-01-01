import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { dgtrApiClient } from "@/lib/dgtr-api-utils";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

interface PDFInfo {
  id: number;
  title: string;
  url: string;
  publish_date: string;
  created_at: string;
}

interface InvestigationInfo {
  uuid: string;
  title: string;
  country: string;
  status: string;
  url: string;
  file_no: string;
  product: string;
  markers: string[];
}

interface DayEvent {
  pdf: PDFInfo;
  investigation: InvestigationInfo;
}

interface DayData {
  date: string;
  change_detected: boolean;
  new_pdfs?: DayEvent[];
  message?: string;
}

export default function TriggersTab() {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDays, setOpenDays] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalDays, setTotalDays] = useState(0);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [markerFilter, setMarkerFilter] = useState("");
  const pageSize = 10;

  const toggleDay = (date: string): void => {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const fetchTriggers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (dateFilter) {
        params.append("date", dateFilter);
      }

      const res = await dgtrApiClient.get(`/dgtr/triggers?${params}`);

      // Handle single date response
      if (res.data.date) {
        setDays([res.data.data]);
        setTotalDays(1);
        setOpenDays(new Set([res.data.date]));
      } else {
        // Handle paginated response
        const daysList = res.data.days || [];
        setDays(daysList);
        setTotalDays(res.data.total_days || 0);

        // Open all days by default
        const allDates = daysList.map((d: DayData) => d.date);
        setOpenDays(new Set(allDates));
      }
    } catch (err) {
      console.error("Failed to load triggers:", err);
      setDays([]);
      setTotalDays(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [dateFilter]);

  useEffect(() => {
    fetchTriggers();
  }, [page, dateFilter]);

  const totalPages = Math.ceil(totalDays / pageSize);
  const startIndex = totalDays === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalDays);

  const getMarkerBadge = (marker: string) => {
    if (marker === "new_investigation") {
      return <Badge className="bg-blue-600 text-xs whitespace-nowrap">New Investigation</Badge>;
    }
    if (marker === "status_changed") {
      return <Badge className="bg-amber-600 text-xs whitespace-nowrap">Status Changed</Badge>;
    }
    if (marker === "new_pdf") {
      return <Badge className="bg-purple-600 text-xs">New PDF</Badge>;
    }
    return null;
  };

  // Frontend filtering function
  const filterEvents = (events: DayEvent[]) => {
    return events.filter((event) => {
      const inv = event.investigation;

      const markers = inv.markers.length === 0 ? ["new_pdf"] : inv.markers;

      // Status filter
      if (statusFilter && inv.status !== statusFilter) {
        return false;
      }

      // Marker filter
      if (markerFilter && !markers.includes(markerFilter)) {
        return false;
      }

      return true;
    });
  };

  // Check if filters are at default (all statuses, all triggers)
  const isDefaultFilters = statusFilter === "" && markerFilter === "";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-900">Triggers</h2>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            placeholder="Filter by date (YYYY-MM-DD)"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Concluded">Concluded</option>
          </select>
          <select
            value={markerFilter}
            onChange={(e) => setMarkerFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Triggers</option>
            <option value="new_investigation">New Investigation</option>
            <option value="status_changed">Status Changed</option>
            <option value="new_pdf">New PDF</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading triggers...</p>
        </div>
      ) : days.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border-2 border-dashed rounded-xl bg-gray-50">
          No triggers found.
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day) => {
            const isOpen = openDays.has(day.date);
            const displayDate = formatDate(day.date);

            // Apply frontend filtering
            const filteredEvents = day.new_pdfs
              ? filterEvents(day.new_pdfs)
              : [];
            const hasFilteredEvents = filteredEvents.length > 0;

            // Skip rendering empty date cards when filters are applied
            if (!isDefaultFilters && !hasFilteredEvents) {
              return null;
            }

            return (
              <div
                key={day.date}
                className="border rounded-xl overflow-hidden shadow-md bg-white"
              >
                <button
                  onClick={() => toggleDay(day.date)}
                  className="w-full px-6 py-5 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 transition-all flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {displayDate}
                    </h3>
                    {day.change_detected && hasFilteredEvents && (
                      <Badge variant="secondary" className="text-sm">
                        {filteredEvents.length} change
                        {filteredEvents.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {(!day.change_detected || !hasFilteredEvents) && (
                      <Badge variant="outline" className="text-sm">
                        No changes
                      </Badge>
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-6 h-6" />
                  ) : (
                    <ChevronDown className="w-6 h-6" />
                  )}
                </button>

                {isOpen && day.change_detected && hasFilteredEvents && (
                  <div className="border-t">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                              PDF Title
                            </th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                              Investigation
                            </th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                              Country
                            </th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                              Status
                            </th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                              Trigger Type
                            </th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                              Vyapti Link
                            </th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                              DGTR Link
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200">
                          {filteredEvents.map((event) => {
                            const inv = event.investigation;
                            const pdf = event.pdf;

                            const displayMarkers =
                              inv.markers.length === 0
                                ? ["new_pdf"]
                                : inv.markers;

                            return (
                              <tr key={pdf.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 max-w-xs">
                                  <a
                                    href={pdf.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline line-clamp-2"
                                  >
                                    {pdf.title}
                                  </a>
                                  {pdf.publish_date && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Published: {pdf.publish_date}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 max-w-lg">
                                  <a
                                    href={`/dgtr-db/${inv.uuid}`}
                                    target="_blank"
                                    className="text-blue-600 hover:underline font-medium line-clamp-2"
                                  >
                                    {inv.title}
                                  </a>
                                  {inv.file_no && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      File: {inv.file_no}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                  <span
                                    className="line-clamp-2"
                                    title={inv.country}
                                  >
                                    {inv.country || "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge
                                    variant={
                                      inv.status === "Ongoing"
                                        ? "default"
                                        : "destructive"
                                    }
                                    className={
                                      inv.status === "Ongoing"
                                        ? "bg-green-600"
                                        : "bg-red-600"
                                    }
                                  >
                                    {inv.status || "Unknown"}
                                  </Badge>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex flex-wrap gap-1">
                                    {displayMarkers.map((marker, idx) => (
                                      <div key={idx}>
                                        {getMarkerBadge(marker)}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <a
                                      href={`/dgtr-db/${inv.uuid}`}
                                      target="_blank"
                                      className="text-blue-600 hover:underline text-sm font-medium whitespace-nowrap"
                                    >
                                      View Details
                                    </a>
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  <a
                                    href={inv.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {isOpen && (!day.change_detected || !hasFilteredEvents) && (
                  <div className="p-8 text-center text-gray-500">
                    {!hasFilteredEvents && day.change_detected
                      ? "No changes match the selected filters."
                      : day.message || "No changes detected on this day."}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!dateFilter && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-8">
          <div className="text-sm text-gray-600">
            Showing {startIndex}-{endIndex} of {totalDays} results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => {
                  const showPage =
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1);

                  const showEllipsisBefore = pageNum === page - 2 && page > 4;
                  const showEllipsisAfter =
                    pageNum === page + 2 && page < totalPages - 3;

                  if (showEllipsisBefore || showEllipsisAfter) {
                    return (
                      <span key={pageNum} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }

                  if (!showPage && pageNum !== page - 2 && pageNum !== page + 2) {
                    return null;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? "bg-blue-600 text-white"
                          : "border hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
            </div>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
