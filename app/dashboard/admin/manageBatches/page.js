"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchBatches } from "@/app/action/fetchForFacultyAllocation";
import { updateBatch, deleteBatch } from "@/app/action/updateBatch";
import { fetchStudent } from "@/app/action/fetchStudent";
import { fetchAllStudents } from "@/app/action/fetchAllStudents";
import {
  submitStudentBatches,
  removeStudentFromBatch,
} from "@/app/action/submitStudentBatches";
import SearchAbleDropdown from "@/app/component/SearchableDropdown";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  Layers,
  Calendar,
  AlertCircle,
  CheckCircle2,
  BookmarkCheck,
  Users,
  UserPlus,
  GraduationCap,
  Plus,
} from "lucide-react";

const ManageBatchesPage = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionYearFilter, setSessionYearFilter] = useState("2025-2026");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Student modal states
  const [selectedBatchForStudents, setSelectedBatchForStudents] =
    useState(null);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [studentModalTab, setStudentModalTab] = useState("list"); // "list" | "enroll"
  const [dataToInsert, setDataToInsert] = useState([]);
  const [isSubmittingStudents, setIsSubmittingStudents] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Function to order batches in frontend: first by session_year, then by batch_code
  const orderBatches = useCallback((dataList) => {
    return [...dataList].sort((a, b) => {
      const yearA = (a.session_year || "").trim();
      const yearB = (b.session_year || "").trim();
      if (yearA !== yearB) {
        return yearB.localeCompare(yearA);
      }
      const codeA = (a.batch_code || "").trim();
      const codeB = (b.batch_code || "").trim();
      return codeA.localeCompare(codeB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchInitialData() {
      try {
        const targetYear = sessionYearFilter.trim()
          ? sessionYearFilter.trim()
          : "ALL";
        const res = await fetchBatches(targetYear);
        if (!isMounted) return;
        if (res.success && res.data) {
          const sorted = orderBatches(res.data);
          setBatches(sorted);
          setNotification({ type: "", message: "" });
        } else {
          setBatches([]);
          if (res.error) {
            setNotification({
              type: "error",
              message: `Failed to load batches: ${res.error}`,
            });
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setNotification({
          type: "error",
          message: "An unexpected error occurred while fetching batches.",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, [sessionYearFilter, orderBatches]);

  // Load all students once for enrollment suggestions
  useEffect(() => {
    async function loadAllStudents() {
      const res = await fetchAllStudents();
      if (res.success && res.data) {
        setAllStudents(res.data);
      }
    }
    loadAllStudents();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setNotification({ type: "", message: "" });

    try {
      const targetYear = sessionYearFilter.trim()
        ? sessionYearFilter.trim()
        : "ALL";
      const res = await fetchBatches(targetYear);
      if (res.success && res.data) {
        const sorted = orderBatches(res.data);
        setBatches(sorted);
      } else {
        setBatches([]);
        if (res.error) {
          setNotification({
            type: "error",
            message: `Failed to load batches: ${res.error}`,
          });
        }
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "An unexpected error occurred while fetching batches.",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (e, batch) => {
    e.stopPropagation();
    setEditingId(batch.id);
    setEditForm({
      batch_code: batch.batch_code || "",
      session_year: batch.session_year || "",
      semester: batch.semester || 1,
      branch: batch.branch || "",
      course: batch.course || "",
      room_no: batch.room_no || "",
      status: batch.status || "active",
    });
    setNotification({ type: "", message: "" });
  };

  const cancelEdit = (e) => {
    if (e) e.stopPropagation();
    setEditingId(null);
    setEditForm({});
  };

  const handleInputChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e, id) => {
    if (e) e.stopPropagation();
    if (!editForm.batch_code?.trim() || !editForm.session_year?.trim()) {
      setNotification({
        type: "error",
        message: "Batch Code and Session Year cannot be empty.",
      });
      return;
    }

    setActionLoading(id);
    setNotification({ type: "", message: "" });
    try {
      const res = await updateBatch(id, editForm);
      if (res.success && res.data) {
        setNotification({
          type: "success",
          message: `Batch "${res.data.batch_code}" updated successfully!`,
        });
        const updatedList = batches.map((item) =>
          item.id === id ? res.data : item,
        );
        setBatches(orderBatches(updatedList));
        setEditingId(null);
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to save updates.",
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "An error occurred while saving batch updates.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (e, id, code) => {
    if (e) e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to permanently delete batch "${code}"?`,
      )
    ) {
      return;
    }

    setActionLoading(id);
    try {
      const res = await deleteBatch(id);
      if (res.success) {
        setNotification({
          type: "success",
          message: `Batch "${code}" deleted successfully.`,
        });
        setBatches((prev) => prev.filter((item) => item.id !== id));
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to delete batch.",
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "An unexpected error occurred while deleting.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Student Modal Handlers
  const handleOpenStudentsModal = async (batch) => {
    setSelectedBatchForStudents(batch);
    setStudentModalTab("list");
    setStudentsLoading(true);
    setDataToInsert([]);
    setStudentSearchQuery("");
    try {
      const res = await fetchStudent(batch.id);
      if (res.success && res.data) {
        setAssignedStudents(res.data);
      } else {
        setAssignedStudents([]);
        if (res.error) {
          setNotification({
            type: "error",
            message: `Failed to fetch students: ${res.error}`,
          });
        }
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "An error occurred while fetching assigned students.",
      });
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleCloseStudentsModal = () => {
    setSelectedBatchForStudents(null);
    setAssignedStudents([]);
    setDataToInsert([]);
    setStudentSearchQuery("");
  };

  const insertRow = () => {
    setDataToInsert((prevData) => [
      ...prevData,
      {
        student_id: null,
        name: "",
        c_roll_number: "",
        u_roll_number: "",
        phone: "",
        email: "",
        parent_name: "",
      },
    ]);
  };

  const removeRow = (indexToRemove) => {
    setDataToInsert((prevData) =>
      prevData.filter((_, idx) => idx !== indexToRemove),
    );
  };

  const updateStudentRow = (index, field, value) => {
    setDataToInsert((prevData) =>
      prevData.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        if (field === "student_id") {
          const matchedStudent = allStudents.find((s) => s.id === value);
          if (matchedStudent) {
            return {
              ...row,
              student_id: matchedStudent.id,
              name: matchedStudent.name,
              c_roll_number: matchedStudent.c_roll_number,
              u_roll_number: matchedStudent.u_roll_number,
              phone: matchedStudent.phone,
              email: matchedStudent.email,
              parent_name: matchedStudent.parent_name,
            };
          }
        }
        return { ...row, [field]: value };
      }),
    );
  };

  const handleSubmitStudentAssignments = async () => {
    if (!selectedBatchForStudents) return;

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
        message: "Please add at least one student row to enroll.",
      });
      return;
    }

    const hasEmpty = dataToInsert.some((r) => r.student_id == null);
    if (hasEmpty) {
      setNotification({
        type: "error",
        message:
          "Cannot submit: One or more rows contain empty selections. Please select a valid student for each row or remove empty rows.",
      });
      return;
    }

    const ids = dataToInsert.map((item) => item.student_id);
    if (new Set(ids).size !== ids.length) {
      setNotification({
        type: "error",
        message:
          "Duplicate values detected: The same student is selected in multiple rows. Please remove duplicate entries before submitting.",
      });
      return;
    }

    const alreadyEnrolled = dataToInsert.find((r) =>
      assignedStudents.some((existing) => existing.student_id === r.student_id),
    );
    if (alreadyEnrolled) {
      setNotification({
        type: "error",
        message: `Duplicate entry: "${alreadyEnrolled.name || "Selected student"}" is already enrolled in this batch.`,
      });
      return;
    }

    setIsSubmittingStudents(true);
    setNotification({ type: "", message: "" });
    try {
      const payload = dataToInsert.map((item) => ({
        student_id: item.student_id,
        batch_id: selectedBatchForStudents.id,
      }));

      const result = await submitStudentBatches(payload);
      setIsSubmittingStudents(false);

      if (result.success) {
        setNotification({
          type: "success",
          message: `Successfully enrolled ${dataToInsert.length} student(s) into batch "${selectedBatchForStudents.batch_code}"!`,
        });
        setDataToInsert([]);
        setStudentModalTab("list");
        setStudentsLoading(true);
        const res = await fetchStudent(selectedBatchForStudents.id);
        if (res.success && res.data) {
          setAssignedStudents(res.data);
        }
        setStudentsLoading(false);
      } else {
        setNotification({
          type: "error",
          message:
            result.error || "Failed to save student enrollments to database.",
        });
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      setIsSubmittingStudents(false);
      setNotification({
        type: "error",
        message:
          "An unexpected error occurred during enrollment. Please try again.",
      });
    }
  };

  const handleRemoveAssignedStudent = async (studentId, studentName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove "${studentName || "student"}" from batch "${selectedBatchForStudents?.batch_code}"?`,
      )
    ) {
      return;
    }

    setActionLoading(`remove-${studentId}`);
    try {
      const res = await removeStudentFromBatch(
        studentId,
        selectedBatchForStudents.id,
      );
      if (res.success) {
        setNotification({
          type: "success",
          message: `Removed "${studentName}" from batch "${selectedBatchForStudents.batch_code}".`,
        });
        setAssignedStudents((prev) =>
          prev.filter((item) => item.id !== studentId),
        );
      } else {
        setNotification({
          type: "error",
          message: res.error || "Failed to remove student from batch.",
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: "An unexpected error occurred while removing the student.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Filter visible batches based on text search box
  const filteredBatches = batches.filter((batch) => {
    const q = searchQuery.toLowerCase();
    return (
      (batch.batch_code && batch.batch_code.toLowerCase().includes(q)) ||
      (batch.branch && batch.branch.toLowerCase().includes(q)) ||
      (batch.course && batch.course.toLowerCase().includes(q)) ||
      (batch.room_no && batch.room_no.toLowerCase().includes(q))
    );
  });

  // Filter assigned students in modal based on search query
  const filteredAssignedStudents = assignedStudents.filter((student) => {
    const q = studentSearchQuery.toLowerCase();
    return (
      (student.name && student.name.toLowerCase().includes(q)) ||
      (student.c_roll_number &&
        String(student.c_roll_number).toLowerCase().includes(q)) ||
      (student.u_roll_number &&
        String(student.u_roll_number).toLowerCase().includes(q)) ||
      (student.email && student.email.toLowerCase().includes(q)) ||
      (student.phone && String(student.phone).toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status) => {
    const s = (status || "active").toLowerCase();
    if (s === "active") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Active
        </span>
      );
    }
    if (s === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <BookmarkCheck className="w-3.5 h-3.5 text-blue-600" />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        Inactive
      </span>
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50 space-y-8 relative">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Layers className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Administration
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Manage Batches & Enrollments
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Review academic batches, click any batch row or student button to
            view and modify assigned students, or update batch metadata.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-xs hover:border-gray-400 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-600 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh Data</span>
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

      {/* Filter and Search Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Filter Controls
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Session Year Filter
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={sessionYearFilter}
                onChange={(e) => setSessionYearFilter(e.target.value)}
                placeholder="e.g. 2025-2026 (or leave empty for all)"
                className="border border-gray-300 rounded-xl pl-10 pr-4 py-2 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
              />
            </div>
            <p className="text-xs text-gray-400">
              Enter academic session year or clear to display all sessions
            </p>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Search Batches
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visible records by Batch Code, Branch, Course, or Room No..."
                className="border border-gray-300 rounded-xl pl-10 pr-4 py-2 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
              />
            </div>
            <p className="text-xs text-gray-400">
              Showing {filteredBatches.length} of {batches.length} fetched batch
              record(s) —{" "}
              <span className="font-semibold text-blue-600">
                Click a row to view assigned students
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Batches Table Section */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden pb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 border-r border-gray-200 w-[16%]">
                  Batch Code
                </th>
                <th className="py-3.5 px-4 border-r border-gray-200 w-[14%]">
                  Session Year
                </th>
                <th className="py-3.5 px-3 border-r border-gray-200 w-[9%] text-center">
                  Semester
                </th>
                <th className="py-3.5 px-4 border-r border-gray-200 w-[15%]">
                  Branch
                </th>
                <th className="py-3.5 px-4 border-r border-gray-200 w-[14%]">
                  Course
                </th>
                <th className="py-3.5 px-4 border-r border-gray-200 w-[10%]">
                  Room No.
                </th>
                <th className="py-3.5 px-4 border-r border-gray-200 w-[10%] text-center">
                  Status
                </th>
                <th className="py-3.5 px-4 w-[12%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-sm font-medium">
                        Loading academic batches...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => {
                  const isEditing = editingId === batch.id;
                  const isBusy = actionLoading === batch.id;

                  return (
                    <tr
                      key={batch.id}
                      onClick={() =>
                        !isEditing && handleOpenStudentsModal(batch)
                      }
                      className={`transition-colors ${
                        isEditing
                          ? "bg-blue-50/40 font-normal"
                          : "hover:bg-blue-50/50 cursor-pointer"
                      }`}
                    >
                      {/* Batch Code */}
                      <td className="p-3 border-r border-gray-200 font-semibold text-gray-900 align-middle">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.batch_code || ""}
                            onChange={(e) =>
                              handleInputChange("batch_code", e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-normal shadow-2xs"
                            placeholder="Code"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            <span className="text-blue-900 group-hover:text-blue-600 transition-colors">
                              {batch.batch_code || "—"}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Session Year */}
                      <td className="p-3 border-r border-gray-200 text-gray-700 align-middle">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.session_year || ""}
                            onChange={(e) =>
                              handleInputChange("session_year", e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                            placeholder="2025-2026"
                          />
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {batch.session_year || "—"}
                          </span>
                        )}
                      </td>

                      {/* Semester */}
                      <td className="p-3 border-r border-gray-200 text-gray-700 align-middle text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={editForm.semester || ""}
                            onChange={(e) =>
                              handleInputChange("semester", e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                          />
                        ) : (
                          batch.semester || "—"
                        )}
                      </td>

                      {/* Branch */}
                      <td className="p-3 border-r border-gray-200 text-gray-700 align-middle">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.branch || ""}
                            onChange={(e) =>
                              handleInputChange("branch", e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                            placeholder="Branch"
                          />
                        ) : (
                          batch.branch || "—"
                        )}
                      </td>

                      {/* Course */}
                      <td className="p-3 border-r border-gray-200 text-gray-700 align-middle">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.course || ""}
                            onChange={(e) =>
                              handleInputChange("course", e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                            placeholder="Course"
                          />
                        ) : (
                          batch.course || "—"
                        )}
                      </td>

                      {/* Room No */}
                      <td className="p-3 border-r border-gray-200 text-gray-700 align-middle">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.room_no || ""}
                            onChange={(e) =>
                              handleInputChange("room_no", e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                            placeholder="Room"
                          />
                        ) : (
                          batch.room_no || "—"
                        )}
                      </td>

                      {/* Status Dropdown / Badge */}
                      <td className="p-3 border-r border-gray-200 align-middle text-center">
                        {isEditing ? (
                          <select
                            value={editForm.status || "active"}
                            onChange={(e) =>
                              handleInputChange("status", e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs cursor-pointer"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="completed">Completed</option>
                          </select>
                        ) : (
                          getStatusBadge(batch.status)
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="p-2.5 align-middle text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isBusy ? (
                          <div className="flex justify-center items-center">
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          </div>
                        ) : isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={(e) => handleSave(e, batch.id)}
                              title="Save Changes"
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </button>
                            <button
                              onClick={(e) => cancelEdit(e)}
                              title="Cancel Edit"
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
                            >
                              <X className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenStudentsModal(batch);
                              }}
                              title="View & Manage Assigned Students"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition shadow-2xs"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Students</span>
                            </button>
                            <button
                              onClick={(e) => startEdit(e, batch)}
                              title="Edit All Attributes"
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) =>
                                handleDelete(e, batch.id, batch.batch_code)
                              }
                              title="Delete Batch Record"
                              className="p-1.5 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
                  <td colSpan={8} className="py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
                        <Filter className="w-6 h-6" />
                      </div>
                      <p className="text-base font-semibold text-gray-700">
                        No batch records found
                      </p>
                      <p className="text-xs text-gray-500 max-w-sm">
                        No batches matched session year &ldquo;
                        {sessionYearFilter}&rdquo; or your current search
                        filters. Try clearing the filter above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Management Modal / Drawer */}
      {selectedBatchForStudents && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gray-900 text-white p-6 pb-4 shrink-0 border-b border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1 border border-blue-500/30">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Student Enrollment Management</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                    <span>Batch: {selectedBatchForStudents.batch_code}</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300 mt-1">
                    <span className="bg-gray-800 px-2.5 py-0.5 rounded-md text-xs font-medium text-gray-300 border border-gray-700">
                      Session: {selectedBatchForStudents.session_year || "—"}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-white">
                        {selectedBatchForStudents.course}
                      </strong>{" "}
                      in{" "}
                      <strong className="text-white">
                        {selectedBatchForStudents.branch}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Semester {selectedBatchForStudents.semester || "1"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCloseStudentsModal}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition"
                  title="Close Modal"
                >
                  <X className="w-6 h-6 stroke-[2.5]" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setStudentModalTab("list")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition ${
                    studentModalTab === "list"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Enrolled Students</span>
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      studentModalTab === "list"
                        ? "bg-blue-800 text-white"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {assignedStudents.length}
                  </span>
                </button>
                <button
                  onClick={() => setStudentModalTab("enroll")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition ${
                    studentModalTab === "enroll"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Enroll New Students</span>
                  {dataToInsert.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white animate-pulse">
                      {dataToInsert.length} queued
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {studentModalTab === "list" ? (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        Currently Assigned Students
                      </h3>
                      <p className="text-xs text-gray-500">
                        View all students currently enrolled in this batch or
                        unassign them if needed.
                      </p>
                    </div>
                    <div className="relative w-full md:w-80">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        placeholder="Filter by Name, Roll No, Phone..."
                        className="border border-gray-300 rounded-xl pl-9 pr-4 py-2 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  {/* Assigned Students Table */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead>
                          <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <th className="py-3 px-4 border-r border-gray-200 w-1/4">
                              Student Name
                            </th>
                            <th className="py-3 px-3.5 border-r border-gray-200 w-1/8">
                              College Roll No
                            </th>
                            <th className="py-3 px-3.5 border-r border-gray-200 w-1/8">
                              Univ Roll No
                            </th>
                            <th className="py-3 px-3.5 border-r border-gray-200 w-1/6">
                              Mobile No
                            </th>
                            <th className="py-3 px-3.5 border-r border-gray-200 w-1/5">
                              Email
                            </th>
                            <th className="py-3 px-3.5 border-r border-gray-200 w-1/6">
                              Parent Name
                            </th>
                            <th className="py-3 px-3 text-center w-20">
                              Remove
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                          {studentsLoading ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="py-16 text-center text-gray-500"
                              >
                                <div className="flex flex-col items-center justify-center gap-3">
                                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                  <p className="text-sm font-medium">
                                    Loading enrolled students...
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : filteredAssignedStudents.length > 0 ? (
                            filteredAssignedStudents.map((student) => {
                              const isRemoving =
                                actionLoading === `remove-${student.id}`;
                              return (
                                <tr
                                  key={student.id}
                                  className="hover:bg-gray-50/70 transition-colors"
                                >
                                  <td className="p-3.5 border-r border-gray-200 font-semibold text-gray-900 align-middle">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                                        {(student.name || "U")
                                          .charAt(0)
                                          .toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="text-gray-900">
                                          {student.name || "Unnamed Student"}
                                        </div>
                                        {/* <div className="text-xs font-normal text-gray-500">ID: #{student.id}</div> */}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3.5 border-r border-gray-200 text-gray-700 font-medium align-middle">
                                    <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs font-mono">
                                      {student.c_roll_number || "—"}
                                    </span>
                                  </td>
                                  <td className="p-3.5 border-r border-gray-200 text-gray-700 font-medium align-middle">
                                    <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs font-mono">
                                      {student.u_roll_number || "—"}
                                    </span>
                                  </td>
                                  <td className="p-3.5 border-r border-gray-200 text-gray-700 align-middle">
                                    {student.phone || "—"}
                                  </td>
                                  <td className="p-3.5 border-r border-gray-200 text-gray-600 align-middle truncate max-w-[200px]">
                                    {student.email || "—"}
                                  </td>
                                  <td className="p-3.5 border-r border-gray-200 text-gray-700 align-middle">
                                    {student.parent_name || "—"}
                                  </td>
                                  <td className="p-3 text-center align-middle">
                                    {isRemoving ? (
                                      <Loader2 className="w-4 h-4 text-rose-600 animate-spin mx-auto" />
                                    ) : (
                                      <button
                                        onClick={() =>
                                          handleRemoveAssignedStudent(
                                            student.id,
                                            student.name,
                                          )
                                        }
                                        title="Remove Student from Batch"
                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      >
                                        <Trash2 className="w-4 h-4 mx-auto" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td
                                colSpan={7}
                                className="py-16 text-center text-gray-500"
                              >
                                <div className="flex flex-col items-center justify-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                                    <Users className="w-6 h-6" />
                                  </div>
                                  <p className="text-base font-semibold text-gray-800">
                                    {assignedStudents.length === 0
                                      ? "No students assigned to this batch"
                                      : "No matching enrolled students found"}
                                  </p>
                                  <p className="text-xs text-gray-500 max-w-sm">
                                    {assignedStudents.length === 0
                                      ? "Switch to the '+ Enroll New Students' tab above to start enrolling students into this batch."
                                      : `No students matched your search query "${studentSearchQuery}". Try clearing the filter.`}
                                  </p>
                                  {assignedStudents.length === 0 && (
                                    <button
                                      onClick={() =>
                                        setStudentModalTab("enroll")
                                      }
                                      className="mt-2 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm"
                                    >
                                      <UserPlus className="w-4 h-4" />
                                      <span>Enroll Students Now</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab 2: Enroll New Students */
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        Enroll New Students into Batch &ldquo;
                        {selectedBatchForStudents.batch_code}&rdquo;
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Search across all registered database students by Name,
                        College Roll No, Univ Roll No, Phone, Email, or Parent
                        Name.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={insertRow}
                        className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-xl text-sm transition shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-blue-600" />
                        <span>Add Student Row</span>
                      </button>
                      <button
                        onClick={handleSubmitStudentAssignments}
                        disabled={
                          isSubmittingStudents || dataToInsert.length === 0
                        }
                        className={`inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition shadow-sm cursor-pointer ${
                          isSubmittingStudents || dataToInsert.length === 0
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {isSubmittingStudents ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Submit Assignments</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Enrollment Table */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-visible p-2 md:p-4 pb-40">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <th className="py-3 px-3.5 border-r border-gray-200 w-1/4">
                            Search & Select Student
                          </th>
                          <th className="py-3 px-3 border-r border-gray-200 w-1/8">
                            College Roll No
                          </th>
                          <th className="py-3 px-3 border-r border-gray-200 w-1/8">
                            Univ Roll No
                          </th>
                          <th className="py-3 px-3 border-r border-gray-200 w-1/6">
                            Mobile No
                          </th>
                          <th className="py-3 px-3 border-r border-gray-200 w-1/5">
                            Email
                          </th>
                          <th className="py-3 px-3 border-r border-gray-200 w-1/6">
                            Parent Name
                          </th>
                          <th className="py-3 px-3 text-center w-14">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-sm">
                        {dataToInsert.length > 0 ? (
                          dataToInsert.map((row, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-50/40 transition-colors"
                            >
                              <td className="p-2.5 border-r border-gray-200 align-top">
                                <SearchAbleDropdown
                                  options={allStudents}
                                  searchFor={[
                                    "name",
                                    "c_roll_number",
                                    "u_roll_number",
                                    "phone",
                                    "email",
                                    "parent_name",
                                  ]}
                                  insert={{ student_id: "id" }}
                                  setDataToInsert={setDataToInsert}
                                  index={index}
                                  updateRow={updateStudentRow}
                                  mode="option"
                                  placeholder="Type Name, Roll No, Phone..."
                                />
                              </td>
                              <td className="p-3 border-r border-gray-200 text-gray-700 font-medium align-middle">
                                <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs font-mono">
                                  {row.c_roll_number || "—"}
                                </span>
                              </td>
                              <td className="p-3 border-r border-gray-200 text-gray-700 font-medium align-middle">
                                <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs font-mono">
                                  {row.u_roll_number || "—"}
                                </span>
                              </td>
                              <td className="p-3 border-r border-gray-200 text-gray-700 align-middle">
                                {row.phone || "—"}
                              </td>
                              <td className="p-3 border-r border-gray-200 text-gray-600 align-middle truncate max-w-[180px]">
                                {row.email || "—"}
                              </td>
                              <td className="p-3 border-r border-gray-200 text-gray-700 align-middle">
                                {row.parent_name || "—"}
                              </td>
                              <td className="p-2.5 text-center align-middle">
                                <button
                                  onClick={() => removeRow(index)}
                                  title="Remove Row"
                                  className="text-gray-400 hover:text-rose-600 transition font-bold p-1.5 rounded-lg hover:bg-rose-50"
                                >
                                  <X className="w-4 h-4 stroke-[2.5] mx-auto" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-16 text-center text-gray-400 font-medium"
                            >
                              <div className="flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                                  <UserPlus className="w-6 h-6" />
                                </div>
                                <p className="text-base font-semibold text-gray-700">
                                  No student enrollment rows queued
                                </p>
                                <p className="text-xs text-gray-500 max-w-sm">
                                  Click &ldquo;+ Add Student Row&rdquo; above to
                                  start selecting and assigning students to this
                                  batch.
                                </p>
                                <button
                                  onClick={insertRow}
                                  className="mt-2 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>+ Add First Student Row</span>
                                </button>
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

            {/* Modal Footer */}
            <div className="bg-gray-100 px-6 py-4 border-t border-gray-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500">
                Changes made in this panel affect actual live academic database
                records.
              </span>
              <button
                onClick={handleCloseStudentsModal}
                className="px-5 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 font-semibold text-sm text-gray-700 transition shadow-2xs cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBatchesPage;