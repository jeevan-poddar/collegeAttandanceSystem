"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { callWithRole } from "@/app/utlis/callWithRole";
import {
  approvePendingAttendance,
  fetchPendingAttendance,
  rejectPendingAttendance,
} from "@/app/action/attendance/managePendingAttendance";

export default function AttendanceApprovalPanel({ sessionId, role, onChange }) {
  const [pendingAttendance, setPendingAttendance] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadPendingAttendance = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    const result = await callWithRole(
      role,
      ["faculty", "hod"],
      fetchPendingAttendance,
      sessionId,
    );
    if (result.success) {
      setPendingAttendance(result.data);
      setSelectedIds((current) =>
        current.filter((id) => result.data.some((record) => record.id === id)),
      );
    } else {
      setError(result.error || "Unable to load pending attendance.");
    }
    setLoading(false);
  }, [role, sessionId]);

  useEffect(() => {
    const timer = window.setTimeout(loadPendingAttendance, 0);
    return () => window.clearTimeout(timer);
  }, [loadPendingAttendance]);

  const allSelected = pendingAttendance.length > 0 && selectedIds.length === pendingAttendance.length;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : pendingAttendance.map((record) => record.id));
  }

  function toggleRecord(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function handleDecision(action, verb) {
    if (selectedIds.length === 0 || submitting) return;
    setSubmitting(true);
    setError("");
    const result = await callWithRole(role, ["faculty", "hod"], action, sessionId, selectedIds);
    if (!result.success) {
      setError(result.error || `Unable to ${verb} attendance submissions.`);
    } else {
      setPendingAttendance((current) => current.filter((record) => !selectedIds.includes(record.id)));
      setSelectedIds([]);
      onChange?.(result);
    }
    setSubmitting(false);
  }

  return (
    <section className="mt-5 border-t border-gray-200 pt-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">QR attendance approvals</h3>
          <p className="text-xs text-gray-500 mt-0.5">Approve or reject unverified student scans for this session.</p>
        </div>
        <button type="button" onClick={loadPendingAttendance} disabled={loading || submitting} className="text-xs font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-50">
          Refresh
        </button>
      </div>

      {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}

      {loading ? (
        <div className="py-5 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-blue-600" /></div>
      ) : pendingAttendance.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-3 py-3 text-center text-xs font-medium text-gray-500">No attendance scans are waiting for approval.</p>
      ) : (
        <>
          <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs font-bold text-gray-700">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
            Select all ({pendingAttendance.length})
          </label>
          <div className="max-h-44 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
            {pendingAttendance.map((record) => {
              const student = record.students;
              const selected = selectedIds.includes(record.id);
              return (
                <label key={record.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50">
                  <input type="checkbox" checked={selected} onChange={() => toggleRecord(record.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-gray-800">{student?.name || `Student #${record.student_id}`}</span>
                    <span className="block text-xs text-gray-500">{student?.c_roll_number || "—"} {student?.u_roll_number ? `• ${student.u_roll_number}` : ""}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={submitting || selectedIds.length === 0} onClick={() => handleDecision(approvePendingAttendance, "approve")} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Accept selected
            </button>
            <button type="button" disabled={submitting || selectedIds.length === 0} onClick={() => handleDecision(rejectPendingAttendance, "reject")} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
              <XCircle className="h-4 w-4" /> Reject selected
            </button>
          </div>
        </>
      )}
    </section>
  );
}
