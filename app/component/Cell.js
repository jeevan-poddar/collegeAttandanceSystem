"use client";
import React from "react";

const Cell = (props) => {
  const canMarkAttendance =
    ["scheduled", "completed"].includes(props.selectedSession?.status) &&
    props.selectedSession?.batch_status === "active";
  return (
    <div className="space-y-6">
      {/* Session Metadata Table */}
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-gray-50/50 overflow-hidden">
        <div className="flex items-center px-4 py-2.5">
          <span className="w-24 shrink-0 text-sm font-medium text-gray-500">Status:</span>
          <span className={`text-sm font-semibold ${
            props.selectedSession?.status === "scheduled" &&
            props.selectedSession?.batch_status === "active"
              ? "text-emerald-700"
              : "text-rose-700"
          }`}>
            {props.selectedSession?.status || "scheduled"} session
            {props.selectedSession?.batch_status !== "active"
              ? ` • ${props.selectedSession?.batch_status || "inactive"} batch`
              : ""}
          </span>
        </div>
        <div className="flex items-center px-4 py-2.5">
          <span className="w-24 shrink-0 text-sm font-medium text-gray-500">Branch:</span>
          <span className="text-sm font-semibold text-gray-900 truncate">
            {props.selectedSession?.branch || "N/A"}
          </span>
        </div>
        <div className="flex items-center px-4 py-2.5">
          <span className="w-24 shrink-0 text-sm font-medium text-gray-500">Course:</span>
          <span className="text-sm font-semibold text-gray-900 truncate">
            {props.selectedSession?.course || "N/A"}
          </span>
        </div>
        <div className="flex items-center px-4 py-2.5">
          <span className="w-24 shrink-0 text-sm font-medium text-gray-500">Sem:</span>
          <span className="text-sm font-semibold text-gray-900 truncate">
            {props.selectedSession?.sem || "N/A"}
          </span>
        </div>
        <div className="flex items-center px-4 py-2.5">
          <span className="w-24 shrink-0 text-sm font-medium text-gray-500">Batch:</span>
          <span className="text-sm font-semibold text-gray-900 truncate">
            {props.selectedSession?.batch_code || "N/A"}
          </span>
        </div>
        <div className="flex items-center px-4 py-2.5">
          <span className="w-24 shrink-0 text-sm font-medium text-gray-500">Group:</span>
          <span className="text-sm font-semibold text-indigo-600 truncate">
            {props.selectedSession?.batch_group || "All / General"}
          </span>
        </div>
        <div className="flex items-center px-4 py-2.5">
          <span className="w-24 shrink-0 text-sm font-medium text-gray-500">Subject:</span>
          <span className="text-sm font-semibold text-gray-900 truncate">
            {props.selectedSession?.subject || "N/A"}
          </span>
        </div>
        <div className="flex items-center px-4 py-2.5">
          <span className="w-24 shrink-0 text-sm font-medium text-gray-500">Room No:</span>
          <span className="text-sm font-semibold text-gray-900 truncate">
            {props.selectedSession?.room || "N/A"}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 border-t border-gray-100">
        <button
          disabled={
            !canMarkAttendance
          }
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-all shadow-sm flex items-center justify-center"
          onClick={() => {
            props.setSessionDesOn(false);
            props.setActiveClass(props.selectedSession);
          }}
        >
          {canMarkAttendance
            ? "Mark Attendance"
            : "Attendance Unavailable"}
        </button>
      </div>
    </div>
  );
};

export default Cell;
