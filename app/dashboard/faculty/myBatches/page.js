"use client";
import { fetchAttandanceForOverall } from "@/app/action/fetchAttandanceForOverall";
import { fetchBatches } from "@/app/action/fetchBatches";
import { fetchSessionForAttandance } from "@/app/action/fetchSessionForAttandance";
import { fetchStudent } from "@/app/action/fetchStudent";
import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const MyBatchesPage = () => {
  const [myBatches, setMyBatches] = useState([]);
  const [viewAttandance, setViewAttandance] = useState(false);
  const [sessionDetails, setSessionDetails] = useState([]);
  const [sessionDateFrom, setSessionDateFrom] = useState("");
  const [sessionDateTo, setSessionDateTo] = useState("");
  const [students, setStudents] = useState([]);
  const [attandance, setAttandance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batchLoadingId, setBatchLoadingId] = useState(null);
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

  function formatSessionDate(sessionDate) {
    const formattedDate = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
    }).format(new Date(sessionDate));

    return formattedDate.replace(" ", "-");
  }

  function toDateInputValue(sessionDate) {
    const date = new Date(sessionDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getTodayDateInputValue() {
    return toDateInputValue(new Date());
  }

  const filteredSessionDetails = sessionDetails.filter((session) => {
    if (!session.session_date) return false;

    const currentDate = toDateInputValue(session.session_date);
    const matchesFrom = !sessionDateFrom || currentDate >= sessionDateFrom;
    const matchesTo = !sessionDateTo || currentDate <= sessionDateTo;

    return matchesFrom && matchesTo;
  });

  async function fetchSessions(batchId, subjectId) {
    try {
      const data = await fetchSessionForAttandance(batchId, subjectId);
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
        const data = await fetchBatches();
        if (data.success) {
          setMyBatches(data.data);
        } else {
          console.error("Error fetching batches:", data.error);
          setNotification({
            type: "error",
            message: data.error || "Failed to load academic batches from database.",
          });
        }
      } catch (error) {
        console.error("Error fetching batches:", error);
        setNotification({
          type: "error",
          message: "An unexpected error occurred while loading batches. Please refresh.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchBatchesFrontend();
  }, []);
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
      ) : myBatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myBatches.map((batch) => {
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
                    );
                    const studentResponse = await fetchStudent(batch.batch_id);
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

                    const attandanceData = await fetchAttandanceForOverall(
                      batch.batch_id,
                      sessionIds,
                      studentIds,
                    );
                    if (attandanceData.success) {
                      setAttandance(attandanceData.data);
                      setSessionDateFrom(
                        sessionResponse?.success &&
                          sessionResponse.data.length > 0
                          ? toDateInputValue(
                              sessionResponse.data[0].session_date,
                            )
                          : "",
                      );
                      setSessionDateTo(getTodayDateInputValue());
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
                    {isBusy && (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {batch.subject_name}
                  </h2>
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
          No assigned batches found.
        </div>
      )}

      {viewAttandance && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Attendance Register Overview
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Comprehensive grid of student attendance across all recorded
                  sessions
                </p>
              </div>
              <button
                onClick={() => setViewAttandance(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm transition shadow-xs"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                  <span>Session date from</span>
                  <input
                    type="date"
                    value={sessionDateFrom}
                    onChange={(e) => setSessionDateFrom(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                  <span>Session date to</span>
                  <input
                    type="date"
                    value={sessionDateTo}
                    onChange={(e) => setSessionDateTo(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <div className="flex gap-3 md:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSessionDateFrom("");
                      setSessionDateTo("");
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left border-collapse min-w-150">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="py-3 px-4 border-r border-gray-200 whitespace-nowrap w-24">
                        C Roll No.
                      </th>
                      <th className="py-3 px-4 border-r border-gray-200 whitespace-nowrap w-24">
                        U Roll No.
                      </th>
                      <th className="py-3 px-4 border-r border-gray-200 whitespace-nowrap min-w-45">
                        Student Name
                      </th>
                      {filteredSessionDetails.map((session, index) => (
                        <th
                          key={index}
                          title={formatSessionDate(session.session_date)}
                          className="py-3 px-3 text-center border-r border-gray-200 whitespace-nowrap w-12 cursor-help"
                        >
                          {index + 1}
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center whitespace-nowrap w-24 font-bold text-gray-800">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {students.map((student, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50/50 transition-colors text-sm"
                      >
                        <td className="py-3 px-4 font-medium text-gray-500 border-r border-gray-200 whitespace-nowrap">
                          {student.c_roll_number}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-500 border-r border-gray-200 whitespace-nowrap">
                          {student.u_roll_number}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900 border-r border-gray-200 whitespace-nowrap">
                          {student.name}
                        </td>
                        {filteredSessionDetails.map((session, sessionIndex) => {
                          const attendanceRecord = attandance.find(
                            (record) =>
                              record.class_session_id === session.id &&
                              record.student_id === student.id,
                          );
                          const status = attendanceRecord
                            ? attendanceRecord.status
                            : "N/A";
                          return (
                            <td
                              key={sessionIndex}
                              className="py-2 px-2 text-center border-r border-gray-200"
                            >
                              <span
                                className={`inline-flex w-7 h-7 items-center justify-center rounded font-bold text-xs shadow-xs ${
                                  status === "present"
                                    ? "bg-green-500 text-white"
                                    : status === "absent"
                                      ? "bg-red-500 text-white"
                                      : status === "outside"
                                        ? "bg-yellow-500 text-white"
                                        : "bg-gray-100 text-gray-400 border border-gray-200"
                                }`}
                              >
                                {status === "present"
                                  ? "P"
                                  : status === "absent"
                                    ? "A"
                                    : status === "outside"
                                      ? "O"
                                      : "—"}
                              </span>
                            </td>
                          );
                        })}
                        {(() => {
                          const totalPresent = attandance.filter(
                            (record) =>
                              record.student_id === student.id &&
                              filteredSessionDetails.some(
                                (session) =>
                                  session.id === record.class_session_id,
                              ) &&
                              (record.status === "present" ||
                                record.status === "outside"),
                          ).length;
                          const totalSessions = filteredSessionDetails.length;
                          return (
                            <td className="py-3 px-4 text-center font-bold text-gray-900 bg-gray-50/50">
                              {totalPresent} / {totalSessions}
                            </td>
                          );
                        })()}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBatchesPage;
