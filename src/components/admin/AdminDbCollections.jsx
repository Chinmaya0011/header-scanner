"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Database,
  Search,
  Trash2,
  RefreshCw,
  FileCode,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  FolderOpen,
  Filter,
  CheckCircle,
  XCircle,
  Copy,
  Check
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/common/Toast";
import OtpVerificationModal from "@/components/common/OtpVerificationModal";

export default function AdminDbCollections() {
  const toast = useToast();
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState(null);

  // Documents state for selected collection
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    pageLimit: 15,
  });

  // Selected JSON document preview state
  const [inspectDoc, setInspectDoc] = useState(null);
  const [copiedDoc, setCopiedDoc] = useState(false);

  // OTP Verification Modal state
  const [otpModalState, setOtpModalState] = useState({
    isOpen: false,
    title: "",
    description: "",
    actionName: "",
    warningDetails: "",
    onConfirm: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch collections overview
  const fetchCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const res = await fetch("/api/admin/collections");
      const data = await res.json();
      if (data.success) {
        setCollections(data.collections || []);
        if (!selectedCollection && data.collections.length > 0) {
          setSelectedCollection(data.collections[0].name);
        }
      } else {
        toast.error("Failed to fetch database collections: " + data.error);
      }
    } catch (err) {
      toast.error("Network error fetching database collections.");
    } finally {
      setCollectionsLoading(false);
    }
  }, [selectedCollection, toast]);

  // Fetch documents for the active collection
  const fetchDocuments = useCallback(async () => {
    if (!selectedCollection) return;
    setDocsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.currentPage);
      params.set("limit", pagination.pageLimit);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/collections/${selectedCollection}?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setDocuments(data.documents || []);
        setPagination((prev) => ({
          ...prev,
          totalDocs: data.pagination.totalDocs,
          totalPages: data.pagination.totalPages,
        }));
      } else {
        toast.error(`Failed to load docs for '${selectedCollection}': ${data.error}`);
      }
    } catch (err) {
      toast.error("Error loading collection documents.");
    } finally {
      setDocsLoading(false);
    }
  }, [selectedCollection, pagination.currentPage, pagination.pageLimit, searchQuery, toast]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle single document deletion trigger (opens OTP modal)
  const triggerDeleteDocument = (doc) => {
    const docId = doc._id ? String(doc._id) : "Selected Document";
    setOtpModalState({
      isOpen: true,
      title: "Delete Document Record",
      description: `You are about to permanently delete document '${docId}' from database collection '${selectedCollection}'.`,
      warningDetails: `Target Collection: ${selectedCollection}\nDocument ID: ${docId}`,
      actionName: "Delete Document",
      onConfirm: () => executeDeleteDocument(docId),
    });
  };

  const executeDeleteDocument = async (docId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/collections/${selectedCollection}?docId=${encodeURIComponent(docId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Document '${docId}' deleted successfully.`);
        if (inspectDoc && String(inspectDoc._id) === String(docId)) {
          setInspectDoc(null);
        }
        await Promise.all([fetchDocuments(), fetchCollections()]);
        setOtpModalState((prev) => ({ ...prev, isOpen: false }));
      } else {
        toast.error(`Delete failed: ${data.error}`);
      }
    } catch (err) {
      toast.error("Network error executing document deletion.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle entire collection wipe trigger (opens OTP modal)
  const triggerWipeCollection = () => {
    if (!selectedCollection) return;
    setOtpModalState({
      isOpen: true,
      title: `Purge Database Collection '${selectedCollection}'`,
      description: `WARNING: You are about to permanently purge ALL documents in collection '${selectedCollection}'.`,
      warningDetails: `Target Collection: ${selectedCollection}\nTotal Documents: ${pagination.totalDocs}\nNotice: This destructive action cannot be reverted.`,
      actionName: `Purge All Docs in '${selectedCollection}'`,
      onConfirm: () => executeWipeCollection(),
    });
  };

  const executeWipeCollection = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/collections/${selectedCollection}?purge=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Collection '${selectedCollection}' purged successfully.`);
        setInspectDoc(null);
        await Promise.all([fetchDocuments(), fetchCollections()]);
        setOtpModalState((prev) => ({ ...prev, isOpen: false }));
      } else {
        toast.error(`Purge failed: ${data.error}`);
      }
    } catch (err) {
      toast.error("Network error purging collection.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyDocJson = () => {
    if (!inspectDoc) return;
    navigator.clipboard.writeText(JSON.stringify(inspectDoc, null, 2));
    setCopiedDoc(true);
    toast.success("Document JSON copied to clipboard!");
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans text-text">
      {/* OTP Modal */}
      <OtpVerificationModal
        isOpen={otpModalState.isOpen}
        onClose={() => setOtpModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={otpModalState.onConfirm}
        title={otpModalState.title}
        description={otpModalState.description}
        warningDetails={otpModalState.warningDetails}
        actionName={otpModalState.actionName}
        loading={actionLoading}
      />

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-accent" />
            <h2 className="text-sm font-bold tracking-wider text-text uppercase">
              Database Collections & Document Monitor
            </h2>
            <Badge variant="accent" className="text-[9px]">
              {collections.length} COLLECTIONS
            </Badge>
          </div>
          <p className="text-xs text-text-dim mt-0.5">
            Monitor raw database collections, inspect stored documents, and perform authorized document purges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              fetchCollections();
              fetchDocuments();
              toast.success("Database collections refreshed.");
            }}
            variant="outline"
            size="sm"
            icon={RefreshCw}
          >
            Refresh Database
          </Button>
          {selectedCollection && (
            <Button
              onClick={triggerWipeCollection}
              variant="danger"
              size="sm"
              icon={Trash2}
              disabled={pagination.totalDocs === 0}
            >
              Wipe '{selectedCollection}'
            </Button>
          )}
        </div>
      </div>

      {/* Collections Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {collectionsLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/[0.02] border border-white/[0.04] rounded-xl animate-pulse" />
            ))
          : collections.map((col) => {
              const isSelected = selectedCollection === col.name;
              return (
                <button
                  key={col.name}
                  onClick={() => {
                    setSelectedCollection(col.name);
                    setPagination((prev) => ({ ...prev, currentPage: 1 }));
                    setSearchQuery("");
                    setInspectDoc(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-accent/15 border-accent text-accent shadow-lg shadow-accent/10"
                      : "bg-surface/60 border-white/[0.04] text-text-muted hover:border-white/20 hover:text-text"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <FolderOpen className={`h-3.5 w-3.5 ${isSelected ? "text-accent" : "text-text-muted"}`} />
                    <span className="font-mono text-[10px] font-bold text-accent">
                      {col.count}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold truncate mt-2 uppercase tracking-wide">
                    {col.name}
                  </span>
                </button>
              );
            })}
      </div>

      {/* Main Document Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Document List Table (Left 7 or 12 Cols) */}
        <div className={inspectDoc ? "lg:col-span-7" : "lg:col-span-12"}>
          <Card className="p-5 border border-white/[0.05] flex flex-col h-[600px]">
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.05] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-wider text-text">
                  Collection: <span className="font-mono text-accent">{selectedCollection || "N/A"}</span>
                </span>
                <span className="text-[10px] text-text-muted font-mono">
                  ({pagination.totalDocs} total docs)
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                  placeholder={`Search ${selectedCollection || 'docs'}...`}
                  className="w-full pl-9 pr-3 py-1.5 bg-bg border border-white/[0.05] focus:border-accent rounded-lg text-xs font-mono text-text outline-none transition-all"
                />
              </div>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto mt-3 -mx-1 px-1">
              {docsLoading ? (
                <div className="flex items-center justify-center h-full text-xs text-text-dim italic">
                  Loading documents for collection '{selectedCollection}'...
                </div>
              ) : documents.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-text-dim font-semibold">
                  No documents found in collection '{selectedCollection}'.
                </div>
              ) : (
                <table className="w-full text-left border-collapse font-sans">
                  <thead className="sticky top-0 bg-surface z-10">
                    <tr className="border-b border-white/[0.05] text-text-muted text-[9px] font-bold uppercase tracking-wider">
                      <th className="py-2.5">Document ID</th>
                      <th className="py-2.5">Key Preview</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-xs font-mono">
                    {documents.map((doc) => {
                      const docIdStr = doc._id ? String(doc._id) : "N/A";
                      const isSelectedDoc = inspectDoc && String(inspectDoc._id) === docIdStr;
                      
                      // Build a clean primary label preview
                      const keyLabel = doc.email || doc.domain || doc.eventType || doc.name || doc.url || doc.status || "Doc Record";

                      return (
                        <tr
                          key={docIdStr}
                          className={`hover:bg-white/[0.02] transition-colors ${
                            isSelectedDoc ? "bg-accent/10 border-l-2 border-accent" : ""
                          }`}
                        >
                          <td className="py-3 font-mono text-[11px] text-accent truncate max-w-[140px]" title={docIdStr}>
                            {docIdStr}
                          </td>
                          <td className="py-3 text-text truncate max-w-[180px]">
                            <span className="text-text-dim text-[10px] uppercase font-bold mr-1.5">Info:</span>
                            <span>{String(keyLabel)}</span>
                          </td>
                          <td className="py-3 text-right space-x-1.5 flex-shrink-0">
                            <Button
                              onClick={() => setInspectDoc(doc)}
                              variant="outline"
                              size="sm"
                              icon={Eye}
                              className="text-[9px] py-1 px-2"
                            >
                              JSON
                            </Button>
                            <Button
                              onClick={() => triggerDeleteDocument(doc)}
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              className="text-[9px] py-1 px-2"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05] flex-shrink-0">
                <Button
                  disabled={pagination.currentPage === 1}
                  onClick={() => setPagination((prev) => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                </Button>
                <span className="text-xs text-text-dim font-semibold font-mono">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => setPagination((prev) => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
                  variant="outline"
                  size="sm"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Selected Document Detailed JSON Previewer (Right 5 Cols) */}
        {inspectDoc && (
          <div className="lg:col-span-5 animate-fadeIn">
            <Card className="p-5 border border-white/[0.08] bg-surface flex flex-col h-[600px]">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.05] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-accent" />
                  <span className="text-xs font-bold uppercase tracking-wider text-text">
                    Document JSON Inspector
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyDocJson}
                    className="p-1.5 rounded text-accent hover:bg-accent/10 transition-colors text-xs font-mono flex items-center gap-1"
                    title="Copy JSON"
                  >
                    {copiedDoc ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="text-[9px] uppercase font-bold">Copy</span>
                  </button>
                  <button
                    onClick={() => triggerDeleteDocument(inspectDoc)}
                    className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors text-xs"
                    title="Delete document"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setInspectDoc(null)}
                    className="text-text-muted hover:text-text p-1.5 rounded"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* JSON Editor View */}
              <div className="flex-1 overflow-y-auto mt-3 p-3 bg-black/60 border border-white/[0.04] rounded-xl font-mono text-[11px] text-emerald-400 select-all leading-relaxed break-all">
                <pre>{JSON.stringify(inspectDoc, null, 2)}</pre>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
