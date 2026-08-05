"use client";
import {
  fetchBatches,
  fetchFaculty,
  fetchSubject,
} from "@/app/action/fetchForFacultyAllocation";
import { submitFacultyAllocation } from "@/app/action/submitFacultyAllocation";
import SearchAbleDropdown from "@/app/component/SearchableDropdown";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const Page = () => {
  const [dataToInsert, setDataToInsert] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });

  const {
    register,
    watch,
    formState: { errors },
  } = useForm();

  const sessionYear = watch("sessionYear");
  const insertRow = () => {
    setDataToInsert((prevData) => [
      ...prevData,
      {
        faculty_id: null,
        batch_id: null,
        subject_id: null,
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

  const handleSubmitAllocation = async () => {
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
        message: "Please add at least one faculty allocation row before submitting.",
      });
      return;
    }

    const hasEmpty = dataToInsert.some(
      (item) => !item.faculty_id || !item.batch_id || !item.subject_id,
    );
    if (hasEmpty) {
      setNotification({
        type: "error",
        message:
          "Cannot submit: One or more rows contain unselected dropdowns. Please select Faculty, Batch, and Subject for all rows or remove empty rows.",
      });
      return;
    }

    const combos = dataToInsert.map(
      (item) => `${item.faculty_id}_${item.batch_id}_${item.subject_id}`,
    );
    if (new Set(combos).size !== combos.length) {
      setNotification({
        type: "error",
        message:
          "Duplicate entries detected: Multiple rows have the exact same Faculty, Batch, and Subject combination. Please remove duplicate entries.",
      });
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: "", message: "" });
    try {
      const res = await submitFacultyAllocation(dataToInsert);
      if (res && res.success) {
        setNotification({
          type: "success",
          message: `Successfully saved ${dataToInsert.length} faculty allocation(s)!`,
        });
        setDataToInsert([]);
      } else {
        setNotification({
          type: "error",
          message:
            res?.error || "Failed to submit faculty allocations to database.",
        });
      }
    } catch (err) {
      console.error("Allocation submit error:", err);
      setNotification({
        type: "error",
        message:
          "An unexpected error occurred while saving allocations. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    const fetachData = async () => {
      if (typeof window !== "undefined" && !window.navigator.onLine) {
        setNotification({
          type: "error",
          message:
            "Failed to load academic data: No internet connection detected.",
        });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const facultyData = await fetchFaculty();
        if (facultyData?.data) setAllFaculty(facultyData.data);
        const batchesData = await fetchBatches(sessionYear);
        if (batchesData?.data) setAllBatches(batchesData.data);
        const subjectsData = await fetchSubject();
        if (subjectsData?.data) setAllSubjects(subjectsData.data);
      } catch (error) {
        console.error("Error loading dropdown data:", error);
        setNotification({
          type: "error",
          message:
            "Failed to load academic data from server. Please check your internet connection and try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetachData();
  }, [sessionYear]);
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Faculty Allocation Management
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Review repository metadata and assign teachers to subject batches
        </p>
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

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Configure Allocations
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                defaultValue={"2025-2026"}
                placeholder="Session Year (e.g. 2026)"
                className="px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                {...register("sessionYear")}
              />
            </form>
            <button
              onClick={insertRow}
              disabled={loading}
              className="bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm transition shadow-xs"
            >
              + Add Row
            </button>
            <button
              onClick={handleSubmitAllocation}
              disabled={isSubmitting || loading || dataToInsert.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow-sm inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Allocation ({dataToInsert.length})</span>
              )}
            </button>
          </div>
        </div>

        <div className="overflow-visible border border-gray-200 rounded-lg pb-32">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4 border-r border-gray-200 w-1/3">
                  Faculty Name
                </th>
                <th className="py-3 px-4 border-r border-gray-200 w-1/3">
                  Batch Code
                </th>
                <th className="py-3 px-4 w-1/3 border-r border-gray-200">
                  Subject Code
                </th>
                <th className="py-3 px-4 w-1/3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-sm text-gray-500 font-medium">
                        Loading academic configuration and faculty data...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : dataToInsert.length > 0 ? (
                dataToInsert.map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50/40 transition-colors"
                  >
                    <td className="p-3 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={allFaculty}
                        searchFor={["name"]}
                        insert={{ faculty_id: "id" }}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        // defaultValue={row.facultyName}
                        updateRow={updateRow}
                        mode="option"
                        placeholder="Select Faculty"
                      />
                    </td>
                    <td className="p-3 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={allBatches}
                        searchFor={[
                          "batch_code",
                          "semester",
                          "branch",
                          "course",
                        ]}
                        insert={{ batch_id: "id" }}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        // defaultValue={row.batchCode}
                        updateRow={updateRow}
                        mode="option"
                        placeholder="Select Batch"
                      />
                    </td>
                    <td className="p-3 align-top border-r border-gray-200">
                      <SearchAbleDropdown
                        options={allSubjects}
                        searchFor={["subject_code", "subject_name"]}
                        insert={{ subject_id: "id" }}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        // defaultValue={row.subjectCode}
                        updateRow={updateRow}
                        mode="option"
                        placeholder="Select Subject"
                      />
                    </td>
                    <td className="p-2.5 text-center align-middle ">
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
                    colSpan={4}
                    className="py-12 text-center text-sm text-gray-400 font-medium"
                  >
                    No allocation rows added yet. Click &ldquo;+ Add Row&rdquo;
                    to start configuring allocations.
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

export default Page;
