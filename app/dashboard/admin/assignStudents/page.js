"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { fetchBatches } from "@/app/action/fetchForFacultyAllocation";
import { fetchAllStudents } from "@/app/action/fetchAllStudents";
import { submitStudentBatches } from "@/app/action/submitStudentBatches";
import SearchAbleDropdown from "@/app/component/SearchableDropdown";

const Page = () => {
  const [dataToInsert, setDataToInsert] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });

  const { register, watch } = useForm({
    defaultValues: {
      sessionYear: "2025-2026",
    },
  });

  const sessionYear = watch("sessionYear");

  useEffect(() => {
    async function loadInitialData() {
      const studentRes = await fetchAllStudents();
      if (studentRes.success && studentRes.data) {
        setAllStudents(studentRes.data);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadBatches() {
      if (!sessionYear || sessionYear.trim() === "") {
        setAllBatches([]);
        return;
      }
      const batchRes = await fetchBatches(sessionYear.trim());
      if (batchRes.success && batchRes.data) {
        setAllBatches(batchRes.data);
      } else {
        setAllBatches([]);
      }
    }
    loadBatches();
  }, [sessionYear]);

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
    setDataToInsert((prevData) => prevData.filter((_, idx) => idx !== indexToRemove));
  };

  const updateRow = (index, field, value) => {
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
      })
    );
  };

  const handleSessmit = async () => {
    setNotification({ type: "", message: "" });
    if (!selectedBatchId) {
      setNotification({
        type: "error",
        message: "Please select a target batch before submitting assignments.",
      });
      return;
    }

    const validRows = dataToInsert.filter((r) => r.student_id != null);
    if (validRows.length === 0) {
      setNotification({
        type: "error",
        message: "Please add and select at least one valid student to assign.",
      });
      return;
    }

    setIsSubmitting(true);
    const payload = validRows.map((item) => ({
      student_id: item.student_id,
      batch_id: parseInt(selectedBatchId, 10),
      status: "active",
    }));

    const result = await submitStudentBatches(payload);
    setIsSubmitting(false);

    if (result.success) {
      setNotification({
        type: "success",
        message: `Successfully enrolled ${validRows.length} student(s) into the batch!`,
      });
      setDataToInsert([]);
    } else {
      setNotification({
        type: "error",
        message: result.error || "Failed to submit student assignments.",
      });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Assign Students to Batches</h1>
        <p className="text-sm text-gray-600 mt-1">
          Search and enroll students into specific course batches for an academic session year
        </p>
      </div>

      {notification.message && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification({ type: "", message: "" })}
            className="font-bold text-lg leading-none p-1 opacity-70 hover:opacity-100 transition"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">
          1. Select Session Year & Target Batch
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Session Year
            </label>
            <input
              type="text"
              placeholder="e.g. 2025-2026"
              className="border border-gray-300 rounded-lg px-3.5 py-2 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
              {...register("sessionYear")}
            />
            <p className="text-xs text-gray-500">Enter year to filter batches dynamically</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Target Batch
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3.5 py-2 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
            >
              <option value="">-- Select a Batch --</option>
              {allBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batch_code} (Sem: {batch.semester}, {batch.course} - {batch.branch})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              {allBatches.length > 0
                ? `Found ${allBatches.length} batch(es) for session year ${sessionYear}`
                : "No batches available for this session year"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-visible space-y-4 p-6 pb-40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">2. Select Students</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Search by student Name, College Roll No, University Roll No, Phone, Email, or Parent Name
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={insertRow}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm transition shadow-xs"
            >
              + Add Student Row
            </button>
            <button
              onClick={handleSessmit}
              disabled={isSubmitting}
              className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow-sm ${
                isSubmitting ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Assignments"}
            </button>
          </div>
        </div>

        <div className="overflow-visible border border-gray-200 rounded-lg">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-3.5 border-r border-gray-200 w-1/4">Search & Select Student</th>
                <th className="py-3 px-3 border-r border-gray-200 w-1/8">College Roll No</th>
                <th className="py-3 px-3 border-r border-gray-200 w-1/8">Univ Roll No</th>
                <th className="py-3 px-3 border-r border-gray-200 w-1/8">Mobile No</th>
                <th className="py-3 px-3 border-r border-gray-200 w-1/6">Email</th>
                <th className="py-3 px-3 border-r border-gray-200 w-1/6">Parent Name</th>
                <th className="py-3 px-3 text-center w-12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {dataToInsert.length > 0 ? (
                dataToInsert.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50/40 transition-colors">
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
                        updateRow={updateRow}
                        mode="option"
                        placeholder="Type Name, Roll No, Phone..."
                      />
                    </td>
                    <td className="p-3 border-r border-gray-200 text-gray-700 font-medium align-middle">
                      {row.c_roll_number || "—"}
                    </td>
                    <td className="p-3 border-r border-gray-200 text-gray-700 font-medium align-middle">
                      {row.u_roll_number || "—"}
                    </td>
                    <td className="p-3 border-r border-gray-200 text-gray-700 align-middle">
                      {row.phone || "—"}
                    </td>
                    <td className="p-3 border-r border-gray-200 text-gray-700 align-middle truncate max-w-[150px]">
                      {row.email || "—"}
                    </td>
                    <td className="p-3 border-r border-gray-200 text-gray-700 align-middle">
                      {row.parent_name || "—"}
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
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400 font-medium">
                    No student rows added yet. Click &ldquo;+ Add Student Row&rdquo; above to begin adding students.
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
