
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dgtrApiClient } from "@/lib/dgtr-api-utils";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Investigation } from "./types";

export default function CatalogueTab() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all_countries");
  const [statusFilter, setStatusFilter] = useState("all_statuses");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const parseStatus = (raw: string): "Ongoing" | "Concluded" => {
    return raw.toLowerCase().includes("ongoing") ? "Ongoing" : "Concluded";
  };

  const fetchCountries = async () => {
    try {
      const res = await dgtrApiClient.get("/api/v1/distincts/countries");
      const list = (res.data.countries || [])
        .filter((c: string) => c && c.trim())
        .sort();
      setCountries(list);
    } catch (err) {
      setCountries([]);
    }
  };

  const fetchInvestigations = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      sort: "-last_seen", // latest first
    });

    if (search) params.append("q", search);
    if (countryFilter !== "all_countries") params.append("country", countryFilter);
    if (statusFilter !== "all_statuses") {
      const mapped = statusFilter === "Ongoing" ? "Ongoing" : "Concluded";
      params.append("status", mapped);
    }

    try {
      const res = await dgtrApiClient.get(`/api/v1/investigations?${params}`);
      const items = (res.data.items || []).map((item: any) => ({
        ...item,
        status: parseStatus(item.status),
      }));
      setInvestigations(items);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      console.error(err);
      setInvestigations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchInvestigations();
  }, [search, countryFilter, statusFilter]);

  useEffect(() => {
    fetchInvestigations();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by product or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:w-96"
        />

        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_countries">All Countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c.length > 60 ? c.substring(0, 57) + "..." : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_statuses">All Status</SelectItem>
            <SelectItem value="Ongoing">Ongoing</SelectItem>
            <SelectItem value="Concluded">Concluded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {investigations.length} of {total} investigations (Latest first)
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">S.No.</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Investigation Title</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Country</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    Loading investigations...
                  </td>
                </tr>
              ) : investigations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    No investigations found.
                  </td>
                </tr>
              ) : (
                investigations.map((inv, index) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-600">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-6 py-4 max-w-2xl">
                      <Link
                        to={`/dgtr-db/${inv.slug}`}
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
                        variant={inv.status === "Ongoing" ? "default" : "destructive"}
                        className={inv.status === "Ongoing" ? "bg-green-600" : "bg-red-600"}
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/dgtr-db/${inv.slug}`}
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          View Details
                        </Link>
                        <a
                          href={inv.detail_page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-700"
                          title="Open on DGTR"
                        >
                          <ExternalLink className="w-4 h-4" />
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
      {total > pageSize && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-5 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm font-medium">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={investigations.length < pageSize}
            className="px-5 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}