"use client";

import SearchAbleDropdown from "@/app/component/SearchableDropdown";
import React, { useState } from "react";
import { submitBatches } from "@/app/action/submitBatches";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const BatchesPage = () => {
  const [dataToInsert, setDataToInsert] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });

  const insertRow = () => {
    setDataToInsert((prevData) => [
      ...prevData,
      {
        batch_code: "",
        session_year: "",
        semester: "",
        branch: "",
        course: "",
        room_no: "",
      },
    ]);
    setNotification({ type: "", message: "" });
  };
  const updateRow = (index, field, value) => {
    setDataToInsert((prevData) =>
      prevData.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };
  const removeRow = (indexToRemove) => {
    setDataToInsert((prevData) =>
      prevData.filter((_, idx) => idx !== indexToRemove),
    );
  };

  const handleSubmitBatches = async () => {
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setNotification({
        type: "error",
        message:
          "Network connection error. Please check your internet connection and try again.",
      });
      return;
    }

    if (dataToInsert.length === 0) {
      setNotification({
        type: "error",
        message: "Please add at least one batch row before submitting.",
      });
      return;
     }

    const hasEmpty = dataToInsert.some(
      (item) =>
        !item.batch_code?.trim() ||
        !item.session_year?.trim() ||
        !item.semester ||
        !item.branch?.trim() ||
        !item.course?.trim() ||
        !item.room_no?.trim(),
    );

    if (hasEmpty) {
      setNotification({
        type: "error",
        message:
          "Cannot submit: One or more rows contain empty fields. Please complete all required batch details or remove empty rows.",
      });
      return;
    }

    const codes = dataToInsert.map((item) =>
      (item.batch_code || "").trim().toLowerCase(),
    );
    if (new Set(codes).size !== codes.length) {
      setNotification({
        type: "error",
        message:
          "Duplicate values detected: Multiple rows have the same Batch Code. Please remove duplicate rows before submitting.",
      });
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: "", message: "" });
    try {
      const res = await submitBatches(dataToInsert);
      if (res && res.success) {
        setNotification({
          type: "success",
          message: `Successfully added ${dataToInsert.length} new batch(es)!`,
        });
        setDataToInsert([]);
      } else {
        setNotification({
          type: "error",
          message: res?.error || "Failed to save batches to the database.",
        });
      }
    } catch (err) {
      console.error("Submit error:", err);
      setNotification({
        type: "error",
        message:
          "An unexpected error occurred while saving batches. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Add Batches
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure class batches, academic session years, and room
            allocations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={insertRow}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm transition shadow-xs"
          >
            + Add Row
          </button>
          <button
            onClick={handleSubmitBatches}
            disabled={isSubmitting || dataToInsert.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow-sm inline-flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Batches ({dataToInsert.length})</span>
            )}
          </button>
        </div>
      </div>

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

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-visible pb-32">

        <div className="overflow-visible">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-3.5 border-r border-gray-200 w-1/6">
                  Batch Code
                </th>
                <th className="py-3 px-3.5 border-r border-gray-200 w-1/6">
                  Session Year
                </th>
                <th className="py-3 px-3.5 border-r border-gray-200 w-1/6">
                  Semester
                </th>
                <th className="py-3 px-3.5 border-r border-gray-200 w-1/6">
                  Branch
                </th>
                <th className="py-3 px-3.5 border-r border-gray-200 w-1/6">
                  Course
                </th>
                <th className="py-3 px-3.5 w-1/6  border-r border-gray-200 ">
                  Room No.
                </th>
                <th className="py-3.5 px-4 w-1/2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dataToInsert.length > 0 ? (
                dataToInsert.map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50/40 transition-colors"
                  >
                    <td className="p-2.5 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={[]}
                        searchFor={["batch_code"]}
                        insert={{
                          batch_code: "batch_code",
                        }}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        updateRow={updateRow}
                        mode="custom"
                        placeholder="Batch Code"
                      />
                    </td>
                    <td className="p-2.5 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={[]}
                        searchFor={["session_year"]}
                        insert={{
                          session_year: "session_year",
                        }}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        updateRow={updateRow}
                        mode="custom"
                        placeholder="Year"
                      />
                    </td>
                    <td className="p-2.5 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={[]}
                        searchFor={["name"]}
                        insert={{
                          semester: "semester",
                        }}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        updateRow={updateRow}
                        mode="custom"
                        placeholder="Semester"
                      />
                    </td>
                    <td className="p-2.5 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={[]}
                        searchFor={["branch"]}
                        insert={{
                          branch: "branch",
                        }}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        updateRow={updateRow}
                        mode="custom"
                        placeholder="Branch"
                      />
                    </td>
                    <td className="p-2.5 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={[]}
                        searchFor={["course"]}
                        insert={{
                          course: "course",
                        }}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        updateRow={updateRow}
                        mode="custom"
                        placeholder="Course"
                      />
                    </td>
                    <td className="p-2.5 align-top  border-r border-gray-200">
                      <SearchAbleDropdown
                        options={[]}
                        searchFor={["room_no"]}
                        insert={{
                          room_no: "room_no",
                        }}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        updateRow={updateRow}
                        mode="custom"
                        placeholder="Room"
                      />
                    </td>
                    <td className="p-2.5 text-center align-middle">
                      <button
                        onClick={() => removeRow(index)}
                        title="Remove Row"
                        className="text-gray-400 hover:text-rose-600 transition font-bold p-1 rounded-md"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-gray-400 font-medium"
                  >
                    No batch rows added yet. Click &ldquo;+ Add Row&rdquo; above
                    to get started.
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

export default BatchesPage;
