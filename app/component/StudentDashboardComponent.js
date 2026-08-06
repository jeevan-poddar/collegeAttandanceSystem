"use client";

import React, { useEffect, useState } from "react";
import {
  fetchStudentDashboardData,
  fetchStudentDashboardById,
} from "@/app/action/fetchStudentDashboard";
import { fetchSessionForAttandance } from "@/app/action/fetchSessionForAttandance";
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
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  User,
  Phone,
  Mail,
  Award,
} from "lucide-react";

const StudentDashboardComponent = ({
  studentId = null,
  onClose = null,
  isModal = false,
}) => {
  const [student, setStudent] = useState(null);
  const [batches, setBatches] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sessionYearFilter, setSessionYearFilter] = useState("2025-2026");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [viewAttendance, setViewAttendance] = useState(false);
  const [sessionDetails, setSessionDetails] = useState([]);
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
        message: "Cannot refresh academic records: No internet connection detected.",
      });
      return;
    }
    setLoading(true);
    setNotification({ type: "", message: "" });

    try {
      const response = studentId
        ? await fetchStudentDashboardById(studentId)
        : await fetchStudentDashboardData();

      if (response.success && response.data) {
        setStudent(response.data.student);
        setBatches(response.data.batches || []);
        setAllocations(response.data.allocations || []);
      } else {
        setNotification({
          type: "error",
          message:
            response.error || "Failed to load student batches from database.",
        });
      }
    } catch (error) {
      console.error("Error loading student dashboard:", error);
      setNotification({
        type: "error",
        message:
          "An unexpected network error occurred while loading student profile. Please refresh.",
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
            message: "Cannot load academic records: No internet connection detected.",
          });
          setLoading(false);
        }
        return;
      }
      try {
        const response = studentId
          ? await fetchStudentDashboardById(studentId)
          : await fetchStudentDashboardData();

        if (!isMounted) return;
        if (response.success && response.data) {
          setStudent(response.data.student);
          setBatches(response.data.batches || []);
          setAllocations(response.data.allocations || []);
        } else {
          setNotification({
            type: "error",
            message:
              response.error || "Failed to load student batches from database.",
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading student dashboard:", error);
        setNotification({
          type: "error",
          message:
            "An unexpected network error occurred while loading student profile. Please refresh.",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  const filteredBatches = batches.filter((batch) => {
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

  const batchSubjects = selectedBatch
    ? allocations.filter(
        (item) =>
          item.batch_id === selectedBatch.id ||
          Number(item.batch_id) === selectedBatch.id,
      )
    : [];

  const handleSubjectClick = async (alloc) => {
    if (subjectLoadingId === alloc.id || !student) return;
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setNotification({
        type: "error",
        message:
          "Cannot check attendance records: No internet connection detected.",
      });
      return;
    }
    setSubjectLoadingId(alloc.id);
    setNotification({ type: "", message: "" });

    try {
      const targetBatchId = Number(alloc.batch_id);
      const targetSubjectId = Number(alloc.subject_id);

      const sessionResponse = await fetchSessionForAttandance(
        targetBatchId,
        targetSubjectId,
        alloc.batch_group || student?.batch_group,
      );

      const sessionIds = sessionResponse?.success
        ? sessionResponse.data.map((s) => s.id)
        : [];

      const attendanceResponse = await fetchAttandanceForOverall(
        targetBatchId,
        sessionIds,
        [student.id],
      );

      if (attendanceResponse.success) {
        setSessionDetails(sessionResponse?.success ? sessionResponse.data : []);
        setAttendance(attendanceResponse.data || []);
        setAttendanceTitle(
          `${selectedBatch?.batch_code} — ${alloc.subject_name} (${alloc.subject_code})`,
        );
        setViewAttendance(true);
      } else {
        setNotification({
          type: "error",
          message:
            attendanceResponse.error ||
            "Failed to fetch attendance records for this subject.",
        });
      }
    } catch (error) {
      console.error("Error fetching subject attendance:", error);
      setNotification({
        type: "error",
        message:
          "An unexpected error occurred while communicating with the server.",
      });
    } finally {
      setSubjectLoadingId(null);
    }
  };

  const dashboardContent = (
    <div className="space-y-6">
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
              Loading academic profile and enrolled semester batches...
            </p>
          </div>
        </div>
      ) : student ? (
        <>
          {/* Student Profile Identity Card */}
          <div className="bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md overflow-hidden relative">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
              <GraduationCap className="w-72 h-72" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                  <User className="w-3.5 h-3.5" />
                  <span>{isModal ? "Student Inspection Profile" : "Active Student Profile"}</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight">
                  {student.name || "Student Portal"}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-blue-100 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-300" />
                    <span>C. Roll No: <strong className="text-white font-bold">{student.c_roll_number || "N/A"}</strong></span>
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 opacity-60 hidden sm:inline-block"></span>
                  <span>U. Roll No: <strong className="text-white font-bold">{student.u_roll_number || "N/A"}</strong></span>
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-xs space-y-2 border border-white/15 shrink-0">
                <div className="flex items-center gap-2.5 text-xs text-blue-100 font-semibold">
                  <Mail className="w-4 h-4 text-blue-200 shrink-0" />
                  <span>{student.email || "No email registered"}</span>
                </div>
                {student.phone && (
                  <div className="flex items-center gap-2.5 text-xs text-blue-100 font-semibold">
                    <Phone className="w-4 h-4 text-blue-200 shrink-0" />
                    <span>+91 {student.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          {!selectedBatch ? (
            /* STEP 1: ENROLLED BATCHES OVERVIEW */
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-56">
                    <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Session year (2025-2026)..."
                      value={sessionYearFilter}
                      onChange={(e) => setSessionYearFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition font-semibold text-gray-800"
                    />
                  </div>
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by batch code, branch, course..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition text-gray-800"
                    />
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-100 px-3.5 py-2 rounded-xl border border-gray-200/80 shrink-0">
                  Enrolled Batches: {filteredBatches.length}
                </div>
              </div>

              {/* Enrolled Batches Grid */}
              {filteredBatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBatches.map((batch) => {
                    const subjectCount = allocations.filter(
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
                              <span>Code: {batch.batch_code}</span>
                            </span>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200/80">
                              {batch.session_year || "Current Session"}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {batch.branch || "Academic Branch"}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium mt-1">
                              Course: {batch.course || "Degree Program"} {batch.semester ? `• Semester ${batch.semester}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                          <span className="font-semibold text-gray-600 text-xs inline-flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{subjectCount} Subject(s)</span>
                          </span>
                          <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                            Select Batch <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center text-gray-500 text-sm font-medium shadow-xs">
                  No enrolled academic batches match your current search and session year filter.
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
                    <span>Back to Enrolled Batches</span>
                  </button>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">
                      Subjects in {selectedBatch.batch_code}
                    </h2>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      {selectedBatch.session_year || "N/A"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Branch: <strong className="text-gray-800">{selectedBatch.branch || "General"}</strong> • Click on any subject below to open session attendance records
                  </p>
                </div>
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-100 px-3.5 py-2 rounded-xl border border-gray-200/80 shrink-0">
                  Subjects: {batchSubjects.length}
                </div>
              </div>

              {batchSubjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {batchSubjects.map((alloc) => {
                    const isBusy = subjectLoadingId === alloc.id;
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
                              Code: {alloc.subject_code}
                            </span>
                            {isBusy && (
                              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                            {alloc.subject_name}
                          </h3>
                          {isBusy && (
                            <p className="text-xs text-blue-600 font-bold mt-2 animate-pulse">
                              Retrieving attendance history...
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-600">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
                            <GraduationCap className="w-4 h-4 text-emerald-600" />
                            <span>Instructor: {alloc.faculty_name}</span>
                          </span>
                          <span className="font-bold text-blue-600 group-hover:underline">
                            View Attendance
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-xs space-y-2">
                  <p className="text-gray-700 font-bold text-base">
                    No lecture subjects are currently scheduled for this batch.
                  </p>
                  <p className="text-gray-500 text-sm">
                    Please check back once teaching allocations are finalized.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-xs">
          <p className="text-base font-bold text-gray-800 mb-2">
            No Student Records Found
          </p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {studentId
              ? "We could not find an active student profile matching the requested student identifier."
              : "We could not associate your currently logged-in user account with an enrolled database student profile."}
          </p>
        </div>
      )}

      {/* Reusable Attendance Register Modal - displaying strictly this student's row */}
      {viewAttendance && student && (
        <AttendanceRegisterModal
          onClose={() => setViewAttendance(false)}
          students={[student]}
          sessionDetails={sessionDetails}
          attendance={attendance}
          title={attendanceTitle}
          subtitle={`Session-by-session attendance record for ${student.name}`}
          zIndex={isModal ? 70 : 50}
        />
      )}
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-hidden animate-in fade-in duration-200"
        style={{ zIndex: 60 }}
      >
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[94vh] border border-gray-200 overflow-hidden">
          {/* Modal Topbar */}
          <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-white text-gray-900 shrink-0 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-gray-900">
                  Student Academic Profile
                </h2>
                <p className="text-xs font-medium text-gray-500">
                  Comprehensive dashboard inspection and batch enrollment details
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading || subjectLoadingId !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200/80 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-semibold transition border border-gray-200 disabled:opacity-50 shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={onClose}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition shadow-xs hover:shadow-sm cursor-pointer"
              >
                Close Dashboard
              </button>
            </div>
          </div>
          {/* Modal Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/70">
            {dashboardContent}
          </div>
        </div>
      </div>
    );
  }

  // Normal Standalone Page rendering
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50 space-y-8 animate-in fade-in duration-300">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-blue-600 shrink-0" />
            <span>Student Academic Dashboard</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            View your enrolled semester batches, assigned lecture subjects, and real-time attendance registers
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
      {dashboardContent}
    </div>
  );
};

export default StudentDashboardComponent;
