"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";

const Cell = (props) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  return (
    <div className="space-y-6">
      {/* Session Metadata Table */}
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-gray-50/50 overflow-hidden">
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

      {/* Proxy Form */}
      <div className="pt-1">
        <form onSubmit={handleSubmit(props.onSubmit)} className="space-y-3">
          <label
            htmlFor="is_proxy_toggle"
            className="inline-flex items-center space-x-3 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              id="is_proxy_toggle"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              {...register("is_proxy")}
            />
            <span className="text-sm font-medium text-gray-800">Mark as Proxy</span>
          </label>

          {watch("is_proxy") && (
            <div className="mt-2">
              <input
                id="proxyFaculty"
                placeholder="Enter proxy teacher name..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                type="text"
                {...register("proxy_faculty")}
              />
            </div>
          )}
        </form>
      </div>

      {/* Action Button */}
      <div className="pt-2 border-t border-gray-100">
        <button
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-all shadow-sm flex items-center justify-center"
          onClick={() => {
            props.setSessionDesOn(false);
            props.setActiveClass(props.selectedSession);
          }}
        >
          Mark Attendance
        </button>
      </div>
    </div>
  );
};

export default Cell;
