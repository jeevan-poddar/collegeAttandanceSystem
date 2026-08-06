"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  fetchAllocatedFaculty,
  updateFacultyAllocation,
  deleteFacultyAllocation,
} from "@/app/action/manageFacultyAllocation";
import {
  fetchBatches,
  fetchFaculty,
  fetchSubject,
} from "@/app/action/fetchForFacultyAllocation";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Plus,
  Users,
  BookOpen,
  Layers,
  Calendar,
} from "lucide-react";

const ManageFacultyAllocationPage = () => {
  const [allocations, setAllocations] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionYearFilter, setSessionYearFilter] = useState("2025-2026");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState({ type: "", message: "" });

  useEffect(() => {
    const handleOffline = () => {
      setNotification({
        type: "error",
        message:
          "No internet connection detected. Please check your network connection.",
      });
    };
    const handleOnline = () => {
      setNotification((prev) =>
        prev.message.includes("internet connection")
          ? { type: "", message: "" }
          : prev,
      );
    };

    if (typeof window !== "undefined") {
      if (!window.navigator.onLine) handleOffline();
      window.addEventListener("offline", handleOffline);
      window.addEventListener("online", handleOnline);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("online", handleOnline);
      }
    };
  }, []);

  const handleRefresh = async () => {
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setNotification({
        type: "error",
        message: "Cannot refresh allocations: No internet connection detected.",
      });
      return;
    }
    setLoading(true);
    setNotification({ type: "", message: "" });

    try {
      const [allocRes, facRes, batchRes, subRes] = await Promise.all([
        fetchAllocatedFaculty(),
        fetchFaculty(),
        fetchBatches("ALL"),
        fetchSubject(),
      ]);

      if (facRes?.data) setAllFaculty(facRes.data);
      if (batchRes?.data) setAllBatches(batchRes.data);
      if (subRes?.data) setAllSubjects(subRes.data);

      if (allocRes && allocRes.success) {
        setAllocations(Array.isArray(allocRes.data) ? allocRes.data : []);
      } else {
        setNotification({
          type: "error",
          message:
            allocRes?.error || "Failed to retrieve faculty allocations from database.",
        });
      }
    } catch (error) {
      console.error("Error fetching allocation management data:", error);
      setNotification({
        type: "error",
        message:
          "An unexpected error occurred while loading records. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchInitialData() {
      if (typeof window !== "undefined" && !window.navigator.onLine) {
        if (isMounted) {
          setNotification({
            type: "error",
            message: "Cannot load allocations: No internet connection detected.",
          });
          setLoading(false);
        }
        return;
      }
      try {
        const [allocRes, facRes, batchRes, subRes] = await Promise.all([
          fetchAllocatedFaculty(),
          fetchFaculty(),
          fetchBatches("ALL"),
          fetchSubject(),
        ]);
        if (!isMounted) return;
        if (facRes?.data) setAllFaculty(facRes.data);
        if (batchRes?.data) setAllBatches(batchRes.data);
        if (subRes?.data) setAllSubjects(subRes.data);

        if (allocRes && allocRes.success) {
          setAllocations(Array.isArray(allocRes.data) ? allocRes.data : []);
        } else {
          setNotification({
            type: "error",
            message:
              allocRes?.error || "Failed to retrieve faculty allocations from database.",
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching allocation management data:", error);
        setNotification({
          type: "error",
          message:
            "An unexpected error occurred while loading records. Please try again.",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getFacultyName = (id) => {
    const found = allFaculty.find((f) => f.id === id || f.id === Number(id));
    return found ? found.name : `Faculty #${id}`;
  };

  const getBatchLabel = (id) => {
    const found = allBatches.find((b) => b.id === id || b.id === Number(id));
    return found
      ? `${found.batch_code} [${found.session_year || "N/A"}]${found.branch ? ` (${found.branch})` : ""}`
      : `Batch #${id}`;
  };

  const getSubjectLabel = (id) => {
    const found = allSubjects.find((s) => s.id === id || s.id === Number(id));
    return found
      ? `${found.subject_code ? `${found.subject_code} - ` : ""}${found.subject_name}`
      : `Subject #${id}`;
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setEditForm({
      faculty_id: row.faculty_id || "",
      batch_id: row.batch_id || "",
      subject_id: row.subject_id || "",
      batch_group: row.batch_group || "",
    });
    setNotification({ type: "", message: "" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (id) => {
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setNotification({
        type: "error",
        message: "Cannot save changes: No internet connection.",
      });
      return;
    }

    if (!editForm.faculty_id || !editForm.batch_id || !editForm.subject_id) {
      setNotification({
        type: "error",
        message: "Please select valid options for Faculty, Batch, and Subject.",
      });
      return;
    }

    // Check for duplicate in existing allocations (excluding current record)
    const isDuplicate = allocations.some(
      (a) =>
        a.id !== id &&
        String(a.faculty_id) === String(editForm.faculty_id) &&
        String(a.batch_id) === String(editForm.batch_id) &&
        String(a.subject_id) === String(editForm.subject_id),
    );

    if (isDuplicate) {
      setNotification({
        type: "error",
        message:
          "Duplicate record: This teacher is already assigned to this exact batch and subject combination.",
      });
      return;
    }

    setActionLoading(id);
    setNotification({ type: "", message: "" });

    try {
      const res = await updateFacultyAllocation(id, editForm);
      if (res.success && res.data) {
        setAllocations((prev) =>
          prev.map((item) => (item.id === id ? res.data : item)),
        );
        setEditingId(null);
        setEditForm({});
        setNotification({
          type: "success",
          message: "Faculty allocation updated successfully!",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to update allocation record.",
        });
      }
    } catch (error) {
      console.error("Save edit error:", error);
      setNotification({
        type: "error",
        message: "An unexpected network error occurred while updating.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setNotification({
        type: "error",
        message: "Cannot delete record: No internet connection detected.",
      });
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this faculty teaching allocation? This action cannot be undone.",
      )
    ) {
      return;
    }

    setActionLoading(id);
    setNotification({ type: "", message: "" });

    try {
      const res = await deleteFacultyAllocation(id);
      if (res.success) {
        setAllocations((prev) => prev.filter((item) => item.id !== id));
        if (editingId === id) setEditingId(null);
        setNotification({
          type: "success",
          message: "Faculty allocation record deleted completely.",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to delete allocation record.",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setNotification({
        type: "error",
        message: "An unexpected error occurred during deletion.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAllocations = allocations.filter((item) => {
    if (sessionYearFilter.trim() && sessionYearFilter.trim().toUpperCase() !== "ALL") {
      const batch = allBatches.find((b) => b.id === item.batch_id || b.id === Number(item.batch_id));
      if (!batch || !(batch.session_year || "").toLowerCase().includes(sessionYearFilter.trim().toLowerCase())) {
        return false;
      }
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const facName = getFacultyName(item.faculty_id).toLowerCase();
    const batchName = getBatchLabel(item.batch_id).toLowerCase();
    const subName = getSubjectLabel(item.subject_id).toLowerCase();
    return facName.includes(q) || batchName.includes(q) || subName.includes(q);
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Manage Faculty Allocations
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            View, modify, or delete teaching assignments across academic subjects and batches
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/dashboard/hod/facultyAllocation"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Allocation</span>
          </Link>
        </div>
      </div>

      {/* Notification Banner */}
      {notification.message && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between transition-all shadow-xs ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification({ type: "", message: "" })}
            className="font-bold text-lg leading-none p-1.5 opacity-70 hover:opacity-100 transition rounded-lg hover:bg-black/5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Filter and Search Toolbar */}
        <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-56">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Session year (2025-2026)..."
                value={sessionYearFilter}
                onChange={(e) => setSessionYearFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs font-medium"
              />
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by faculty, batch, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs"
              />
            </div>
          </div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200/80 shrink-0">
            Total Records: {filteredAllocations.length}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-5 w-1/4">Faculty Member</th>
                <th className="py-3.5 px-5 w-1/4">Assigned Batch</th>
                <th className="py-3.5 px-5 w-1/4">Assigned Subject</th>
                <th className="py-3.5 px-4 w-28 text-center">Group</th>
                <th className="py-3.5 px-6 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-sm text-gray-500 font-medium">
                        Loading teacher allocations and metadata...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredAllocations.length > 0 ? (
                filteredAllocations.map((row) => {
                  const isEditing = editingId === row.id;
                  const isProcessing = actionLoading === row.id;

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        isEditing
                          ? "bg-blue-50/30"
                          : "hover:bg-gray-50/60"
                      }`}
                    >
                      {/* Faculty column */}
                      <td className="py-4 px-6 align-middle">
                        {isEditing ? (
                          <select
                            value={editForm.faculty_id}
                            onChange={(e) =>
                              setEditForm({ ...editForm, faculty_id: e.target.value })
                            }
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                          >
                            <option value="">-- Select Faculty --</option>
                            {allFaculty.map((fac) => (
                              <option key={fac.id} value={fac.id}>
                                {fac.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              <Users className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              {getFacultyName(row.faculty_id)}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Batch column */}
                      <td className="py-4 px-6 align-middle">
                        {isEditing ? (
                          <select
                            value={editForm.batch_id}
                            onChange={(e) =>
                              setEditForm({ ...editForm, batch_id: e.target.value })
                            }
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                          >
                            <option value="">-- Select Batch --</option>
                            {allBatches
                              .filter((batch) => !sessionYearFilter.trim() || sessionYearFilter.trim().toUpperCase() === "ALL" || (batch.session_year || "").toLowerCase().includes(sessionYearFilter.trim().toLowerCase()) || batch.id === row.batch_id)
                              .map((batch) => (
                                <option key={batch.id} value={batch.id}>
                                  {batch.batch_code} [{batch.session_year || "N/A"}] {batch.branch ? `(${batch.branch})` : ""}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <Layers className="w-3.5 h-3.5" />
                            <span>{getBatchLabel(row.batch_id)}</span>
                          </div>
                        )}
                      </td>

                      {/* Subject column */}
                      <td className="py-4 px-6 align-middle">
                        {isEditing ? (
                          <select
                            value={editForm.subject_id}
                            onChange={(e) =>
                              setEditForm({ ...editForm, subject_id: e.target.value })
                            }
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                          >
                            <option value="">-- Select Subject --</option>
                            {allSubjects.map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.subject_code ? `${sub.subject_code} - ` : ""}
                                {sub.subject_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                            <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{getSubjectLabel(row.subject_id)}</span>
                          </div>
                        )}
                      </td>

                      {/* Group column */}
                      <td className="py-4 px-4 align-middle text-center">
                        {isEditing ? (
                          <select
                            value={editForm.batch_group || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, batch_group: e.target.value })
                            }
                            className="p-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                          >
                            <option value="">All</option>
                            <option value="G1">G1</option>
                            <option value="G2">G2</option>
                            <option value="G3">G3</option>
                            <option value="G4">G4</option>
                          </select>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {row.batch_group || "All"}
                          </span>
                        )}
                      </td>

                      {/* Actions column */}
                      <td className="py-4 px-6 text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                          {isProcessing ? (
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin my-1" />
                          ) : isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(row.id)}
                                title="Save changes"
                                className="w-8 h-8 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center transition shadow-xs"
                              >
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                title="Cancel editing"
                                className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center justify-center transition"
                              >
                                <X className="w-4 h-4 stroke-[2.5]" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditClick(row)}
                                title="Edit allocation"
                                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 flex items-center justify-center transition"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(row.id)}
                                title="Delete allocation"
                                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 flex items-center justify-center transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="text-base font-bold text-gray-800">
                        No allocations found
                      </p>
                      <p className="text-xs text-gray-500">
                        {searchQuery
                          ? "No matching records found for your current filter query."
                          : "There are currently no faculty teaching allocations configured."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageFacultyAllocationPage;
