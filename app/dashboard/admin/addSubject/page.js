"use client";
import { fetchSubject } from "@/app/action/fetchForFacultyAllocation";
import SearchAbleDropdown from "@/app/component/SearchableDropdown";
import { useForm } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { submitSubject } from "@/app/action/submitSubject";

const page = () => {
  const [dataToInsert, setDataToInsert] = useState([]);
  const [allSubjects, setallSubjects] = useState([]);

  const {
    register,
    watch,
    formState: { errors },
  } = useForm();

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
  useEffect(() => {
    async function fetchData() {
      const subjectsData = await fetchSubject();
      setallSubjects(subjectsData.data);
    }
    fetchData();
  }, []);
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen bg-gray-50 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Add Subjects
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure and assign new subject names and corresponding codes
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
            onClick={() => submitSubject(dataToInsert)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow-sm"
          >
            Submit Subjects
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-visible pb-32">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 border-r border-gray-200 w-1/2">
                  Subject Code
                </th>
                <th className="py-3.5 px-4 w-1/2 border-r border-gray-200">
                  Subject Name
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
                    <td className="p-3 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={allSubjects}
                        searchFor={["subject_code"]}
                        insert={{
                          subject_code: "subject_code",
                          // subject_name: "subject_name",
                        }}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        defaultValue={row.subject_code}
                        updateRow={updateRow}
                        mode="custom"
                        placeholder="Enter Subject Code"
                      />
                    </td>
                    <td className="p-3 align-top border-r border-gray-200">
                      <SearchAbleDropdown
                        options={allSubjects}
                        searchFor={["subject_name"]}
                        insert={{
                          // subject_code: "subject_code",
                          subject_name: "subject_name",
                        }}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        defaultValue={row.subject_name}
                        updateRow={updateRow}
                        mode="both"
                        placeholder="Enter Subject Name"
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
                    colSpan={3}
                    className="py-12 text-center text-sm text-gray-400 font-medium"
                  >
                    No rows added yet. Click &ldquo;+ Add Row&rdquo; to begin
                    adding subjects.
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

export default page;
