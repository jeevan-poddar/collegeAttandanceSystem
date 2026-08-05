"use client";
import { fetchAttendance } from "@/app/action/fetchAttandance";
import { fetchClassSession } from "@/app/action/fetchClassSession";
import { fetchStudent } from "@/app/action/fetchStudent";
import { submitAttendance } from "@/app/action/submitAttandance";
import Cell from "@/app/component/Cell";
import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const FacultyDashboardPage = () => {
  const [sessionDesOn, setSessionDesOn] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeClass, setActiveClass] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [classSessions, setClassSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    const fetchSessions = async () => {
      if (typeof window !== "undefined" && !window.navigator.onLine) {
        setNotification({
          type: "error",
          message: "Failed to load timetable: No internet connection detected.",
        });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchClassSession();
        setClassSessions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching class sessions:", error);
        setNotification({
          type: "error",
          message:
            "Failed to load class sessions from server. Please refresh.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const markStudent = (studentId, status) => {
    setAttendance((prevAttendance) => ({
      ...prevAttendance,
      [studentId]: status,
    }));
  };

  const handleSubmitAttendance = async () => {
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setNotification({
        type: "error",
        message:
          "Cannot submit attendance: No internet connection. Please connect to network and try again.",
      });
      return;
    }

    if (!activeClass || Object.keys(attendance).length === 0) {
      setNotification({
        type: "error",
        message:
          "Please mark attendance for at least one student before submitting.",
      });
      return;
    }

    const attendanceRecords = Object.entries(attendance).map(
      ([studentId, status]) => ({
        student_id: studentId,
        status: status,
        class_session_id: activeClass.id,
      }),
    );

    setIsSubmitting(true);
    setNotification({ type: "", message: "" });
    try {
      const result = await submitAttendance(attendanceRecords);
      console.log("Attendance submission result:", result);
      if (result && result.success !== false && !result.error) {
        setNotification({
          type: "success",
          message: `Successfully marked attendance for ${attendanceRecords.length} student(s)!`,
        });
        setActiveClass(null);
        setAttendance({});
      } else {
        setNotification({
          type: "error",
          message:
            result?.error ||
            "Failed to save attendance records. Please try again.",
        });
      }
    } catch (err) {
      console.error("Submit attendance error:", err);
      setNotification({
        type: "error",
        message:
          "An unexpected network error occurred while submitting attendance.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const periods = [
    "08:50 AM - 10:00 AM",
    "10:00 AM - 11:10 AM",
    "11:10 AM - 12:15 PM",
    "12:15 PM - 01:05 PM", //LUNCH
    "01:05 PM - 02:10 PM",
    "02:10 PM - 03:15 PM",
  ];
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      {/* Top Banner / Header */}
      <div className="px-6 py-8 md:px-10 md:py-8 bg-white border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Teacher Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome to your dashboard!
          </p>
        </div>
      </div>

      {/* Notification Banner */}
      {notification.message && (
        <div className="px-6 md:px-10 max-w-7xl mx-auto w-full mb-4">
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
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 px-6 md:px-10 pb-12 max-w-7xl w-full mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              Time Table
            </h2>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 w-48 whitespace-nowrap">
                    Time
                  </th>
                  {days.map((day) => (
                    <th
                      key={day}
                      className="py-3.5 px-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r last:border-r-0 border-gray-200 whitespace-nowrap"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <p className="text-sm text-gray-500 font-medium">
                          Loading teacher timetable and class schedule...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  periods.map((period, index) => {
                    return (
                      <tr
                        key={index}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-600 border-r border-gray-200 whitespace-nowrap bg-gray-50/30 align-middle">
                          {period}
                        </td>
                        {days.map((day) => {
                          const session =
                            index === 3
                              ? null
                              : classSessions.find(
                                  (s) =>
                                    s.day === day &&
                                    (index < 3
                                      ? s.period === index + 1
                                      : s.period === index),
                                );
                          return (
                            <td
                              key={day}
                              className={`p-2.5 text-center align-middle border-r last:border-r-0 border-gray-200 transition-colors ${
                                session
                                  ? "cursor-pointer hover:bg-blue-50/80"
                                  : "text-gray-400 text-sm select-none bg-gray-50/10"
                              }`}
                              onClick={async () => {
                                if (
                                  typeof window !== "undefined" &&
                                  !window.navigator.onLine
                                ) {
                                  setNotification({
                                    type: "error",
                                    message:
                                      "Cannot load student attendance: No internet connection.",
                                  });
                                  return;
                                }
                                if (!session) return;
                                setSelectedSession(session);
                                setSessionDesOn(true);
                                setStudentsLoading(true);
                                try {
                                  const studentData = await fetchStudent(
                                    session.batchId,
                                  );
                                  const sortedStudents = studentData?.success
                                    ? [...studentData.data].sort(
                                        (left, right) => {
                                          const leftValue = Number(
                                            left.c_roll_number,
                                          );
                                          const rightValue = Number(
                                            right.c_roll_number,
                                          );

                                          if (
                                            !Number.isNaN(leftValue) &&
                                            !Number.isNaN(rightValue)
                                          ) {
                                            return leftValue - rightValue;
                                          }

                                          return String(
                                            left.c_roll_number,
                                          ).localeCompare(
                                            String(right.c_roll_number),
                                            undefined,
                                            {
                                              numeric: true,
                                              sensitivity: "base",
                                            },
                                          );
                                        },
                                      )
                                    : [];

                                  setStudents(sortedStudents);
                                  const attandanceData = await fetchAttendance(
                                    session.id,
                                  );
                                  console.log(
                                    "Fetched Attendance Data:",
                                    attandanceData.data,
                                  );
                                  setAttendance(
                                    attandanceData.success
                                      ? attandanceData.data
                                      : {},
                                  );
                                } catch (err) {
                                  console.error(
                                    "Error loading attendance:",
                                    err,
                                  );
                                  setNotification({
                                    type: "error",
                                    message:
                                      "Failed to fetch student attendance records.",
                                  });
                                } finally {
                                  setStudentsLoading(false);
                                }
                              }}
                            >
                              {session ? (
                                <div className="py-1.5 px-2 rounded bg-blue-50/60 border border-blue-100 flex flex-col items-center justify-center gap-0.5 min-h-[44px]">
                                  <p className="font-semibold text-sm text-gray-900 leading-tight">
                                    {session.batch_code}
                                  </p>
                                  <p className="text-xs text-gray-500 leading-tight">
                                    {session.room}
                                  </p>
                                </div>
                              ) : (
                                <span className="inline-block py-2 text-gray-400 italic font-light">
                                  Free
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Session Details Modal */}
      {sessionDesOn && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3.5 border-b border-gray-200 mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Session Details
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition font-bold leading-none text-lg"
                onClick={() => {
                  setSessionDesOn(false);
                }}
              >
                ✕
              </button>
            </div>
            {selectedSession && (
              <div className="flex-1">
                <Cell
                  selectedSession={selectedSession}
                  setSessionDesOn={setSessionDesOn}
                  setActiveClass={setActiveClass}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* The Attendance Register Modal */}
      {activeClass && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          {/* The Slide-over Panel */}
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">
            {/* Header */}
            <div className="bg-blue-600 text-white p-5 flex justify-between items-center gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold leading-tight">
                  {activeClass.subject}
                </h2>
                <p className="text-blue-100 text-xs">
                  Batch:{" "}
                  <span className="font-semibold text-white">
                    {activeClass.batch_code}
                  </span>{" "}
                  | Room:{" "}
                  <span className="font-semibold text-white">
                    {activeClass.room}
                  </span>
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveClass(null);
                  setSelectedSession(null);
                  setSessionDesOn(false);
                  setAttendance({});
                  setStudents([]);
                }}
                className="bg-blue-700/50 hover:bg-blue-700 border border-blue-400/30 text-blue-100 hover:text-white px-3.5 py-1.5 rounded-lg text-sm font-medium transition shrink-0 shadow-sm"
              >
                Close
              </button>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-200 px-1">
                <div className="flex items-center space-x-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <span className="w-20 text-left shrink-0">C Roll No</span>
                  <span className="w-20 text-left shrink-0">U Roll No</span>
                  <span>Full Name</span>
                </div>
                <button
                  onClick={() => {
                    students.forEach((student) => {
                      markStudent(student.id, "present");
                    });
                  }}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-600 transition shrink-0 shadow-sm"
                >
                  Mark all Present
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {studentsLoading ? (
                  <div className="py-16 text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">
                      Loading enrolled students and attendance records...
                    </p>
                  </div>
                ) : (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between py-2.5 px-1 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden mr-3">
                        <span className="font-medium text-gray-500 w-20 text-left shrink-0 truncate">
                          {student.c_roll_number}
                        </span>
                        <span className="font-medium text-gray-500 w-20 text-left shrink-0 truncate">
                          {student.u_roll_number}
                        </span>
                        <span className="font-semibold text-gray-800  truncate">
                          {student.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => markStudent(student.id, "present")}
                          className={`w-8 h-8 flex items-center justify-center rounded-md font-bold text-xs transition-all ${
                            attendance[student.id] === "present"
                              ? "bg-green-500 text-white shadow-sm"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                          }`}
                        >
                          P
                        </button>
                        <button
                          onClick={() => markStudent(student.id, "absent")}
                          className={`w-8 h-8 flex items-center justify-center rounded-md font-bold text-xs transition-all ${
                            attendance[student.id] === "absent"
                              ? "bg-red-500 text-white shadow-sm"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                          }`}
                        >
                          A
                        </button>
                        <button
                          onClick={() => markStudent(student.id, "outside")}
                          className={`w-8 h-8 flex items-center justify-center rounded-md font-bold text-xs transition-all ${
                            attendance[student.id] === "outside"
                              ? "bg-yellow-500 text-white shadow-sm"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                          }`}
                        >
                          O
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-200 bg-gray-50 space-y-4">
              <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
                <span>
                  Present:{" "}
                  <strong className="text-gray-900 font-semibold">
                    {
                      Object.values(attendance).filter(
                        (status) =>
                          status === "present" || status === "outside",
                      ).length
                    }
                  </strong>
                </span>
                <span>
                  Absent:{" "}
                  <strong className="text-gray-900 font-semibold">
                    {
                      Object.values(attendance).filter(
                        (status) => status === "absent",
                      ).length
                    }
                  </strong>
                </span>
              </div>
              <button
                disabled={isSubmitting || studentsLoading}
                className="w-full py-3 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-sm inline-flex items-center justify-center gap-2"
                onClick={() => {
                  console.log(attendance);
                  handleSubmitAttendance();
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Attendance...</span>
                  </>
                ) : (
                  <span>Submit Attendance</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboardPage;
