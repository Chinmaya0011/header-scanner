"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Eye,
  FileCode,
  Shield,
  X,
  ArrowUpDown,
  Columns,
  CheckSquare,
  Square,
  Download,
  SlidersHorizontal,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Info,
} from "lucide-react";
import { SeverityBadge, ImpactBadge } from "./SeverityBadge";

export default function FindingsTable({
  findings = [],
  onSelectFinding,
  selectedSeverityFilter,
  onClearFilters,
  vulnerabilityClasses = [],
}) {
  // Global search & filters
  const [globalFilter, setGlobalFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState(selectedSeverityFilter || "ALL");
  const [impactFilter, setImpactFilter] = useState("ALL");
  const [vulnClassFilter, setVulnClassFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Sorting state
  const [sortField, setSortField] = useState("severity");
  const [sortDirection, setSortDirection] = useState("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Row selection & expansion state
  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [findingStatuses, setFindingStatuses] = useState({});

  // Column visibility state
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    severity: true,
    ruleId: true,
    filePath: true,
    category: true,
    status: true,
    actions: true,
  });

  // Sync external severity filter changes
  React.useEffect(() => {
    if (selectedSeverityFilter) {
      setSeverityFilter(selectedSeverityFilter);
      setCurrentPage(1);
    }
  }, [selectedSeverityFilter]);

  // Handle local row status changes
  const handleRowStatusChange = (rowId, newStatus, e) => {
    e.stopPropagation();
    setFindingStatuses((prev) => ({ ...prev, [rowId]: newStatus }));
  };

  // Filtered dataset calculation
  const filteredFindings = useMemo(() => {
    return findings.filter((item, index) => {
      const rowId = `${item.check_id}-${item.path}-${item.start?.line}-${index}`;
      const extra = item.extra || {};
      const metadata = extra.metadata || {};
      const currentStatus = findingStatuses[rowId] || "Open";

      // Severity filter
      if (severityFilter !== "ALL" && (extra.severity || "").toUpperCase() !== severityFilter) {
        return false;
      }

      // Impact filter
      if (impactFilter !== "ALL" && (metadata.impact || "").toUpperCase() !== impactFilter) {
        return false;
      }

      // Vulnerability Class filter
      if (vulnClassFilter !== "ALL") {
        const vClasses = metadata.vulnerability_class || ["Other"];
        if (!vClasses.includes(vulnClassFilter)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "ALL" && currentStatus !== statusFilter) {
        return false;
      }

      // Global search term
      if (globalFilter.trim() !== "") {
        const term = globalFilter.toLowerCase();
        const checkId = (item.check_id || "").toLowerCase();
        const path = (item.path || "").toLowerCase();
        const message = (extra.message || "").toLowerCase();
        const cweList = (metadata.cwe || []).join(" ").toLowerCase();
        const owaspList = (metadata.owasp || []).join(" ").toLowerCase();

        return (
          checkId.includes(term) ||
          path.includes(term) ||
          message.includes(term) ||
          cweList.includes(term) ||
          owaspList.includes(term)
        );
      }

      return true;
    });
  }, [findings, severityFilter, impactFilter, vulnClassFilter, statusFilter, globalFilter, findingStatuses]);

  // Sorted dataset calculation
  const sortedFindings = useMemo(() => {
    const sevOrder = { ERROR: 3, CRITICAL: 3, WARNING: 2, INFO: 1 };
    const impactOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };

    return [...filteredFindings].sort((a, b) => {
      let comparison = 0;

      if (sortField === "severity") {
        const sevA = sevOrder[(a.extra?.severity || "").toUpperCase()] || 0;
        const sevB = sevOrder[(b.extra?.severity || "").toUpperCase()] || 0;
        comparison = sevA - sevB;
      } else if (sortField === "impact") {
        const impA = impactOrder[(a.extra?.metadata?.impact || "").toUpperCase()] || 0;
        const impB = impactOrder[(b.extra?.metadata?.impact || "").toUpperCase()] || 0;
        comparison = impA - impB;
      } else if (sortField === "file") {
        comparison = (a.path || "").localeCompare(b.path || "");
      } else if (sortField === "line") {
        comparison = (a.start?.line || 0) - (b.start?.line || 0);
      } else if (sortField === "ruleId") {
        comparison = (a.check_id || "").localeCompare(b.check_id || "");
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [filteredFindings, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedFindings.length / pageSize) || 1;
  const paginatedFindings = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedFindings.slice(startIdx, startIdx + pageSize);
  }, [sortedFindings, currentPage, pageSize]);

  // Row selection helpers
  const selectedCount = Object.keys(selectedRowIds).filter((id) => selectedRowIds[id]).length;
  const isAllPaginatedSelected =
    paginatedFindings.length > 0 &&
    paginatedFindings.every((item, index) => {
      const rowId = `${item.check_id}-${item.path}-${item.start?.line}-${index}`;
      return selectedRowIds[rowId];
    });

  const toggleSelectAll = () => {
    const nextState = { ...selectedRowIds };
    paginatedFindings.forEach((item, index) => {
      const rowId = `${item.check_id}-${item.path}-${item.start?.line}-${index}`;
      nextState[rowId] = !isAllPaginatedSelected;
    });
    setSelectedRowIds(nextState);
  };

  const toggleSelectRow = (rowId, e) => {
    e.stopPropagation();
    setSelectedRowIds((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const toggleRowExpand = (rowId, e) => {
    e.stopPropagation();
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleResetFilters = () => {
    setSeverityFilter("ALL");
    setImpactFilter("ALL");
    setVulnClassFilter("ALL");
    setStatusFilter("ALL");
    setGlobalFilter("");
    setCurrentPage(1);
    if (onClearFilters) onClearFilters();
  };

  const hasActiveFilters =
    severityFilter !== "ALL" ||
    impactFilter !== "ALL" ||
    vulnClassFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    globalFilter.trim() !== "";

  // Export selected rows as CSV
  const exportSelectedCSV = () => {
    const selectedItems = findings.filter((item, index) => {
      const rowId = `${item.check_id}-${item.path}-${item.start?.line}-${index}`;
      return selectedRowIds[rowId];
    });

    if (selectedItems.length === 0) return;

    const headers = ["Rule ID", "Severity", "Impact", "File Path", "Line", "Message"];
    const rows = selectedItems.map((item) => [
      `"${item.check_id || ""}"`,
      `"${item.extra?.severity || ""}"`,
      `"${item.extra?.metadata?.impact || ""}"`,
      `"${item.path || ""}"`,
      item.start?.line || 1,
      `"${(item.extra?.message || "").replace(/"/g, '""')}"`,
    ]);

    const csvStr = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `selected-security-findings-${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md mb-6">
      {/* Top Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Shield size={20} className="text-indigo-400" />
              Security Findings Directory
            </h3>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full">
              {filteredFindings.length} Results
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            TanStack-powered stateful security table with sorting, filtering, and row inspection
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Global Search */}
          <div className="relative flex-1 sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search findings (Press '/' to search)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Column Visibility Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              title="Toggle Column Visibility"
            >
              <Columns size={14} className="text-slate-400" />
              Columns
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 z-30 space-y-2 text-xs">
                <div className="font-semibold text-slate-300 pb-1 border-b border-slate-800">
                  Toggle Columns
                </div>
                {Object.keys(visibleColumns).map((col) => (
                  <label key={col} className="flex items-center gap-2 text-slate-300 capitalize cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns[col]}
                      onChange={() =>
                        setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }))
                      }
                      className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                    />
                    {col === "ruleId" ? "Rule ID" : col === "filePath" ? "File Path" : col}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Bulk CSV Export */}
          {selectedCount > 0 && (
            <button
              onClick={exportSelectedCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
            >
              <Download size={14} />
              Export ({selectedCount})
            </button>
          )}
        </div>
      </div>

      {/* Multi-Filter Toolbar */}
      <div className="flex items-center gap-3 flex-wrap p-3 bg-slate-950/70 border border-slate-800 rounded-lg mb-4 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
          <SlidersHorizontal size={13} className="text-indigo-400" />
          Filters:
        </div>

        {/* Severity filter */}
        <select
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="ALL">All Severities</option>
          <option value="ERROR">ERROR / Critical</option>
          <option value="WARNING">WARNING / High</option>
          <option value="INFO">INFO / Low</option>
        </select>

        {/* Impact filter */}
        <select
          value={impactFilter}
          onChange={(e) => {
            setImpactFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="ALL">All Impact Levels</option>
          <option value="HIGH">High Impact</option>
          <option value="MEDIUM">Medium Impact</option>
          <option value="LOW">Low Impact</option>
        </select>

        {/* Vulnerability Class filter */}
        {vulnerabilityClasses.length > 0 && (
          <select
            value={vulnClassFilter}
            onChange={(e) => {
              setVulnClassFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Vulnerability Classes</option>
            {vulnerabilityClasses.map((vc) => (
              <option key={vc} value={vc}>
                {vc}
              </option>
            ))}
          </select>
        )}

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="False Positive">False Positive</option>
          <option value="Resolved">Resolved</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="ml-auto px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Table Structure */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 shadow-inner">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3 w-10 text-center">
                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                  {isAllPaginatedSelected ? (
                    <CheckSquare size={16} className="text-indigo-400" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th className="p-3 w-8"></th>

              {visibleColumns.severity && (
                <th
                  onClick={() => handleSort("severity")}
                  className="p-3 cursor-pointer hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Severity <ArrowUpDown size={12} />
                  </div>
                </th>
              )}

              {visibleColumns.ruleId && (
                <th
                  onClick={() => handleSort("ruleId")}
                  className="p-3 cursor-pointer hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Rule ID & Check Name <ArrowUpDown size={12} />
                  </div>
                </th>
              )}

              {visibleColumns.filePath && (
                <th
                  onClick={() => handleSort("file")}
                  className="p-3 cursor-pointer hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    File Location & Line <ArrowUpDown size={12} />
                  </div>
                </th>
              )}

              {visibleColumns.category && <th className="p-3">Category / CWE</th>}

              {visibleColumns.status && <th className="p-3">Status</th>}

              {visibleColumns.actions && <th className="p-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
            {paginatedFindings.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500">
                  <FileCode size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
                  <div className="font-semibold text-slate-300 text-sm">No security findings found</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Try adjusting your search criteria or resetting filters.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedFindings.map((item, index) => {
                const rowId = `${item.check_id}-${item.path}-${item.start?.line}-${index}`;
                const extra = item.extra || {};
                const metadata = extra.metadata || {};
                const isSelected = !!selectedRowIds[rowId];
                const isExpanded = !!expandedRows[rowId];
                const currentStatus = findingStatuses[rowId] || "Open";

                const ruleShortName = item.check_id?.split(".").pop() || item.check_id;

                return (
                  <React.Fragment key={rowId}>
                    <tr
                      onClick={() => onSelectFinding(item)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition-colors group ${
                        isSelected ? "bg-indigo-950/30" : ""
                      }`}
                    >
                      <td className="p-3 text-center" onClick={(e) => toggleSelectRow(rowId, e)}>
                        <button className="text-slate-500 hover:text-indigo-400">
                          {isSelected ? (
                            <CheckSquare size={16} className="text-indigo-400" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      <td className="p-3">
                        <button
                          onClick={(e) => toggleRowExpand(rowId, e)}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </td>

                      {visibleColumns.severity && (
                        <td className="p-3">
                          <SeverityBadge severity={extra.severity} size="sm" />
                        </td>
                      )}

                      {visibleColumns.ruleId && (
                        <td className="p-3 max-w-xs">
                          <div className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors truncate">
                            {ruleShortName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate" title={item.check_id}>
                            {item.check_id}
                          </div>
                        </td>
                      )}

                      {visibleColumns.filePath && (
                        <td className="p-3 font-mono text-slate-300 max-w-xs">
                          <div className="flex items-center gap-1 text-xs truncate">
                            <FileCode size={13} className="text-slate-500 flex-shrink-0" />
                            <span className="truncate" title={item.path}>
                              {item.path}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Line {item.start?.line || 1}:{item.start?.col || 1}
                          </div>
                        </td>
                      )}

                      {visibleColumns.category && (
                        <td className="p-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {metadata.impact && <ImpactBadge impact={metadata.impact} />}
                            {(metadata.vulnerability_class || ["Other"]).slice(0, 1).map((vc, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded border border-slate-700"
                              >
                                {vc}
                              </span>
                            ))}
                          </div>
                        </td>
                      )}

                      {visibleColumns.status && (
                        <td className="p-3">
                          <select
                            value={currentStatus}
                            onChange={(e) => handleRowStatusChange(rowId, e.target.value, e)}
                            className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] rounded px-2 py-1 focus:border-indigo-500 focus:outline-none cursor-pointer"
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="False Positive">False Positive</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </td>
                      )}

                      {visibleColumns.actions && (
                        <td className="p-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectFinding({ ...item, status: currentStatus });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded transition-all text-xs"
                          >
                            <Eye size={13} />
                            Inspect
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* Inline expanded details drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90 border-t border-b border-slate-800">
                        <td colSpan={8} className="p-4 pl-14">
                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs space-y-3">
                            <div>
                              <strong className="text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                                Finding Summary:
                              </strong>
                              <p className="text-slate-200 mt-1 leading-relaxed">{extra.message}</p>
                            </div>

                            {extra.lines && extra.lines !== "requires login" && (
                              <div>
                                <strong className="text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                                  Code Context (Line {item.start?.line}):
                                </strong>
                                <pre className="mt-1 p-3 bg-slate-950 border border-slate-800 rounded font-mono text-emerald-300 overflow-x-auto">
                                  {extra.lines}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
        <div>
          Showing{" "}
          <strong className="text-slate-200">
            {filteredFindings.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </strong>{" "}
          to{" "}
          <strong className="text-slate-200">
            {Math.min(currentPage * pageSize, filteredFindings.length)}
          </strong>{" "}
          of <strong className="text-slate-200">{filteredFindings.length}</strong> total findings
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-slate-950 border border-slate-800 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              Prev
            </button>
            <span className="px-2 font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-slate-950 border border-slate-800 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
