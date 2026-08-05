"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchSubject } from "@/app/action/fetchForFacultyAllocation";
import { submitSubject } from "@/app/action/submitSubject";
import { updateSubject, deleteSubject } from "@/app/action/updateSubject";
import SearchAbleDropdown from "@/app/component/SearchableDropdown";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  PlusCircle,
  ListFilter,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

const AddSubjectPage = () => {
  const [activeTab, setActiveTab] = useState("add"); // 'add' or 'manage'
  const [allSubjects, setAllSubjects] = useState([]);
  const [dataToInsert, setDataToInsert] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Manage tab states
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  // Helper to order subjects in frontend
  const orderSubjects = useCallback((list) => {
    return [...list].sort((a, b) => {
      const valA = a.subject_code || "";
      const valB = b.subject_code || "";
      return valA.localeCompare(valB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadSubjects() {
      try {
        const subjectsRes = await fetchSubject();
        if (!isMounted) return;
        if (subjectsRes && subjectsRes.data) {
          setAllSubjects(orderSubjects(subjectsRes.data, "code", "asc"));
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error loading subjects:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSubjects();
    return () => {
      isMounted = false;
    };
  }, [orderSubjects]);

  const handleRefresh = async () => {
    setLoading(true);
    setNotification({ type: "", message: "" });
    try {
      const subjectsRes = await fetchSubject();
      if (subjectsRes && subjectsRes.data) {
        setAllSubjects(orderSubjects(subjectsRes.data));
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "An unexpected error occurred while refreshing subjects.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add row functions for 'Add' tab
  const insertRow = () => {
    setDataToInsert((prevData) => [
      ...prevData,
      {
        subject_code: "",
        subject_name: "",
      },
    ]);
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

  const handleBulkSubmit = async () => {
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
        message: "Please add at least one subject row before submitting.",
      });
      return;
    }

    const invalid = dataToInsert.some(
      (item) => !item.subject_code?.trim() || !item.subject_name?.trim(),
    );
    if (invalid) {
      setNotification({
        type: "error",
        message:
          "Cannot submit: One or more rows contain empty fields. Both Subject Code and Subject Name are required for all rows.",
      });
      return;
    }

    const codes = dataToInsert.map((item) =>
      (item.subject_code || "").trim().toLowerCase(),
    );
    if (new Set(codes).size !== codes.length) {
      setNotification({
        type: "error",
        message:
          "Duplicate values detected: Multiple rows have the exact same Subject Code. Please remove duplicate entries before submitting.",
      });
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: "", message: "" });
    try {
      const res = await submitSubject(dataToInsert);
      if (res && res.success) {
        setNotification({
          type: "success",
          message: `Successfully added ${dataToInsert.length} new subject(s)!`,
        });
        setDataToInsert([]);
        await handleRefresh();
      } else {
        setNotification({
          type: "error",
          message: res?.error || "Failed to save subjects to the database.",
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message:
          "An unexpected error occurred while saving subjects. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (subject) => {
    setEditingId(subject.id);
    setEditForm({
      subject_code: subject.subject_code || "",
      subject_name: subject.subject_name || "",
    });
    setNotification({ type: "", message: "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditInputChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async (id) => {
    if (!editForm.subject_code?.trim() || !editForm.subject_name?.trim()) {
      setNotification({
        type: "error",
        message: "Subject Code and Subject Name cannot be empty.",
      });
      return;
    }

    setActionLoading(id);
    setNotification({ type: "", message: "" });
    try {
      const res = await updateSubject(id, editForm);
      if (res.success && res.data) {
        setNotification({
          type: "success",
          message: `Subject "${res.data.subject_code}" updated successfully!`,
        });
        const updatedList = allSubjects.map((item) =>
          item.id === id ? res.data : item,
        );
        setAllSubjects(orderSubjects(updatedList));
        setEditingId(null);
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to save subject updates.",
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "An unexpected error occurred while saving updates.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSubject = async (id, code, name) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete subject "${code} - ${name}"?`,
      )
    ) {
      return;
    }

    setActionLoading(id);
    setNotification({ type: "", message: "" });
    try {
      const res = await deleteSubject(id);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Subject "${code}" deleted successfully.`,
        });
        setAllSubjects((prev) => prev.filter((item) => item.id !== id));
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to delete subject.",
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "An unexpected error occurred while deleting subject.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Filter existing subjects by search text
  const filteredSubjects = allSubjects.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      (item.subject_code && item.subject_code.toLowerCase().includes(q)) ||
      (item.subject_name && item.subject_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen bg-gray-50 space-y-8">
      {/* Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Curriculum Administration
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Add & Manage Subjects
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-xl">
            Register new subject names and codes into the academic repository, or manage, edit, and audit existing curriculum items.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-200/70 p-1.5 rounded-xl border border-gray-300/60 self-start md:self-auto shrink-0 shadow-2xs">
          <button
            onClick={() => {
              setActiveTab("add");
              setNotification({ type: "", message: "" });
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "add"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Subjects</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("manage");
              setNotification({ type: "", message: "" });
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "manage"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Manage Subjects ({allSubjects.length})</span>
          </button>
        </div>
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

      {/* TAB 1: ADD SUBJECTS */}
      {activeTab === "add" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Bulk Register New Subjects
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Add rows below to configure subject codes and titles, then submit to save directly to Supabase.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={insertRow}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-xl text-sm transition shadow-xs hover:border-gray-400"
              >
                + Add Row
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={isSubmitting || dataToInsert.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-xl text-sm transition shadow-sm inline-flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Subjects ({dataToInsert.length})</span>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-visible border border-gray-200 rounded-xl pb-24">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 border-r border-gray-200 w-[45%]">
                    Subject Code
                  </th>
                  <th className="py-3.5 px-4 border-r border-gray-200 w-[45%]">
                    Subject Name / Title
                  </th>
                  <th className="py-3.5 px-4 w-[10%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dataToInsert.length > 0 ? (
                  dataToInsert.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50/40 transition-colors"
                    >
                      <td className="p-3 border-r border-gray-200 align-top">
                        <SearchAbleDropdown
                          options={allSubjects}
                          searchFor={["subject_code"]}
                          insert={{
                            subject_code: "subject_code",
                          }}
                          setDataToInsert={setDataToInsert}
                          index={index}
                          defaultValue={row.subject_code}
                          updateRow={updateRow}
                          mode="custom"
                          placeholder="e.g. CS-101 or MATH-202"
                        />
                      </td>
                      <td className="p-3 align-top border-r border-gray-200">
                        <SearchAbleDropdown
                          options={allSubjects}
                          searchFor={["subject_name"]}
                          insert={{
                            subject_name: "subject_name",
                          }}
                          setDataToInsert={setDataToInsert}
                          index={index}
                          defaultValue={row.subject_name}
                          updateRow={updateRow}
                          mode="both"
                          placeholder="e.g. Data Structures & Algorithms"
                        />
                      </td>
                      <td className="p-2.5 text-center align-middle">
                        <button
                          onClick={() => removeRow(index)}
                          title="Remove Row"
                          className="text-gray-400 hover:text-rose-600 transition font-bold p-1.5 rounded-md hover:bg-rose-50"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-16 text-center text-sm text-gray-400 font-medium"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <PlusCircle className="w-8 h-8 text-gray-300" />
                        <p className="text-gray-600 font-semibold">
                          No subject rows queued
                        </p>
                        <p className="text-xs text-gray-400 max-w-sm">
                          Click &ldquo;+ Add Row&rdquo; above to begin adding one or more subjects to the system.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE SUBJECTS */}
      {activeTab === "manage" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Manage Existing Subjects
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Search, edit attributes inline, or delete registered courses from the database.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Code or Subject Name..."
                  className="border border-gray-300 rounded-xl pl-10 pr-4 py-2 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs"
                />
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh Subjects from Database"
                className="p-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/90 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 border-r border-gray-200 w-[40%]">
                    Subject Code
                  </th>
                  <th className="py-3.5 px-4 border-r border-gray-200 w-[45%]">
                    Subject Name / Title
                  </th>
                  <th className="py-3.5 px-4 w-[15%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <p className="text-sm font-medium">
                          Loading subjects repository...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject) => {
                    const isEditing = editingId === subject.id;
                    const isBusy = actionLoading === subject.id;

                    return (
                      <tr
                        key={subject.id}
                        className={`transition-colors ${
                          isEditing
                            ? "bg-blue-50/40 font-normal"
                            : "hover:bg-gray-50/60"
                        }`}
                      >
                        {/* Subject Code */}
                        <td className="p-3.5 border-r border-gray-200 font-semibold text-gray-900 align-middle">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.subject_code || ""}
                              onChange={(e) =>
                                handleEditInputChange(
                                  "subject_code",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-normal shadow-2xs"
                              placeholder="Code"
                            />
                          ) : (
                            <span className="inline-block font-mono text-xs bg-gray-100 px-2.5 py-1 rounded text-gray-800 font-semibold border border-gray-200">
                              {subject.subject_code || "—"}
                            </span>
                          )}
                        </td>

                        {/* Subject Name */}
                        <td className="p-3.5 border-r border-gray-200 text-gray-800 font-medium align-middle">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.subject_name || ""}
                              onChange={(e) =>
                                handleEditInputChange(
                                  "subject_name",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs font-normal"
                              placeholder="Subject Title"
                            />
                          ) : (
                            subject.subject_name || "—"
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center align-middle">
                          {isBusy ? (
                            <div className="flex justify-center items-center">
                              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            </div>
                          ) : isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(subject.id)}
                                title="Save Updates"
                                className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition shadow-2xs"
                              >
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                title="Cancel"
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition shadow-2xs"
                              >
                                <X className="w-4 h-4 stroke-[2.5]" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => startEdit(subject)}
                                title="Edit Subject"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteSubject(
                                    subject.id,
                                    subject.subject_code,
                                    subject.subject_name,
                                  )
                                }
                                title="Delete Subject"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-16 text-center text-sm text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ListFilter className="w-8 h-8 text-gray-300" />
                        <p className="text-gray-700 font-semibold">
                          No subjects found
                        </p>
                        <p className="text-xs text-gray-400 max-w-sm">
                          {searchQuery
                            ? `No subject codes or titles matched "${searchQuery}". Try clearing your search text.`
                            : "No subjects exist in the academic database yet. Switch to the Add Subjects tab to create some."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSubjectPage;
