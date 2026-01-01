import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dgtrApiClient } from "@/lib/dgtr-api-utils";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function CatalogueTab() {
  const [investigations, setInvestigations] = useState([]);
  const [allInvestigations, setAllInvestigations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Ongoing" | "Concluded"
  >("all");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const fetchInvestigations = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) params.append("search", search);
    if (statusFilter !== "all") params.append("status", statusFilter);

    try {
      const res = await dgtrApiClient.get(`/dgtr/investigations?${params}`);
      const rawItems = res.data.data || [];

      setAllInvestigations(rawItems);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch investigations:", err);
      setAllInvestigations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Frontend filtering for country search
  useEffect(() => {
    if (!countrySearch.trim()) {
      setInvestigations(allInvestigations);
    } else {
      const searchTerm = countrySearch.toLowerCase().trim();
      const filtered = allInvestigations.filter((inv) => {
        const country = (inv.country || "").toLowerCase();
        return country.includes(searchTerm);
      });
      setInvestigations(filtered);
    }
  }, [countrySearch, allInvestigations]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchInvestigations();
  }, [page, search, statusFilter]);

  const totalPages = Math.ceil(total / pageSize);
  const displayCount = countrySearch ? investigations.length : total;

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

        <Input
          placeholder="Search by country..."
          value={countrySearch}
          onChange={(e) => setCountrySearch(e.target.value)}
          className="md:w-72"
        />

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as any)}
        >
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

      {/* Table */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                  S.No.
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                  Title
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                  Country
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                  Product
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                  Last Updated
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                  DGTR Link
                </th>
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
                    <td className="px-6 py-4 max-w-3xl">
                      <Link
                        to={`/dgtr-db/${inv.uuid}`}
                        className="text-blue-600 hover:underline font-medium line-clamp-2"
                        target="_blank"
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
                        variant={
                          inv.status === "Ongoing" ? "default" : "destructive"
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
                    <td className="px-6 py-4 max-w-xs">
                      <span className="line-clamp-2">
                        {inv.last_updated_date || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        <Link
                          to={inv.url}
                          target="_blank"
                          className="text-blue-600 hover:underline text-sm whitespace-nowrap"
                        >
                          View Details
                        </Link>
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
      {!countrySearch && totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing {investigations.length} of {displayCount} investigations
            {statusFilter !== "all" && ` (${statusFilter})`}
            {countrySearch && ` matching "${countrySearch}"`}
          </div>
          <div className="flex gap-2 justify-center items-center">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
            >
              Previous
            </button>

            {/* Page Numbers */}
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

                  if (
                    !showPage &&
                    pageNum !== page - 2 &&
                    pageNum !== page + 2
                  ) {
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
