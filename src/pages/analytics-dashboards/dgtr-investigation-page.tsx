import { Badge } from "@/components/ui/badge";
import { dgtrApiClient } from "@/lib/dgtr-api-utils";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface PDFLink {
  id: number;
  url: string;
  title: string | null;
  publish_date: string | null;
  created_at: string;
}

interface Investigation {
  uuid: string;
  title: string;
  country: string;
  status: string;
  url: string;
  file_no: string | null;
  product: string | null;
  created_at: string;
  updated_at: string;
  pdf_links: PDFLink[];
}

export default function InvestigationDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [inv, setInv] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uuid) return;

    dgtrApiClient
      .get(`/dgtr/investigations/${uuid}`)
      .then((res) => {
        setInv(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load investigation", err);
        setLoading(false);
      });
  }, [uuid]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p>Loading investigation details...</p>
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="p-12 text-center text-red-600">
        Investigation not found
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Back Button */}
      <a href="/dgtr-db" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Catalogue
      </a>

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
          <strong className="text-gray-700">Product:</strong>
          <p className="mt-1">{inv.product || "Not specified"}</p>
        </div>
        <div>
          <strong className="text-gray-700">File Number:</strong>
          <p className="mt-1">{inv.file_no || "Not available"}</p>
        </div>
        <div>
          <strong className="text-gray-700">Created Date:</strong>
          <p className="mt-1">{inv.created_at || "Not available"}</p>
        </div>
        <div>
          <strong className="text-gray-700">Last Updated:</strong>
          <p className="mt-1">{inv.updated_at || "Not available"}</p>
        </div>
        <div>
          <strong className="text-gray-700">Official Page:</strong>
          <a
            href={inv.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            View on DGTR <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* PDF Links */}
      {inv.pdf_links && inv.pdf_links.length > 0 ? (
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <h2 className="text-lg font-semibold bg-gray-100 px-6 py-4 border-b">
            Related Documents ({inv.pdf_links.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">S.No.</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Publish Date</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
  {inv.pdf_links
    .filter(pdf => pdf.title?.toLowerCase() !== "director general")
    .map((pdf, i) => (
      <tr key={pdf.id} className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 font-medium">{i + 1}</td>
        <td className="px-6 py-4 max-w-md">
          <p className="line-clamp-2">{pdf.title || "Untitled Document"}</p>
        </td>
        <td className="px-6 py-4">
          {pdf.publish_date || "—"}
        </td>
        <td className="px-6 py-4">
          <a
            href={pdf.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium"
          >
            <FileText className="w-4 h-4" />
            View PDF
          </a>
        </td>
      </tr>
    ))}
</tbody>

            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 border rounded-lg">
          No documents available.
        </div>
      )}
    </div>
  );
}