"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { callWithRole } from "@/app/utlis/callWithRole";
import {
  fetchAssignedUsers,
  fetchUserRoleDetails,
  fetchDepartmentsForEdit,
  updateUserRoleDetails,
  revokeUserRole,
} from "@/app/action/assignRole/manageRoles";

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "hod", label: "HOD" },
  { value: "faculty", label: "Faculty" },
  { value: "student", label: "Student" },
];

const ROLE_BADGE_COLORS = {
  admin: "bg-purple-100 text-purple-700",
  hod: "bg-amber-100 text-amber-700",
  faculty: "bg-blue-100 text-blue-700",
  student: "bg-green-100 text-green-700",
};

export default function ManageRolesPage() {
  const roleRedux = useSelector((state) => state.user.role);

  // List state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filter state
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Edit modal state
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Revoke/Change Role confirmation state
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState("unknown");
  const [newRoleData, setNewRoleData] = useState({});

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchDebounced(searchText);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchText]);

  // Fetch users when filters/page change
  const loadUsers = useCallback(async () => {
    if (!roleRedux) return;
    try {
      setLoading(true);
      setError(null);
      const response = await callWithRole(
        roleRedux,
        ["admin"],
        fetchAssignedUsers,
        { role: roleFilter, search: searchDebounced, page },
      );
      if (response.success) {
        setUsers(response.users || []);
        setTotalPages(response.totalPages || 1);
        setTotalCount(response.totalCount || 0);
      } else {
        setError(response.error || "Failed to fetch users.");
      }
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  }, [roleRedux, roleFilter, searchDebounced, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ─── Edit handlers ──────────────────────────────────────────────
  const openEdit = async (user) => {
    setEditingUser(user);
    setEditLoading(true);
    setEditData(null);

    try {
      const [detailsRes, deptRes] = await Promise.all([
        callWithRole(roleRedux, ["admin"], fetchUserRoleDetails, user.id),
        departments.length === 0
          ? callWithRole(roleRedux, ["admin"], fetchDepartmentsForEdit)
          : { success: true, departments },
      ]);

      if (detailsRes.success) {
        setEditData(detailsRes.roleDetails || {});
      } else {
        setError(detailsRes.error || "Failed to load user details.");
        setEditingUser(null);
      }

      if (deptRes.success && deptRes.departments) {
        setDepartments(deptRes.departments);
      }
    } catch {
      setError("Failed to load user details.");
      setEditingUser(null);
    } finally {
      setEditLoading(false);
    }
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditData(null);
  };

  const handleEditField = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editingUser || !editData) return;
    setEditSaving(true);
    try {
      const response = await callWithRole(
        roleRedux,
        ["admin"],
        updateUserRoleDetails,
        editingUser.id,
        editingUser.role,
        editData,
      );
      if (response.success) {
        setSuccessMsg("User details updated successfully.");
        closeEdit();
        loadUsers();
      } else {
        setError(response.error || "Failed to update user details.");
      }
    } catch {
      setError("Failed to update user details.");
    } finally {
      setEditSaving(false);
    }
  };

  // ─── Revoke / Change Role handlers ─────────────────────────────
  const openRevoke = async (user) => {
    setRevokeTarget(user);
    setSelectedNewRole("unknown"); // Default to unknown
    setNewRoleData({});

    if (departments.length === 0) {
      const res = await callWithRole(roleRedux, ["admin"], fetchDepartmentsForEdit);
      if (res && res.success) {
        setDepartments(res.departments);
      }
    }
  };

  const closeRevoke = () => {
    setRevokeTarget(null);
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    setRevokeLoading(true);
    
    // Determine if we are submitting data along with the role change
    const needsInput =
      (selectedNewRole === "student" || selectedNewRole === "faculty" || selectedNewRole === "hod") &&
      selectedNewRole !== revokeTarget.role &&
      !(revokeTarget.role === "hod" && selectedNewRole === "faculty");

    try {
      const response = await callWithRole(
        roleRedux,
        ["admin"],
        revokeUserRole,
        revokeTarget.id,
        revokeTarget.role,
        selectedNewRole,
        needsInput ? newRoleData : null
      );
      if (response.success) {
        setSuccessMsg(
          `Role changed from "${revokeTarget.role}" to "${selectedNewRole}" successfully.`
        );
        closeRevoke();
        loadUsers();
      } else {
        setError(response.error || "Failed to change role.");
      }
    } catch {
      setError("Failed to change role.");
    } finally {
      setRevokeLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Manage Roles
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          View, edit, and revoke assigned user roles. Search by name or email.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-600 font-bold text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3 items-end">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            <span>Filter by Role</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            <span>Search (name or email)</span>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <div className="text-sm text-gray-500 py-2">
            {totalCount} user{totalCount !== 1 ? "s" : ""} found
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-gray-500">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-500">
            No users found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                      {user.full_name || "—"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${ROLE_BADGE_COLORS[user.role] || "bg-gray-100 text-gray-700"}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.department_name || "—"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.phone || "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openRevoke(user)}
                          className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                        >
                          Change Role
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ─── Edit Modal ───────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Edit User Details
                </h2>
                <p className="text-sm text-gray-500">
                  {editingUser.full_name || editingUser.email} —{" "}
                  <span className="capitalize">{editingUser.role}</span>
                </p>
              </div>
              <button
                onClick={closeEdit}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none font-light"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {editLoading ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Loading details...
                </p>
              ) : !editData ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No role-specific data found for this user.
                </p>
              ) : (
                <>
                  {/* Common fields for student, faculty, hod */}
                  <EditField
                    label="Official Name"
                    value={editData.name || ""}
                    onChange={(v) => handleEditField("name", v)}
                  />
                  <EditField
                    label="Email"
                    value={editData.email || ""}
                    onChange={(v) => handleEditField("email", v)}
                  />
                  <EditField
                    label="Phone"
                    value={editData.phone || ""}
                    onChange={(v) => handleEditField("phone", v)}
                    type="number"
                  />

                  {/* Department dropdown */}
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                    <span>Department</span>
                    <select
                      value={editData.department_id || ""}
                      onChange={(e) =>
                        handleEditField("department_id", Number(e.target.value))
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dep) => (
                        <option key={dep.id} value={dep.id}>
                          {dep.s_name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Student-specific fields */}
                  {editingUser.role === "student" && (
                    <>
                      <EditField
                        label="C Roll Number"
                        value={editData.c_roll_number || ""}
                        onChange={(v) => handleEditField("c_roll_number", v)}
                        type="number"
                      />
                      <EditField
                        label="U Roll Number"
                        value={editData.u_roll_number || ""}
                        onChange={(v) => handleEditField("u_roll_number", v)}
                        type="number"
                      />
                      <EditField
                        label="Parent Name"
                        value={editData.parent_name || ""}
                        onChange={(v) => handleEditField("parent_name", v)}
                      />
                      <EditField
                        label="Parent Phone"
                        value={editData.parent_phone || ""}
                        onChange={(v) => handleEditField("parent_phone", v)}
                        type="number"
                      />
                      <EditField
                        label="Session Year"
                        value={editData.session_year || ""}
                        onChange={(v) => handleEditField("session_year", v)}
                        placeholder="e.g. 2026-2027"
                      />
                    </>
                  )}
                </>
              )}
            </div>

            {editData && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/50">
                <button
                  onClick={closeEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editSaving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Change Role Modal ─────────────────────────────── */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">
                Change Role — {revokeTarget.full_name || revokeTarget.email}
              </h2>
              <p className="text-sm text-gray-600">
                Current role:{" "}
                <span className="font-semibold capitalize">
                  {revokeTarget.role}
                </span>
              </p>

              <div className="space-y-4 pt-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                  <span>Select New Role</span>
                  <select
                    value={selectedNewRole}
                    onChange={(e) => setSelectedNewRole(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="hod">HOD</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                {revokeTarget.role === "student" && selectedNewRole !== "student" && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                    Warning: Changing a student's role will delete their student record data permanently.
                  </p>
                )}

                {/* Additional inputs if required */}
                {((selectedNewRole === "student" || selectedNewRole === "faculty" || selectedNewRole === "hod") && 
                  selectedNewRole !== revokeTarget.role &&
                  !(revokeTarget.role === "hod" && selectedNewRole === "faculty")) && (
                  <div className="space-y-3 mt-4 border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-semibold text-gray-800">Provide required details for {selectedNewRole}:</h3>
                    
                    <EditField
                      label="Phone"
                      type="number"
                      value={newRoleData.phone || ""}
                      onChange={(v) => setNewRoleData(prev => ({ ...prev, phone: v }))}
                    />

                    <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                      <span>Department</span>
                      <select
                        value={newRoleData.department_id || ""}
                        onChange={(e) => setNewRoleData(prev => ({ ...prev, department_id: Number(e.target.value) }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dep) => (
                          <option key={dep.id} value={dep.id}>{dep.s_name}</option>
                        ))}
                      </select>
                    </label>

                    {selectedNewRole === "student" && (
                      <>
                        <EditField
                          label="C Roll Number"
                          type="number"
                          value={newRoleData.c_roll_number || ""}
                          onChange={(v) => setNewRoleData(prev => ({ ...prev, c_roll_number: v }))}
                        />
                        <EditField
                          label="Parent Name"
                          value={newRoleData.parent_name || ""}
                          onChange={(v) => setNewRoleData(prev => ({ ...prev, parent_name: v }))}
                        />
                        <EditField
                          label="Parent Phone"
                          type="number"
                          value={newRoleData.parent_phone || ""}
                          onChange={(v) => setNewRoleData(prev => ({ ...prev, parent_phone: v }))}
                        />
                        <EditField
                          label="Session Year"
                          placeholder="e.g. 2026-2027"
                          value={newRoleData.session_year || ""}
                          onChange={(v) => setNewRoleData(prev => ({ ...prev, session_year: v }))}
                        />
                      </>
                    )}
                  </div>
                )}

                <button
                  onClick={confirmRevoke}
                  disabled={revokeLoading || selectedNewRole === revokeTarget.role}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition disabled:opacity-60"
                >
                  {revokeLoading ? "Processing..." : "Confirm Role Change"}
                </button>
              </div>
            </div>

            <div className="flex justify-end px-6 py-3 border-t border-gray-200 bg-gray-50/50">
              <button
                onClick={closeRevoke}
                disabled={revokeLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Reusable form field for the edit modal. */
function EditField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}
