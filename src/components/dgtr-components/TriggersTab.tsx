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
  const pageSize = 10;

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
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
        
        // Auto-open first day with changes
        const firstDayWithChanges = daysList.find((d: DayData) => d.change_detected);
        if (firstDayWithChanges) {
          setOpenDays(new Set([firstDayWithChanges.date]));
        }
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

  const getMarkerBadge = (marker: string) => {
    if (marker === "new_investigation") {
      return <Badge className="bg-blue-600 text-xs">New Investigation</Badge>;
    }
    if (marker === "status_changed") {
      return <Badge className="bg-amber-600 text-xs">Status Changed</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Daily Triggers & New PDFs</h2>
        <Input
          type="date"
          placeholder="Filter by date (YYYY-MM-DD)"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-64"
        />
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

            return (
              <div key={day.date} className="border rounded-xl overflow-hidden shadow-md bg-white">
                <button
                  onClick={() => toggleDay(day.date)}
                  className="w-full px-6 py-5 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 transition-all flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-gray-800">{displayDate}</h3>
                    {day.change_detected && day.new_pdfs && (
                      <Badge variant="secondary" className="text-sm">
                        {day.new_pdfs.length} change{day.new_pdfs.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {!day.change_detected && (
                      <Badge variant="outline" className="text-sm">
                        No changes
                      </Badge>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                </button>

                {isOpen && day.change_detected && day.new_pdfs && (
                  <div className="border-t">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">PDF Title</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Investigation</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Country</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Markers</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {day.new_pdfs.map((event) => {
                            const inv = event.investigation;
                            const pdf = event.pdf;

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
                                  <span className="line-clamp-2" title={inv.country}>
                                    {inv.country || "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge
                                    variant={inv.status === "Ongoing" ? "default" : "destructive"}
                                    className={inv.status === "Ongoing" ? "bg-green-600" : "bg-red-600"}
                                  >
                                    {inv.status || "Unknown"}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-wrap gap-1">
                                    {inv.markers.map((marker, idx) => (
                                      <div key={idx}>{getMarkerBadge(marker)}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <a href={`/dgtr-db/${inv.uuid}`} className="text-blue-600 hover:underline text-sm font-medium">
                                      View Details
                                    </a>
                                    <a
                                      href={inv.url}
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

                {isOpen && !day.change_detected && (
                  <div className="p-8 text-center text-gray-500">
                    {day.message || "No changes detected on this day."}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!dateFilter && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-6 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <span className="text-sm font-medium">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
            className="px-6 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}