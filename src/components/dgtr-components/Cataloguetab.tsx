
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dgtrApiClient } from "@/lib/dgtr-api-utils";
import InvestigationCard from "./Investigationcard";
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

  // Clean and dedupe countries
  const fetchCountries = async () => {
    try {
      const res = await dgtrApiClient.get("/api/v1/distincts/countries");
      const raw = res.data.countries || [];
      const cleaned = raw
        .filter((c: string) => c && c.trim() !== "")
        .map((c: string) => c.trim())
        .sort();
      setCountries(cleaned);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvestigations = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      sort: "-last_seen",
    });

    if (search) params.append("q", search);
    if (countryFilter !== "all_countries") params.append("country", countryFilter);
    if (statusFilter !== "all_statuses") params.append("status", statusFilter);

    try {
      const res = await dgtrApiClient.get(`/api/v1/investigations?${params}`);
      const items = (res.data.items || res.data.results || res.data).map((item: any) => ({
        ...item,
        status: item.status.includes("Ongoing") ? "Ongoing" : "Concluded",
      }));
      setInvestigations(items);
      setTotal(res.data.meta?.total || res.data.count || items.length);
    } catch (err) {
      console.error(err);
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
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search title or product..."
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
                {c.length > 50 ? c.substring(0, 47) + "..." : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_statuses">All Status</SelectItem>
            <SelectItem value="Ongoing">Ongoing</SelectItem>
            <SelectItem value="Concluded">Concluded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : investigations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No investigations found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {investigations.map((inv) => (
            <InvestigationCard key={inv.id} investigation={inv} />
          ))}
        </div>
      )}

      {total > pageSize && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={investigations.length < pageSize}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}