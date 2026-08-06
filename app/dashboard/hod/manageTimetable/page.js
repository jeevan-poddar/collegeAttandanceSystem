"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  fetchAllTimetables,
  updateTimetable,
  deleteTimetable,
} from "@/app/action/manageTimetable";
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
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Layers,
} from "lucide-react";

const DAYS_OF_WEEK = [
  { id: 1, name: "Monday", short: "Mon" },
  { id: 2, name: "Tuesday", short: "Tue" },
  { id: 3, name: "Wednesday", short: "Wed" },
  { id: 4, name: "Thursday", short: "Thu" },
  { id: 5, name: "Friday", short: "Fri" },
  { id: 6, name: "Saturday", short: "Sat" },
  { id: 7, name: "Sunday", short: "Sun" },
];

const ManageTimetablePage = () => {
  const [timetables, setTimetables] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionYearFilter, setSessionYearFilter] = useState("2025-2026");
  const [dayFilter, setDayFilter] = useState("ALL");
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
        message: "Cannot refresh timetable records: No internet connection detected.",
      });
      return;
    }
    setLoading(true);
    setNotification({ type: "", message: "" });

    try {
      const [tableRes, facRes, batchRes, subRes] = await Promise.all([
        fetchAllTimetables(),
        fetchFaculty(),
        fetchBatches("ALL"),
        fetchSubject(),
      ]);

      if (facRes?.data) setAllFaculty(facRes.data);
      if (batchRes?.data) setAllBatches(batchRes.data);
      if (subRes?.data) setAllSubjects(subRes.data);

      if (tableRes && tableRes.success) {
        setTimetables(Array.isArray(tableRes.data) ? tableRes.data : []);
      } else {
        setNotification({
          type: "error",
          message:
            tableRes?.error || "Failed to load semester timetable from database.",
        });
      }
    } catch (error) {
      console.error("Error fetching timetable management data:", error);
      setNotification({
        type: "error",
        message:
          "An unexpected error occurred while loading timetable records. Please refresh.",
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
            message: "Cannot load timetable records: No internet connection detected.",
          });
          setLoading(false);
        }
        return;
      }
      try {
        const [tableRes, facRes, batchRes, subRes] = await Promise.all([
          fetchAllTimetables(),
          fetchFaculty(),
          fetchBatches("ALL"),
          fetchSubject(),
        ]);
        if (!isMounted) return;
        if (facRes?.data) setAllFaculty(facRes.data);
        if (batchRes?.data) setAllBatches(batchRes.data);
        if (subRes?.data) setAllSubjects(subRes.data);

        if (tableRes && tableRes.success) {
          setTimetables(Array.isArray(tableRes.data) ? tableRes.data : []);
        } else {
          setNotification({
            type: "error",
            message:
              tableRes?.error || "Failed to load semester timetable from database.",
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching timetable management data:", error);
        setNotification({
          type: "error",
          message:
            "An unexpected error occurred while loading timetable records. Please refresh.",
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

  const getDayName = (dayNum) => {
    const found = DAYS_OF_WEEK.find((d) => d.id === Number(dayNum));
    return found ? found.name : `Day ${dayNum}`;
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setEditForm({
      batch_id: row.batch_id || "",
      subject_id: row.subject_id || "",
      faculty_id: row.faculty_id || "",
      day_of_week: row.day_of_week || 1,
      period_number: row.period_number || "",
      room_no: row.room_no || "",
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
        message: "Cannot save timetable updates: No internet connection.",
      });
      return;
    }

    if (
      !editForm.batch_id ||
      !editForm.subject_id ||
      !editForm.faculty_id ||
      !editForm.period_number ||
      !editForm.room_no
    ) {
      setNotification({
        type: "error",
        message: "Please fill in all fields (Batch, Subject, Faculty, Day, Period, and Room).",
      });
      return;
    }

    const targetDay = Number(editForm.day_of_week);
    const targetPeriod = Number(editForm.period_number);
    const targetRoom = editForm.room_no.trim().toLowerCase();

    // Check for schedule clashes against existing timetable (excluding current ID)
    for (const item of timetables) {
      if (item.id === id) continue;
      const itemDay = Number(item.day_of_week);
      const itemPeriod = Number(item.period_number);

      if (itemDay === targetDay && itemPeriod === targetPeriod) {
        if (String(item.batch_id) === String(editForm.batch_id)) {
          const itemGroup = item.batch_group || "ALL";
          const editGroup = editForm.batch_group || "ALL";
          const hasAll = itemGroup === "ALL" || editGroup === "ALL";
          const isSameGroup = itemGroup === editGroup;

          if (hasAll || isSameGroup) {
            setNotification({
              type: "error",
              message: `Batch schedule clash: ${getBatchLabel(item.batch_id)} (${itemGroup === "ALL" ? "All Groups" : itemGroup}) already has a scheduled lecture on ${getDayName(targetDay)} during Period ${targetPeriod}.`,
            });
            return;
          }
        }
        if (String(item.faculty_id) === String(editForm.faculty_id)) {
          setNotification({
            type: "error",
            message: `Faculty clash: ${getFacultyName(item.faculty_id)} is already assigned to another class on ${getDayName(targetDay)} during Period ${targetPeriod}.`,
          });
          return;
        }
        if (item.room_no && item.room_no.trim().toLowerCase() === targetRoom) {
          setNotification({
            type: "error",
            message: `Room clash: Room '${item.room_no}' is already occupied on ${getDayName(targetDay)} during Period ${targetPeriod}.`,
          });
          return;
        }
      }
    }

    setActionLoading(id);
    setNotification({ type: "", message: "" });

    try {
      const res = await updateTimetable(id, editForm);
      if (res.success && res.data) {
        setTimetables((prev) =>
          prev.map((item) => (item.id === id ? res.data : item)),
        );
        setEditingId(null);
        setEditForm({});
        setNotification({
          type: "success",
          message: "Timetable schedule updated successfully!",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to update timetable record.",
        });
      }
    } catch (error) {
      console.error("Save edit timetable error:", error);
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
        "Are you sure you want to delete this scheduled lecture session? This action cannot be undone.",
      )
    ) {
      return;
    }

    setActionLoading(id);
    setNotification({ type: "", message: "" });

    try {
      const res = await deleteTimetable(id);
      if (res.success) {
        setTimetables((prev) => prev.filter((item) => item.id !== id));
        if (editingId === id) setEditingId(null);
        setNotification({
          type: "success",
          message: "Scheduled timetable session deleted successfully.",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to delete timetable record.",
        });
      }
    } catch (error) {
      console.error("Delete timetable error:", error);
      setNotification({
        type: "error",
        message: "An unexpected error occurred during timetable deletion.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTimetables = timetables.filter((item) => {
    if (sessionYearFilter.trim() && sessionYearFilter.trim().toUpperCase() !== "ALL") {
      const batch = allBatches.find((b) => b.id === item.batch_id || b.id === Number(item.batch_id));
      if (!batch || !(batch.session_year || "").toLowerCase().includes(sessionYearFilter.trim().toLowerCase())) {
        return false;
      }
    }
    if (dayFilter !== "ALL" && Number(item.day_of_week) !== Number(dayFilter)) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const facName = getFacultyName(item.faculty_id).toLowerCase();
    const batchName = getBatchLabel(item.batch_id).toLowerCase();
    const subName = getSubjectLabel(item.subject_id).toLowerCase();
    const room = (item.room_no || "").toLowerCase();
    return (
      facName.includes(q) ||
      batchName.includes(q) ||
      subName.includes(q) ||
      room.includes(q)
    );
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Manage Timetable Schedules
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Review, modify lecture timings, classrooms, or remove scheduled semester sessions
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
            href="/dashboard/hod/timetable"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Schedule</span>
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
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
            <div className="relative w-full sm:w-52">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Session year (2025-2026)..."
                value={sessionYearFilter}
                onChange={(e) => setSessionYearFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs font-medium"
              />
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search faculty, batch, room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs"
              />
            </div>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition font-medium shadow-xs"
            >
              <option value="ALL">All Weekdays</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200/80 shrink-0">
            Sessions: {filteredTimetables.length}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-6 w-56">Day & Period</th>
                <th className="py-3.5 px-5 w-48">Assigned Batch</th>
                <th className="py-3.5 px-5 w-64">Subject & Room</th>
                <th className="py-3.5 px-5 w-48">Faculty Member</th>
                <th className="py-3.5 px-3 w-24 text-center">Group</th>
                <th className="py-3.5 px-6 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-sm text-gray-500 font-medium">
                        Loading semester timetables and class assignments...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredTimetables.length > 0 ? (
                filteredTimetables.map((row) => {
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
                      {/* Day & Period column */}
                      <td className="py-4 px-6 align-middle">
                        {isEditing ? (
                          <div className="space-y-2">
                            <select
                              value={editForm.day_of_week}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  day_of_week: e.target.value,
                                })
                              }
                              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                            >
                              {DAYS_OF_WEEK.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-semibold">Period:</span>
                              <input
                                type="number"
                                min="1"
                                placeholder="Period No."
                                value={editForm.period_number}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    period_number: e.target.value,
                                  })
                                }
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                              <span>{getDayName(row.day_of_week)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded w-fit">
                              <Clock className="w-3.5 h-3.5 text-gray-500" />
                              <span>Period {row.period_number}</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Batch column */}
                      <td className="py-4 px-5 align-middle">
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
                            <Layers className="w-3.5 h-3.5 shrink-0" />
                            <span>{getBatchLabel(row.batch_id)}</span>
                          </div>
                        )}
                      </td>

                      {/* Subject & Room column */}
                      <td className="py-4 px-5 align-middle">
                        {isEditing ? (
                          <div className="space-y-2">
                            <select
                              value={editForm.subject_id}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  subject_id: e.target.value,
                                })
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
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-semibold shrink-0">Room:</span>
                              <input
                                type="text"
                                placeholder="Room No. (e.g. 302-A)"
                                value={editForm.room_no}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    room_no: e.target.value,
                                  })
                                }
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-800 font-bold">
                              <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                              <span>{getSubjectLabel(row.subject_id)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded w-fit border border-emerald-200/60">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Room: {row.room_no || "N/A"}</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Faculty column */}
                      <td className="py-4 px-5 align-middle">
                        {isEditing ? (
                          <select
                            value={editForm.faculty_id}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                faculty_id: e.target.value,
                              })
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

                      {/* Group column */}
                      <td className="py-4 px-3 align-middle text-center">
                        {isEditing ? (
                          <select
                            value={editForm.batch_group || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, batch_group: e.target.value })
                            }
                            className="p-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                          >
                            <option value="">All</option>
                            <option value="G1">G1</option>
                            <option value="G2">G2</option>
                            <option value="G3">G3</option>
                            <option value="G4">G4</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
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
                                title="Edit schedule"
                                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 flex items-center justify-center transition"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(row.id)}
                                title="Delete schedule"
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
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="text-base font-bold text-gray-800">
                        No scheduled sessions found
                      </p>
                      <p className="text-xs text-gray-500">
                        {searchQuery || dayFilter !== "ALL"
                          ? "No matching timetable records match your search query or filter."
                          : "There are currently no semester timetable lectures registered."}
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

export default ManageTimetablePage;
