
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Investigation } from "@/components/dgtr-components/types";
import { Badge } from "@/components/ui/badge";
import { dgtrApiClient } from "@/lib/dgtr-api-utils";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";

interface TimelineRow {
  srNo: string;
  event: string;
  size?: string;
  date: string;
  pdf_url?: string;
}

export default function InvestigationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [inv, setInv] = useState<Investigation | null>(null);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    dgtrApiClient
      .get(`/api/v1/investigations/${slug}`)
      .then((res) => {
        const data = res.data;

        // Normalize status
        const normalizedStatus = data.status?.includes("Ongoing") ? "Ongoing" : "Concluded";
        setInv({ ...data, status: normalizedStatus });

        // Parse timeline from detail_json.timeline
        const rawTimeline = data.detail_json?.timeline || data.timeline || [];
        const parsed: TimelineRow[] = rawTimeline.map((item: any) => {
          const cols = item.cols || [];
          const pdfs = item.pdfs || [];

          return {
            srNo: cols[0] || "",
            event: cols[1] || "Unknown Event",
            size: cols[2] || "",
            date: cols[3] || "",
            pdf_url: pdfs[0] || undefined,
          };
        });

        setTimeline(parsed);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load investigation", err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="p-12 text-center text-gray-500">Loading investigation details...</div>;
  if (!inv) return <div className="p-12 text-center text-red-600">Investigation not found</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Back Button */}
      <Link to="/dgtr-db" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Catalogue
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start gap-6">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{inv.title}</h1>
        <Badge
          variant={inv.status === "Ongoing" ? "default" : "destructive"}
          className={inv.status === "Ongoing" ? "bg-green-600" : "bg-red-600"}
        >
          {inv.status}
        </Badge>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-lg text-sm">
        <div>
          <strong className="text-gray-700">Country:</strong>
          <p className="mt-1">{inv.country || "Not specified"}</p>
        </div>
        <div>
          <strong className="text-gray-700">Initiation Date:</strong>
          <p className="mt-1">{inv.initiation_date || "Not available"}</p>
        </div>
        <div>
          <strong className="text-gray-700">Official Page:</strong>
          <a
            href={inv.detail_page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            View on DGTR <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Timeline Table */}
      {timeline.length > 0 ? (
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <h2 className="text-lg font-semibold bg-gray-100 px-6 py-4 border-b">Timeline of Events</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">S.No.</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Event</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {timeline.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{row.srNo}</td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="line-clamp-2">{row.event}</p>
                      {row.size && <span className="text-xs text-gray-500">({row.size})</span>}
                    </td>
                    <td className="px-6 py-4">{row.date}</td>
                    <td className="px-6 py-4">
                      {row.pdf_url ? (
                        <a
                          href={row.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium"
                        >
                          <FileText className="w-4 h-4" />
                          View PDF
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 border rounded-lg">
          No timeline events available.
        </div>
      )}
    </div>
  );
}