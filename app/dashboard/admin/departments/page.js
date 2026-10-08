"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartments,
} from "@/app/action/departments/departmentActions";
import { callWithRole } from "@/app/utlis/callWithRole";
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
  Building2,
} from "lucide-react";

const ManageDepartmentsPage = () => {
  const role = useSelector((state) => state.user.role);
  const [activeTab, setActiveTab] = useState("manage"); // 'add' or 'manage'
  const [allDepartments, setAllDepartments] = useState([]);
  const [dataToInsert, setDataToInsert] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Manage tab states
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  // Helper to order departments in frontend
  const orderDepartments = useCallback((list) => {
    return [...list].sort((a, b) => {
      const valA = a.name || "";
      const valB = b.name || "";
      return valA.localeCompare(valB, undefined, {
        sensitivity: "base",
      });
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadDepartments() {
      try {
        const response = await callWithRole(role, ["admin"], getDepartments);
        if (!isMounted) return;
        if (response && response.data) {
          setAllDepartments(orderDepartments(response.data));
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error loading departments:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDepartments();
    return () => {
      isMounted = false;
    };
  }, [orderDepartments, role]);

  const handleRefresh = async () => {
    setLoading(true);
    setNotification({ type: "", message: "" });
    try {
      const response = await callWithRole(role, ["admin"], getDepartments);
      if (response && response.data) {
        setAllDepartments(orderDepartments(response.data));
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "An unexpected error occurred while refreshing departments.",
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
        name: "",
        s_name: "",
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
        message: "Please add at least one department row before submitting.",
      });
      return;
    }

    const invalid = dataToInsert.some(
      (item) => !item.name?.trim() || !item.s_name?.trim(),
    );
    if (invalid) {
      setNotification({
        type: "error",
        message:
          "Cannot submit: One or more rows contain empty fields. Both Department Name and Short Name are required.",
      });
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: "", message: "" });
    try {
      // Create departments one by one
      let hasError = false;
      let errorMsg = "";
      for (const item of dataToInsert) {
          const res = await callWithRole(role, ["admin"], createDepartment, item);
          if (!res || !res.success) {
              hasError = true;
              errorMsg = res?.error || "Failed to save some departments.";
              break;
          }
      }
      
      if (!hasError) {
        setNotification({
          type: "success",
          message: `Successfully added ${dataToInsert.length} new department(s)!`,
        });
        setDataToInsert([]);
        await handleRefresh();
        setActiveTab("manage");
      } else {
        setNotification({
          type: "error",
          message: errorMsg,
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message:
          "An unexpected error occurred while saving departments. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (department) => {
    setEditingId(department.id);
    setEditForm({
      name: department.name || "",
      s_name: department.s_name || "",
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
    if (!editForm.name?.trim() || !editForm.s_name?.trim()) {
      setNotification({
        type: "error",
        message: "Department Name and Short Name cannot be empty.",
      });
      return;
    }

    setActionLoading(id);
    setNotification({ type: "", message: "" });
    try {
      const res = await callWithRole(
        role,
        ["admin"],
        updateDepartment,
        id,
        editForm,
      );
      if (res.success && res.data) {
        setNotification({
          type: "success",
          message: `Department "${res.data.name}" updated successfully!`,
        });
        const updatedList = allDepartments.map((item) =>
          item.id === id ? res.data : item,
        );
        setAllDepartments(orderDepartments(updatedList));
        setEditingId(null);
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to save department updates.",
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

  const handleDeleteDepartment = async (id, name, s_name) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete department "${name} (${s_name})"?\n\nWarning: This may fail if there are students or faculty assigned to this department.`,
      )
    ) {
      return;
    }

    setActionLoading(id);
    setNotification({ type: "", message: "" });
    try {
      const res = await callWithRole(role, ["admin"], deleteDepartment, id);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Department "${name}" deleted successfully.`,
        });
        setAllDepartments((prev) => prev.filter((item) => item.id !== id));
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to delete department.",
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "An unexpected error occurred while deleting department.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Filter existing departments by search text
  const filteredDepartments = allDepartments.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.s_name && item.s_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen bg-gray-50 space-y-8">
      {/* Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Building2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Administration
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Manage Departments
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-xl">
            Add new departments, update existing department details, or remove them from the system.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-200/70 p-1.5 rounded-xl border border-gray-300/60 self-start md:self-auto shrink-0 shadow-2xs">
          <button
            onClick={() => {
              setActiveTab("add");
              if (dataToInsert.length === 0) insertRow();
              setNotification({ type: "", message: "" });
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "add"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Department</span>
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
            <span>Manage Departments ({allDepartments.length})</span>
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

      {/* TAB 1: ADD DEPARTMENTS */}
      {activeTab === "add" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Register New Departments
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Add rows below to configure department names and their short names.
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
                  <span>Submit Departments ({dataToInsert.length})</span>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-visible border border-gray-200 rounded-xl pb-10">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 border-r border-gray-200 w-[50%]">
                    Department Name
                  </th>
                  <th className="py-3.5 px-4 border-r border-gray-200 w-[40%]">
                    Short Name (Acronym)
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
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateRow(index, "name", e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                        />
                      </td>
                      <td className="p-3 align-top border-r border-gray-200">
                         <input
                          type="text"
                          value={row.s_name}
                          onChange={(e) => updateRow(index, "s_name", e.target.value)}
                          placeholder="e.g. CSE"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
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
                          No department rows queued
                        </p>
                        <p className="text-xs text-gray-400 max-w-sm">
                          Click &ldquo;+ Add Row&rdquo; above to begin adding
                          departments to the system.
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

      {/* TAB 2: MANAGE DEPARTMENTS */}
      {activeTab === "manage" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Manage Existing Departments
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Search, edit inline, or delete departments from the database.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search departments..."
                  className="border border-gray-300 rounded-xl pl-10 pr-4 py-2 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs"
                />
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh Departments from Database"
                className="p-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Departments Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/90 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 border-r border-gray-200 w-[50%]">
                    Department Name
                  </th>
                  <th className="py-3.5 px-4 border-r border-gray-200 w-[35%]">
                    Short Name
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
                          Loading departments...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredDepartments.length > 0 ? (
                  filteredDepartments.map((department) => {
                    const isEditing = editingId === department.id;
                    const isBusy = actionLoading === department.id;

                    return (
                      <tr
                        key={department.id}
                        className={`transition-colors ${
                          isEditing
                            ? "bg-blue-50/40 font-normal"
                            : "hover:bg-gray-50/60"
                        }`}
                      >
                        {/* Department Name */}
                        <td className="p-3.5 border-r border-gray-200 font-semibold text-gray-900 align-middle">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.name || ""}
                              onChange={(e) =>
                                handleEditInputChange(
                                  "name",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-normal shadow-2xs"
                              placeholder="Name"
                            />
                          ) : (
                            department.name || "—"
                          )}
                        </td>

                        {/* Short Name */}
                        <td className="p-3.5 border-r border-gray-200 text-gray-800 font-medium align-middle">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.s_name || ""}
                              onChange={(e) =>
                                handleEditInputChange(
                                  "s_name",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs font-normal"
                              placeholder="Short Name"
                            />
                          ) : (
                            <span className="inline-block font-mono text-xs bg-gray-100 px-2.5 py-1 rounded text-gray-800 font-semibold border border-gray-200">
                                {department.s_name || "—"}
                            </span>
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
                                onClick={() => handleSaveEdit(department.id)}
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
                                onClick={() => startEdit(department)}
                                title="Edit Department"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteDepartment(
                                    department.id,
                                    department.name,
                                    department.s_name,
                                  )
                                }
                                title="Delete Department"
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
                          No departments found
                        </p>
                        <p className="text-xs text-gray-400 max-w-sm">
                          {searchQuery
                            ? `No department names or codes matched "${searchQuery}". Try clearing your search text.`
                            : "No departments exist in the database yet. Switch to the Add Department tab to create some."}
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

export default ManageDepartmentsPage;
