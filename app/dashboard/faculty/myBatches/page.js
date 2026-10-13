"use client";
import { fetchOverallAttendance } from "@/app/action/attendance/fetchOverallAttendance";
import { getFacultyBatches } from "@/app/action/batches/getFacultyBatches";
import { fetchAttendanceSessions } from "@/app/action/attendance/fetchAttendanceSessions";
import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import AttendanceRegisterModal from "@/app/component/AttendanceRegisterModal";
import { getBatchStudents } from "@/app/action/batches/getBatchStudents";
import { useSelector } from "react-redux";
import { callWithRole } from "@/app/utlis/callWithRole";

const MyBatchesPage = () => {
  const role = useSelector((state) => state.user.role);
  const [myBatches, setMyBatches] = useState([]);
  const [viewAttandance, setViewAttandance] = useState(false);
  const [sessionDetails, setSessionDetails] = useState([]);
  const [students, setStudents] = useState([]);
  const [attandance, setAttandance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batchLoadingId, setBatchLoadingId] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const availableYears = [
    ...new Set(
      myBatches
        .map((batch) => batch.session_year?.trim())
        .filter(Boolean),
    ),
  ].sort((left, right) => right.localeCompare(left, undefined, { numeric: true }));
  const filteredBatches =
    selectedYear === "all"
      ? myBatches
      : myBatches.filter(
          (batch) => batch.session_year?.trim() === selectedYear,
        );
  const getBatchStatusLabel = (status) =>
    status === "completed" ? "Completed" : status === "inactive" ? "Inactive" : "Active";

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

  // Date and filtering functions are handled within AttendanceRegisterModal

  async function fetchSessions(batchId, subjectId, batchGroup = null) {
    try {
      const data = await callWithRole(
        role,
        ["faculty", "hod"],
        fetchAttendanceSessions,
        batchId,
        subjectId,
        batchGroup,
      );
      if (data.success) {
        setSessionDetails(data.data);
      } else {
        console.error("Error fetching sessions:", data.error);
      }
      return data;
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return { success: false, error };
    }
  }

  useEffect(() => {
    async function fetchBatchesFrontend() {
      if (typeof window !== "undefined" && !window.navigator.onLine) {
        setNotification({
          type: "error",
          message: "Failed to load batches: No internet connection detected.",
        });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await callWithRole(
          role,
          ["faculty", "hod"],
          getFacultyBatches,
        );
        if (data.success) {
          setMyBatches(data.data);
        } else {
          console.error("Error fetching batches:", data.error);
          setNotification({
            type: "error",
            message:
              data.error || "Failed to load academic batches from database.",
          });
        }
      } catch (error) {
        console.error("Error fetching batches:", error);
        setNotification({
          type: "error",
          message:
            "An unexpected error occurred while loading batches. Please refresh.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchBatchesFrontend();
  }, [role]);
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          My Batches
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Select a batch below to view comprehensive attendance records
        </p>
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
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center shadow-sm">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-500 font-medium">
              Loading assigned academic batches...
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor="batch-year-filter"
              className="text-sm font-semibold text-gray-700"
            >
              Filter by session year
            </label>
            <select
              id="batch-year-filter"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="w-full sm:w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {filteredBatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => {
            const isBusy = batchLoadingId === batch.id;
            return (
              <div
                key={batch.id}
                onClick={async () => {
                  if (isBusy) return;
                  if (
                    typeof window !== "undefined" &&
                    !window.navigator.onLine
                  ) {
                    setNotification({
                      type: "error",
                      message:
                        "Cannot load attendance details: No internet connection.",
                    });
                    return;
                  }
                  setBatchLoadingId(batch.id);
                  setNotification({ type: "", message: "" });
                  try {
                    const sessionResponse = await fetchSessions(
                      batch.batch_id,
                      batch.subject_id,
                      batch.batch_group,
                    );
                    const studentResponse = await callWithRole(
                      role,
                      ["faculty", "hod"],
                      getBatchStudents,
                      batch.batch_id,
                      batch.batch_group,
                    );
                    const sortedStudents = studentResponse?.success
                      ? [...studentResponse.data].sort((left, right) => {
                          const leftValue = Number(left.c_roll_number);
                          const rightValue = Number(right.c_roll_number);

                          if (
                            !Number.isNaN(leftValue) &&
                            !Number.isNaN(rightValue)
                          ) {
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
                      ? sessionResponse.data.map((session) => session.id)
                      : [];
                    const studentIds = studentResponse?.success
                      ? studentResponse.data.map((student) => student.id)
                      : [];

                    const attendanceData = await callWithRole(
                      role,
                      ["faculty", "hod"],
                      fetchOverallAttendance,
                      batch.batch_id,
                      sessionIds,
                      studentIds,
                    );
                    if (attendanceData.success) {
                      setAttandance(attendanceData.data);
                      setSelectedTitle(
                        `${batch.batch_code} — ${batch.subject_name}`,
                      );
                      setViewAttandance(true);
                    } else {
                      setNotification({
                        type: "error",
                        message:
                          "Failed to load attendance records for this batch.",
                      });
                    }
                  } catch (err) {
                    console.error("Error loading overall attendance:", err);
                    setNotification({
                      type: "error",
                      message:
                        "An unexpected error occurred while fetching batch attendance.",
                    });
                  } finally {
                    setBatchLoadingId(null);
                  }
                }}
                className={`bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group ${
                  isBusy
                    ? "border-blue-400 bg-blue-50/20 cursor-wait"
                    : "border-gray-200 hover:border-blue-300 cursor-pointer"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-100 group-hover:bg-blue-100/80 transition-colors">
                      Batch Code: {batch.batch_code}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      batch.batch_status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : batch.batch_status === "completed"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {getBatchStatusLabel(batch.batch_status)}
                    </span>
                    {isBusy && (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {batch.subject_name}
                  </h2>
                  <p className="text-xs text-gray-500 mt-2">
                    {batch.branch || "Academic Branch"} • Semester{" "}
                    {batch.semester || "—"}
                  </p>
                  {isBusy && (
                    <p className="text-xs text-blue-600 font-medium mt-2 animate-pulse">
                      Loading attendance register...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
          ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 text-sm">
          {myBatches.length > 0
            ? "No batches found for the selected year."
            : "No assigned batches found."}
        </div>
          )}
        </>
      )}

      {viewAttandance && (
        <AttendanceRegisterModal
          onClose={() => setViewAttandance(false)}
          students={students}
          sessionDetails={sessionDetails}
          attendance={attandance}
          title={selectedTitle || "Attendance Register Overview"}
          subtitle="Comprehensive register of student attendance across all recorded class sessions"
        />
      )}
    </div>
  );
};

export default MyBatchesPage;
