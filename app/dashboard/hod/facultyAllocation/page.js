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

const Page = () => {
  const [dataToInsert, setDataToInsert] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
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

  useEffect(() => {
    const fetachData = async () => {
      const facultyData = await fetchFaculty();
      setAllFaculty(facultyData.data);
      const batchesData = await fetchBatches(sessionYear);
      setAllBatches(batchesData.data);
      const subjectsData = await fetchSubject();
      setAllSubjects(subjectsData.data);
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

      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              All Faculty ({allFaculty.length})
            </h2>
          </div>
          <div className="p-3.5 max-h-48 overflow-y-auto space-y-1 divide-y divide-gray-100">
            {allFaculty.length > 0 ? (
              allFaculty.map((faculty) => (
                <div
                  key={faculty.id}
                  className="py-1 text-sm font-medium text-gray-800"
                >
                  {faculty.name}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No faculty loaded</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              All Batches ({allBatches.length})
            </h2>
          </div>
          <div className="p-3.5 max-h-48 overflow-y-auto space-y-1 divide-y divide-gray-100">
            {allBatches.length > 0 ? (
              allBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="py-1 text-sm font-medium text-gray-800"
                >
                  {batch.batch_code}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No batches loaded</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              All Subjects ({allSubjects.length})
            </h2>
          </div>
          <div className="p-3.5 max-h-48 overflow-y-auto space-y-1 divide-y divide-gray-100">
            {allSubjects.length > 0 ? (
              allSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="py-1 text-sm font-medium text-gray-800"
                >
                  {subject.subject_name}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No subjects loaded</p>
            )}
          </div>
        </div>
      </div> */}

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
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm transition shadow-xs"
            >
              + Add Row
            </button>
            <button
              onClick={() => {
                submitFacultyAllocation(dataToInsert);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow-sm"
            >
              Submit Allocation
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
              {dataToInsert.length > 0 ? (
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
