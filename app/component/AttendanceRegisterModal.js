"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const StudentDashboardComponent = dynamic(
  () => import("./StudentDashboardComponent"),
  { ssr: false },
);

function formatSessionDate(sessionDate) {
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(sessionDate));
  return formattedDate.replace(" ", "-");
}

function toDateInputValue(sessionDate) {
  const date = new Date(sessionDate);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDateInputValue() {
  return toDateInputValue(new Date());
}

const AttendanceRegisterModal = ({
  onClose,
  students = [],
  sessionDetails = [],
  attendance = [],
  title = "Attendance Register Overview",
  subtitle = "Comprehensive grid of student attendance across all recorded sessions",
  zIndex = 50,
}) => {
  const [sessionDateFrom, setSessionDateFrom] = useState(() =>
    sessionDetails.length > 0 ? toDateInputValue(sessionDetails[0].session_date) : "",
  );
  const [sessionDateTo, setSessionDateTo] = useState(() => getTodayDateInputValue());
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const filteredSessionDetails = sessionDetails.filter((session) => {
    if (!session.session_date) return false;
    const currentDate = toDateInputValue(session.session_date);
    const matchesFrom = !sessionDateFrom || currentDate >= sessionDateFrom;
    const matchesTo = !sessionDateTo || currentDate <= sessionDateTo;
    return matchesFrom && matchesTo;
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ zIndex }}
    >
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gray-50/70">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-200/80 hover:bg-gray-300 text-gray-800 font-bold px-4 py-2 rounded-xl text-sm transition shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Date Range Filters */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end bg-gray-50 p-4 rounded-xl border border-gray-200/80">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
              <span>Session Date From</span>
              <input
                type="date"
                value={sessionDateFrom}
                onChange={(e) => setSessionDateFrom(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700">
              <span>Session Date To</span>
              <input
                type="date"
                value={sessionDateTo}
                onChange={(e) => setSessionDateTo(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </label>
            <div className="flex gap-3 md:justify-end">
              <button
                type="button"
                onClick={() => {
                  setSessionDateFrom("");
                  setSessionDateTo("");
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-xs transition hover:bg-gray-100 hover:text-gray-900"
              >
                Clear Date Filter
              </button>
            </div>
          </div>

          {/* Attendance Register Grid */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-xs">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 border-r border-gray-200 whitespace-nowrap w-28">
                    C Roll No.
                  </th>
                  <th className="py-3.5 px-4 border-r border-gray-200 whitespace-nowrap w-28">
                    U Roll No.
                  </th>
                  <th className="py-3.5 px-4 border-r border-gray-200 whitespace-nowrap min-w-[210px]">
                    Student Name
                  </th>
                  {filteredSessionDetails.map((session, index) => (
                    <th
                      key={session.id || index}
                      title={formatSessionDate(session.session_date)}
                      className="py-3.5 px-2 text-center border-r border-gray-200 whitespace-nowrap w-12 cursor-help font-bold text-blue-700 bg-blue-50/50 hover:bg-blue-100 transition-colors"
                    >
                      {index + 1}
                      <div className="text-[10px] font-normal text-gray-500 mt-0.5">
                        {formatSessionDate(session.session_date)}
                      </div>
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-center whitespace-nowrap w-28 font-bold text-gray-800 bg-gray-100/80">
                    Total Present
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr
                      key={student.id || student.c_roll_number}
                      className="hover:bg-gray-50/60 transition-colors text-sm"
                    >
                      <td className="py-3 px-4 font-semibold text-gray-600 border-r border-gray-200 whitespace-nowrap">
                        {student.c_roll_number}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-500 border-r border-gray-200 whitespace-nowrap">
                        {student.u_roll_number}
                      </td>
                      <td
                        className="py-3 px-4 font-bold text-blue-600 border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-blue-50/60 transition-all group/name"
                        onClick={() => student.id && setSelectedStudentId(student.id)}
                        title="Click to open student's academic dashboard and courses"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="group-hover/name:underline text-gray-900 group-hover/name:text-blue-600 transition-colors">
                            {student.name}
                          </span>
                          {student.id && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 group-hover/name:bg-blue-100 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border border-blue-200/80 transition-colors">
                              View Profile
                            </span>
                          )}
                        </div>
                      </td>
                      {filteredSessionDetails.map((session, sessionIndex) => {
                        const attendanceRecord = attendance.find(
                          (record) =>
                            record.class_session_id === session.id &&
                            record.student_id === student.id,
                        );
                        const status = attendanceRecord ? attendanceRecord.status : "N/A";
                        return (
                          <td
                            key={sessionIndex}
                            className="py-2 px-2 text-center border-r border-gray-200"
                          >
                            <span
                              className={`inline-flex w-7 h-7 items-center justify-center rounded-lg font-bold text-xs shadow-2xs transition-transform hover:scale-110 ${
                                status === "present"
                                  ? "bg-emerald-500 text-white"
                                  : status === "absent"
                                    ? "bg-rose-500 text-white"
                                    : status === "outside"
                                      ? "bg-amber-500 text-white"
                                      : "bg-gray-100 text-gray-400 border border-gray-200"
                              }`}
                              title={`Status: ${status.toUpperCase()}`}
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
                        const totalPresent = attendance.filter(
                          (record) =>
                            record.student_id === student.id &&
                            filteredSessionDetails.some(
                              (session) => session.id === record.class_session_id,
                            ) &&
                            (record.status === "present" || record.status === "outside"),
                        ).length;
                        const totalSessions = filteredSessionDetails.length;
                        const percentage = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;
                        return (
                          <td className="py-3 px-4 text-center font-bold text-gray-900 bg-gray-50/60">
                            <span>{totalPresent} / {totalSessions}</span>
                            {totalSessions > 0 && (
                              <div className={`text-[11px] font-semibold mt-0.5 ${
                                percentage >= 75 ? "text-emerald-600" : percentage >= 50 ? "text-amber-600" : "text-rose-600"
                              }`}>
                                {percentage}%
                              </div>
                            )}
                          </td>
                        );
                      })()}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={filteredSessionDetails.length + 4} className="py-12 text-center text-gray-500 text-sm font-medium">
                      No enrolled students found for this batch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Student Dashboard Overlay Modal */}
      {selectedStudentId && (
        <StudentDashboardComponent
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          isModal={true}
        />
      )}
    </div>
  );
};

export default AttendanceRegisterModal;
