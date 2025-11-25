
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Investigation } from "@/components/dgtr-components/types";
import { Badge } from "@/components/ui/badge";
import { dgtrApiClient } from "@/lib/dgtr-api-utils";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function InvestigationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [inv, setInv] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    dgtrApiClient.get(`/api/v1/investigations/${slug}`).then(res => {
      const data = res.data;
      data.status = data.status.includes("Ongoing") ? "Ongoing" : "Concluded";
      setInv(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!inv) return <div className="p-8 text-center text-red-600">Investigation not found</div>;

  const timeline = inv.detail_json?.timeline || [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <Link to="/dgtr-db" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Catalogue
      </Link>

      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold text-gray-900">{inv.title}</h1>
        <Badge variant={inv.status === "Ongoing" ? "default" : "destructive"}
               className={inv.status === "Ongoing" ? "bg-green-600" : "bg-red-600"}>
          {inv.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-gray-50 p-4 rounded">
        <div><strong>Country:</strong> {inv.country}</div>
        <div><strong>Initiation:</strong> {inv.initiation_date || "N/A"}</div>
        <div>
          <a href={inv.detail_page_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 flex items-center gap-1">
            Official DGTR Page <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {timeline.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-left">Document</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {timeline.map((row: any, i: number) => (
                <tr key={i}>
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">{row.event}</td>
                  <td className="px-4 py-3">
                    {row.pdf_url ? (
                      <a href={row.pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View PDF
                      </a>
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}