

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dgtrApiClient } from "@/lib/dgtr-api-utils";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";


const getCleanStatus = (rawStatus: string | null | undefined): "Ongoing" | "Concluded" => {
  if (!rawStatus) return "Ongoing";
  const s = rawStatus.toString().toLowerCase();

  
  if (
    s.includes("concluded") ||
    s.includes("terminated") ||
    s.includes("withdrawn") ||
    s.includes("final finding") ||
    s.includes("final findings") ||
    s.includes("duty imposed") ||
    s.includes("recommendation")
  ) {
    return "Concluded";
  }

  
  if (
    s.includes("ongoing") ||
    s.includes("investigationanti") ||
    s.includes("initiated") ||
    s.includes("initiation") ||
    s.includes("oral hearing") ||
    s.startsWith("2 -") ||
    s.startsWith("3 -")
  ) {
    return "Ongoing";
  }

  return "Ongoing"; 
};

export default function CatalogueTab() {
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "ongoing" | "concluded">("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchCountries = async () => {
    try {
      const res = await dgtrApiClient.get("/api/v1/distincts/countries");
      setCountries((res.data.countries || []).filter(Boolean).sort());
    } catch (err) {
      setCountries([]);
    }
  };

  const fetchInvestigations = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) params.append("q", search);
    if (countryFilter !== "all") params.append("country", countryFilter);

    try {
      const res = await dgtrApiClient.get(`/api/v1/investigations?${params}`);
      const rawItems = res.data.items || [];

      // Apply status filter client-side
      const filtered = rawItems.filter((item: any) => {
        const clean = getCleanStatus(item.status);
        if (statusFilter === "ongoing") return clean === "Ongoing";
        if (statusFilter === "concluded") return clean === "Concluded";
        return true;
      });

      const processed = filtered.map((item: any) => ({
        ...item,
        cleanStatus: getCleanStatus(item.status),
      }));

      setInvestigations(processed);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      console.error(err);
      setInvestigations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    setPage(1);
  }, [search, countryFilter, statusFilter]);

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    fetchInvestigations();
  }, [page, search, countryFilter, statusFilter]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search investigations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:w-96"
        />

        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ongoing">Ongoing Investigations</SelectItem>
            <SelectItem value="concluded">Concluded / Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      <div className="text-sm text-gray-600">
        Showing {investigations.length} of {total} investigations
        {statusFilter !== "all" && ` (${statusFilter})`}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">S.No.</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Title</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Country</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : investigations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    No investigations found.
                  </td>
                </tr>
              ) : (
                investigations.map((inv, i) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-6 py-4 max-w-2xl">
                      <Link
                        to={`/dgtr-db/${inv.slug}`}
                        className="text-blue-600 hover:underline font-medium line-clamp-2"
                      >
                        {inv.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{inv.country}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={inv.cleanStatus === "Ongoing" ? "default" : "destructive"}
                        className={inv.cleanStatus === "Ongoing" ? "bg-green-600" : "bg-red-600"}
                      >
                        {inv.cleanStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        <Link to={`/dgtr-db/${inv.slug}`} className="text-blue-600 hover:underline text-sm">
                          View
                        </Link>
                        <a href={inv.detail_page_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination — NOW WORKING */}
      {totalPages > 1 && (
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