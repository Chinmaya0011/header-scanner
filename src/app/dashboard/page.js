"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useToast } from "@/components/common/Toast";
import Loading from "@/components/common/Loading";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dashboard states
  const [scans, setScans] = useState([]);
  const [totalScans, setTotalScans] = useState(0);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [searchDomain, setSearchDomain] = useState("");
  const [verifications, setVerifications] = useState([]);
  
  // Scanner states
  const [scanUrl, setScanUrl] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [scanSuccessId, setScanSuccessId] = useState(null);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch user status
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      
      if (!authData.loggedIn) {
        router.push("/login");
        return;
      }
      
      setUser(authData.user);

      // 2. Fetch user/admin scans with filters
      const scansRes = await fetch(
        `/api/scans?page=${currentPage}&limit=10&domain=${searchDomain}`
      );
      const scansData = await scansRes.json();
      
      if (scansData.success) {
        setScans(scansData.data.scans || []);
        setTotalScans(scansData.data.pagination.totalScans || 0);
        setTotalPages(scansData.data.pagination.totalPages || 1);
        setStats(scansData.data.summary || null);
      }

      // 3. If admin, fetch users list
      if (authData.user.role === "admin") {
        const usersRes = await fetch("/api/users");
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsersList(usersData.users || []);
        }
      }
      
      // 4. Fetch domain verification records
      const verificationsRes = await fetch("/api/verify");
      const verificationsData = await verificationsRes.json();
      if (verificationsData.success) {
        setVerifications(verificationsData.verifications || []);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setLoading(false);
    }
  }, [currentPage, searchDomain, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteScan = async (scanId) => {
    try {
      const res = await fetch(`/api/scan/${scanId}`, { method: "DELETE" });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Scan deleted successfully.");
        fetchData();
      } else {
        toast.error("Delete failed: " + data.error);
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  const handleClearAllHistory = async () => {
    try {
      const res = await fetch("/api/scans", { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast.success("All scan history cleared successfully.");
        fetchData();
      } else {
        toast.error("Failed to clear history: " + data.error);
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  // Handle deletion of users (Admin only)
  const handleDeleteUser = async (userId, userEmail) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "User account and associated scans deleted successfully.");
        fetchData();
      } else {
        toast.error("Failed to delete user: " + data.error);
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  // Handle delete all users (Admin only)
  const handleDeleteAllUsers = async () => {
    try {
      const res = await fetch("/api/users", { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "All users and their scans deleted successfully.");
        fetchData();
      } else {
        toast.error("Failed to delete users: " + data.error);
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  // Handle live scanning from dashboard
  const handleLiveScan = async (e) => {
    e.preventDefault();
    if (!scanUrl.trim()) return;

    setScanLoading(true);
    setScanError(null);
    setScanSuccessId(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scanUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setScanError(data.error || "Scan failed.");
        return;
      }

      setScanSuccessId(data.scanId);
      setScanUrl("");
      fetchData();
    } catch {
      setScanError("Failed to connect to scanner API.");
    } finally {
      setScanLoading(false);
    }
  };

  // Grade style mapping
  const gradeStyle = (grade) => {
    if (grade?.startsWith("A")) return "text-success border-success/30 bg-success/10";
    if (grade === "B") return "text-accent border-accent/30 bg-accent/10";
    if (grade === "C") return "text-warning border-warning/30 bg-warning/10";
    return "text-danger border-danger/30 bg-danger/10";
  };

  // Date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col text-text font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loading message="Decrypting secure console session..." />
        </main>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  // Shared props for both dashboards
  const sharedProps = {
    user,
    scans,
    totalScans,
    stats,
    usersList,
    searchDomain,
    setSearchDomain,
    currentPage,
    setCurrentPage,
    totalPages,
    scanUrl,
    setScanUrl,
    scanLoading,
    scanError,
    scanSuccessId,
    handleLiveScan,
    fetchData,
    formatDate,
    gradeStyle,
    verifications,
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col text-text font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {isAdmin ? (
          <AdminDashboard
            {...sharedProps}
            handleDeleteScan={handleDeleteScan}
            handleClearAllHistory={handleClearAllHistory}
            handleDeleteUser={handleDeleteUser}
            handleDeleteAllUsers={handleDeleteAllUsers}
          />
        ) : (
          <UserDashboard {...sharedProps} />
        )}
      </main>
    </div>
  );
}