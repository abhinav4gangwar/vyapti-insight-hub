import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, X } from "lucide-react";
import { getActivityLogs, getActivityLogDetails, ActivityLog, ActivityLogsFilters } from "@/lib/auth-api";
import { authService } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function ActivityLogs() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // For detail modal
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [filters, setFilters] = useState<ActivityLogsFilters>({
    page: 1,
    page_size: 50,
    username: "",
    endpoint: "",
    method: "",
    date_from: "",
    date_to: "",
  });

  const user = authService.getUser();
  const isAdmin = user?.username === "admin";

  console.log("ActivityLogs: initial render", {
    user,
    isAdmin,
    currentPage,
    filters,
  });

  // Redirect non-admins away
  useEffect(() => {
    console.log("ActivityLogs: admin guard useEffect", { isAdmin, user });
    if (!isAdmin) {
      console.warn("ActivityLogs: user is not admin, redirecting to /");
      navigate("/");
    }
  }, [isAdmin, navigate, user]);

  // Fetch logs whenever admin, page or filters change
  useEffect(() => {
    if (!isAdmin) {
      console.log("ActivityLogs: fetch useEffect aborted, not admin");
      return;
    }

    console.log("ActivityLogs: starting fetch", {
      currentPage,
      filters,
    });

    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getActivityLogs({
          page: currentPage,
          page_size: filters.page_size,
          username: filters.username || undefined,
          endpoint: filters.endpoint || undefined,
          method: filters.method || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
        });

        console.log("ActivityLogs: raw API response", response);

        let data: ActivityLog[] = [];
        let normalizedTotalPages = 1;
        let normalizedTotal = 0;

        if (response && typeof response === "object") {
          const r: any = response;

          // Handle logs array
          if (Array.isArray(r.logs)) {
            data = r.logs as ActivityLog[];
          } else {
            console.warn("ActivityLogs: response.logs is not an array, normalizing to []", {
              logs: r.logs,
            });
          }

          // Handle pagination
          const pag = r.pagination || {};
          if (typeof pag.total_pages === "number" && pag.total_pages > 0) {
            normalizedTotalPages = pag.total_pages;
          }

          if (typeof pag.total_count === "number" && pag.total_count >= 0) {
            normalizedTotal = pag.total_count;
          }
        } else {
          console.warn("ActivityLogs: unexpected response shape, normalizing to empty");
        }

        if (!normalizedTotal) {
          normalizedTotal = data.length;
        }

        setLogs(data);
        setTotalPages(normalizedTotalPages);
        setTotalLogs(normalizedTotal);

        console.log("ActivityLogs: state updated after API call", {
          logsCount: data.length,
          totalPages: normalizedTotalPages,
          totalLogs: normalizedTotal,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch activity logs";

        console.error("ActivityLogs: error while fetching logs", err);
        setError(errorMessage);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        console.log("ActivityLogs: fetch finished");
      }
    };

    fetchLogs();
  }, [
    isAdmin,
    currentPage,
    filters.page_size,
    filters.username,
    filters.endpoint,
    filters.method,
    filters.date_from,
    filters.date_to,
  ]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    console.log("ActivityLogs: filter change", { name, value });

    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    console.log("ActivityLogs: apply filters clicked", { filters });
    // Just resetting page; useEffect will re-run because filters in deps
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    console.log("ActivityLogs: reset filters clicked");

    setFilters({
      page: 1,
      page_size: 50,
      username: "",
      endpoint: "",
      method: "",
      date_from: "",
      date_to: "",
    });
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    console.log("ActivityLogs: previous page clicked", { currentPageBefore: currentPage });
    setCurrentPage(prev => {
      const next = Math.max(1, prev - 1);
      console.log("ActivityLogs: previous page computed", { prev, next });
      return next;
    });
  };

  const handleNextPage = () => {
    console.log("ActivityLogs: next page clicked", { currentPageBefore: currentPage, totalPages });
    setCurrentPage(prev => {
      const next = Math.min(totalPages, prev + 1);
      console.log("ActivityLogs: next page computed", { prev, next });
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-800";
      case "POST":
        return "bg-green-100 text-green-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return "bg-green-100 text-green-800";
    if (statusCode >= 300 && statusCode < 400) return "bg-blue-100 text-blue-800";
    if (statusCode >= 400 && statusCode < 500) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (!isAdmin) {
    console.log("ActivityLogs: render short circuit, not admin");
    return null;
  }

  const hasLogs = Array.isArray(logs) && logs.length > 0;
  const noLogs = Array.isArray(logs) && logs.length === 0;

  console.log("ActivityLogs: render snapshot", {
    isLoading,
    error,
    hasLogs,
    noLogs,
    currentPage,
    totalPages,
    totalLogs,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600 mt-1">View all user activity and API requests</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="username" className="text-sm">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Filter by username"
                  value={filters.username}
                  onChange={handleFilterChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endpoint" className="text-sm">
                  Endpoint
                </Label>
                <Input
                  id="endpoint"
                  name="endpoint"
                  placeholder="Filter by endpoint"
                  value={filters.endpoint}
                  onChange={handleFilterChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="method" className="text-sm">
                  Method
                </Label>
                <Input
                  id="method"
                  name="method"
                  placeholder="GET, POST, etc."
                  value={filters.method}
                  onChange={handleFilterChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="date_from" className="text-sm">
                  From Date
                </Label>
                <Input
                  id="date_from"
                  name="date_from"
                  type="date"
                  value={filters.date_from}
                  onChange={handleFilterChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="date_to" className="text-sm">
                  To Date
                </Label>
                <Input
                  id="date_to"
                  name="date_to"
                  type="date"
                  value={filters.date_to}
                  onChange={handleFilterChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} disabled={isLoading}>
                Apply Filters
              </Button>
              <Button onClick={handleResetFilters} variant="outline" disabled={isLoading}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <p className="text-gray-600">Loading activity logs...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logs Table */}
        {!isLoading && hasLogs && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                Activity Logs ({totalLogs} total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Username
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Method
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Query
                      </th>
                      {/* <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Status
                      </th> */}
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      return (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="py-3 px-4 text-gray-900">{log.username}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getMethodBadgeColor(
                                log.method
                              )}`}
                            >
                              {log.method}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-xs max-w-xs truncate">
                            {log.query || "-"}
                          </td>
                          {/* <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                                log.status_code
                              )}`}
                            >
                              {log.status_code}
                            </span>
                          </td> */}
                          <td className="py-3 px-4 text-gray-600 text-xs">
                            {formatDate(log.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && noLogs && !error && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-gray-600">No activity logs found</p>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoading}
                variant="outline"
              >
                Previous
              </Button>
              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || isLoading}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Activity Log Details</CardTitle>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDetailLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <p className="text-gray-600">Loading details...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Username</p>
                      <p className="text-sm text-gray-900">{selectedLog.username}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">User ID</p>
                      <p className="text-sm text-gray-900">{selectedLog.user_id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Method</p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${getMethodBadgeColor(
                          selectedLog.method
                        )}`}
                      >
                        {selectedLog.method}
                      </span>
                    </div>
                    {/* <div>
                      <p className="text-sm font-semibold text-gray-700">Status</p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                          selectedLog.status_code
                        )}`}
                      >
                        {selectedLog.status_code}
                      </span>
                    </div> */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Response Time</p>
                      <p className="text-sm text-gray-900">{selectedLog.response_time_ms}ms</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Date</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedLog.created_at)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700">Endpoint</p>
                    <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                      {selectedLog.endpoint}
                    </p>
                  </div>

                  {selectedLog.query && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Query</p>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded break-words">
                        {selectedLog.query}
                      </p>
                    </div>
                  )}

                  {selectedLog.core_prompt && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Core Prompt</p>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded break-words">
                        {selectedLog.core_prompt}
                      </p>
                    </div>
                  )}

                  {selectedLog.request_params && Object.keys(selectedLog.request_params).length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Request Parameters</p>
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(selectedLog.request_params, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
