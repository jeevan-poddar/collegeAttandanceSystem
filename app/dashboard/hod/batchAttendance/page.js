"use client";

import React, { useEffect, useState } from "react";
import {
  fetchBatches,
  fetchSubject,
  fetchFaculty,
} from "@/app/action/fetchForFacultyAllocation";
import { fetchAllocatedFaculty } from "@/app/action/manageFacultyAllocation";
import { fetchSessionForAttandance } from "@/app/action/fetchSessionForAttandance";
import { fetchStudent } from "@/app/action/fetchStudent";
import { fetchAttandanceForOverall } from "@/app/action/fetchAttandanceForOverall";
import AttendanceRegisterModal from "@/app/component/AttendanceRegisterModal";
import {
  Search,
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Layers,
  BookOpen,
  UserCheck,
  ArrowLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";

const HODBatchAttendancePage = () => {
  const [allBatches, setAllBatches] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sessionYearFilter, setSessionYearFilter] = useState("2025-2026");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [viewAttendance, setViewAttendance] = useState(false);
  const [sessionDetails, setSessionDetails] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceTitle, setAttendanceTitle] = useState("");
  const [subjectLoadingId, setSubjectLoadingId] = useState(null);
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
        message: "Cannot load attendance records: No internet connection detected.",
      });
      return;
    }
    setLoading(true);
    setNotification({ type: "", message: "" });

    try {
      const [batchRes, allocRes, subRes, facRes] = await Promise.all([
        fetchBatches("ALL"),
        fetchAllocatedFaculty(),
        fetchSubject(),
        fetchFaculty(),
      ]);

      if (batchRes?.data) setAllBatches(batchRes.data);
      if (allocRes?.data) setAllocations(allocRes.data);
      if (subRes?.data) setAllSubjects(subRes.data);
      if (facRes?.data) setAllFaculty(facRes.data);
    } catch (error) {
      console.error("Error fetching HOD attendance data:", error);
      setNotification({
        type: "error",
        message: "An unexpected error occurred while loading records. Please refresh.",
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
            message: "Cannot load attendance records: No internet connection detected.",
          });
          setLoading(false);
        }
        return;
      }
      try {
        const [batchRes, allocRes, subRes, facRes] = await Promise.all([
          fetchBatches("ALL"),
          fetchAllocatedFaculty(),
          fetchSubject(),
          fetchFaculty(),
        ]);
        if (!isMounted) return;
        if (batchRes?.data) setAllBatches(batchRes.data);
        if (allocRes?.data) setAllocations(allocRes.data);
        if (subRes?.data) setAllSubjects(subRes.data);
        if (facRes?.data) setAllFaculty(facRes.data);
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching initial attendance data:", error);
        setNotification({
          type: "error",
          message: "An unexpected error occurred while loading records. Please refresh.",
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

  const getSubjectDetails = (id) => {
    const found = allSubjects.find((s) => s.id === id || s.id === Number(id));
    return found
      ? {
          name: found.subject_name || `Subject #${id}`,
          code: found.subject_code || "N/A",
        }
      : { name: `Subject #${id}`, code: "N/A" };
  };

  const filteredBatches = allBatches.filter((batch) => {
    if (sessionYearFilter.trim() && sessionYearFilter.trim().toUpperCase() !== "ALL") {
      if (
        !(batch.session_year || "")
          .toLowerCase()
          .includes(sessionYearFilter.trim().toLowerCase())
      ) {
        return false;
      }
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const code = (batch.batch_code || "").toLowerCase();
    const branch = (batch.branch || "").toLowerCase();
    const course = (batch.course || "").toLowerCase();
    return code.includes(q) || branch.includes(q) || course.includes(q);
  });

  const batchAllocations = selectedBatch
    ? allocations.filter(
        (item) =>
          item.batch_id === selectedBatch.id ||
          Number(item.batch_id) === selectedBatch.id,
      )
    : [];

  const handleSubjectClick = async (alloc) => {
    if (subjectLoadingId === alloc.id) return;
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setNotification({
        type: "error",
        message: "Cannot load attendance details: No internet connection detected.",
      });
      return;
    }
    setSubjectLoadingId(alloc.id);
    setNotification({ type: "", message: "" });

    try {
      const targetBatchId = Number(alloc.batch_id);
      const targetSubjectId = Number(alloc.subject_id);
      const subInfo = getSubjectDetails(targetSubjectId);

      const [sessionResponse, studentResponse] = await Promise.all([
        fetchSessionForAttandance(targetBatchId, targetSubjectId, alloc.batch_group),
        fetchStudent(targetBatchId, alloc.batch_group),
      ]);

      const sortedStudents = studentResponse?.success
        ? [...studentResponse.data].sort((left, right) => {
            const leftValue = Number(left.c_roll_number);
            const rightValue = Number(right.c_roll_number);
            if (!Number.isNaN(leftValue) && !Number.isNaN(rightValue)) {
              return leftValue - rightValue;
            }
            return String(left.c_roll_number).localeCompare(
              String(right.c_roll_number),
              undefined,
              { numeric: true, sensitivity: "base" },
            );
          })
        : [];

      setStudents(sortedStudents);

      const sessionIds = sessionResponse?.success
        ? sessionResponse.data.map((s) => s.id)
        : [];
      const studentIds = studentResponse?.success
        ? studentResponse.data.map((stu) => stu.id)
        : [];

      const attendanceData = await fetchAttandanceForOverall(
        targetBatchId,
        sessionIds,
        studentIds,
      );

      if (attendanceData.success) {
        setAttendance(attendanceData.data);
        setSessionDetails(sessionResponse?.success ? sessionResponse.data : []);
        setAttendanceTitle(
          `${selectedBatch?.batch_code} — ${subInfo.name} (${subInfo.code})`,
        );
        setViewAttendance(true);
      } else {
        setNotification({
          type: "error",
          message:
            attendanceData.error ||
            "Failed to load student attendance records for this subject.",
        });
      }
    } catch (error) {
      console.error("Error loading HOD subject attendance:", error);
      setNotification({
        type: "error",
        message:
          "An unexpected network error occurred while fetching attendance records.",
      });
    } finally {
      setSubjectLoadingId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50 space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-blue-600 shrink-0" />
            <span>Batch Attendance Monitoring</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Review comprehensive student attendance registers filtered by academic session year and batch
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || subjectLoadingId !== null}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition shadow-xs disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Records</span>
        </button>
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

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-20 text-center shadow-xs">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-sm font-semibold text-gray-600">
              Loading academic batches and faculty allocation records...
            </p>
          </div>
        </div>
      ) : !selectedBatch ? (
        /* STEP 1: BATCH SELECTION OVERVIEW */
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-56">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Session year (2025-2026)..."
                  value={sessionYearFilter}
                  onChange={(e) => setSessionYearFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition font-semibold"
                />
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by batch code, branch, course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-100 px-3.5 py-2 rounded-xl border border-gray-200/80 shrink-0">
              Total Batches: {filteredBatches.length}
            </div>
          </div>

          {/* Batches Grid */}
          {filteredBatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBatches.map((batch) => {
                const batchAllocCount = allocations.filter(
                  (a) =>
                    a.batch_id === batch.id || Number(a.batch_id) === batch.id,
                ).length;

                return (
                  <div
                    key={batch.id}
                    onClick={() => {
                      setSelectedBatch(batch);
                      setNotification({ type: "", message: "" });
                    }}
                    className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between space-y-5 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-200/60 group-hover:bg-blue-100/80 transition-colors">
                          <Layers className="w-3.5 h-3.5" />
                          {batch.branch || "General Academic Branch"}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200/80">
                          {batch.session_year || "All Sessions"}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          <span>Code: {batch.batch_code}</span>
                        </h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          Course: {batch.course || "Standard Degree Program"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-600 text-xs inline-flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{batchAllocCount} Allocated Subject(s)</span>
                      </span>
                      <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                        View Subjects <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center text-gray-500 text-sm font-medium shadow-xs">
              No academic batches match your current search and session year filter.
            </div>
          )}
        </div>
      ) : (
        /* STEP 2: SELECTED BATCH SUBJECTS VIEW */
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <button
                onClick={() => {
                  setSelectedBatch(null);
                  setNotification({ type: "", message: "" });
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 mb-3 transition-colors uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Batches</span>
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                  Allocated Subjects for {selectedBatch.batch_code}
                </h2>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {selectedBatch.session_year || "N/A"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Branch: <strong className="text-gray-800">{selectedBatch.branch || "General"}</strong> • Click on any subject below to inspect student attendance registers
              </p>
            </div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-100 px-3.5 py-2 rounded-xl border border-gray-200/80 shrink-0">
              Allocations: {batchAllocations.length}
            </div>
          </div>

          {batchAllocations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batchAllocations.map((alloc) => {
                const isBusy = subjectLoadingId === alloc.id;
                const subInfo = getSubjectDetails(alloc.subject_id);
                const facultyName = getFacultyName(alloc.faculty_id);

                return (
                  <div
                    key={alloc.id}
                    onClick={() => handleSubjectClick(alloc)}
                    className={`bg-white border rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5 group ${
                      isBusy
                        ? "border-blue-400 bg-blue-50/20 cursor-wait"
                        : "border-gray-200 hover:border-blue-300 cursor-pointer"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-200/60 group-hover:bg-indigo-100/80 transition-colors">
                          Code: {subInfo.code}
                        </span>
                        {isBusy && (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {subInfo.name}
                      </h3>
                      {isBusy && (
                        <p className="text-xs text-blue-600 font-bold mt-2 animate-pulse">
                          Loading attendance register...
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-600">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                        <span>{facultyName}</span>
                      </span>
                      <span className="font-bold text-blue-600 group-hover:underline">
                        View Register
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-xs space-y-2">
              <p className="text-gray-700 font-bold text-base">
                No teaching faculty are currently allocated to this batch.
              </p>
              <p className="text-gray-500 text-sm">
                Use the Manage Faculty Allocations section to assign subjects and teachers to {selectedBatch.batch_code}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reusable Attendance Register Modal */}
      {viewAttendance && (
        <AttendanceRegisterModal
          onClose={() => setViewAttendance(false)}
          students={students}
          sessionDetails={sessionDetails}
          attendance={attendance}
          title={attendanceTitle}
          subtitle="Comprehensive register of student attendance across recorded class sessions"
        />
      )}
    </div>
  );
};

export default HODBatchAttendancePage;
