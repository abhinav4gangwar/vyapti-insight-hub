import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dgtrApiClient } from "@/lib/dgtr-api-utils";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function CatalogueTab() {
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Ongoing" | "Concluded">("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchCountries = async () => {
    try {
      const res = await dgtrApiClient.get("/dgtr/investigations/meta/countries");
      setCountries((res.data.countries || []).filter(Boolean).sort());
    } catch (err) {
      console.error("Failed to fetch countries:", err);
      setCountries([]);
    }
  };

  const fetchInvestigations = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) params.append("search", search);
    if (countryFilter !== "all") params.append("countries", countryFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);

    try {
      const res = await dgtrApiClient.get(`/dgtr/investigations?${params}`);
      const rawItems = res.data.data || [];

      setInvestigations(rawItems);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch investigations:", err);
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
            <SelectItem value="Ongoing">Ongoing Investigations</SelectItem>
            <SelectItem value="Concluded">Concluded / Terminated</SelectItem>
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
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Product</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : investigations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No investigations found.
                  </td>
                </tr>
              ) : (
                investigations.map((inv, i) => (
                  <tr key={inv.uuid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-6 py-4 max-w-2xl">
                      <Link
                        to={`/dgtr-db/${inv.uuid}`}
                        className="text-blue-600 hover:underline font-medium line-clamp-2"
                      >
                        {inv.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{inv.country || "—"}</td>
                    <td className="px-6 py-4 max-w-xs">
                      <span className="line-clamp-2">{inv.product || "—"}</span>
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
                      <div className="flex gap-4">
                        <Link to={`/dgtr-db/${inv.uuid}`} className="text-blue-600 hover:underline text-sm">
                          View
                        </Link>
                        <a href={inv.url} target="_blank" rel="noopener noreferrer">
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

      {/* Pagination */}
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