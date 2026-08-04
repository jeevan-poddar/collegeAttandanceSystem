"use client";
import {
  fetchBatches,
  fetchFaculty,
  fetchSubject,
} from "@/app/action/fetchForFacultyAllocation";
import SearchAbleDropdown from "@/app/component/SearchableDropdown";
import { useForm } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { submitTimeTable } from "@/app/action/submitTimeTable";

const page = () => {
  const [dataToInsert, setDataToInsert] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
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
        batch_id: null,
        subject_id: null,
        faculty_id: null,
        day_of_week: 1,
        period_number: null,
        room_no: null,
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
  const duplicateRow = (indexToDuplicate) => {
    setDataToInsert((prevData) => {
      const rowToDuplicate = prevData[indexToDuplicate];

      if (!rowToDuplicate) return prevData;

      const duplicatedRow = { ...rowToDuplicate };

      return [
        ...prevData.slice(0, indexToDuplicate + 1),
        duplicatedRow,
        ...prevData.slice(indexToDuplicate + 1),
      ];
    });
  };
  const getSelectedLabel = (options, matchField, matchValue, labelField) => {
    const matchedOption = options.find(
      (option) => option?.[matchField] === matchValue,
    );

    return matchedOption?.[labelField] || "";
  };
  useEffect(() => {
    async function fetchData() {
      const facultyData = await fetchFaculty();
      setAllFaculty(facultyData.data);
      const batchesData = await fetchBatches(sessionYear);
      setAllBatches(batchesData.data);
      const subjectsData = await fetchSubject();
      setAllSubjects(subjectsData.data);
    }
    fetchData();
  }, [sessionYear]);
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Timetable Configuration
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Schedule lectures, weekly days, periods, and room assignments
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              defaultValue={"2025-2026"}
              placeholder="Session Year (e.g. 2025-2026)"
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
            onClick={() => submitTimeTable(dataToInsert)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow-sm"
          >
            Submit Timetable
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-visible pb-32">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse min-w-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-3.5 border-r border-gray-200 w-1/6">
                  Batch Code
                </th>
                <th className="py-3 px-3.5 border-r border-gray-200 w-1/6">
                  Subject Code
                </th>
                <th className="py-3 px-3.5 border-r border-gray-200 w-1/6">
                  Faculty Name
                </th>
                <th className="py-3 px-3.5 border-r border-gray-200 w-1/6">
                  Day
                </th>
                <th className="py-3 px-3.5 border-r border-gray-200 w-1/6">
                  Period No.
                </th>
                <th className="py-3 px-3.5 w-1/6 border-r border-gray-200">
                  Room No.
                </th>
                <th className="py-3 px-3.5 w-1/6">Actions</th>
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
                        options={allBatches}
                        searchFor={["batch_code"]}
                        insert={{
                          batch_id: "id",
                        }}
                        defaultValue={getSelectedLabel(
                          allBatches,
                          "id",
                          row.batch_id,
                          "batch_code",
                        )}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        updateRow={updateRow}
                        mode="option"
                        placeholder="Select Batch"
                      />
                    </td>
                    <td className="p-2.5 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={allSubjects}
                        searchFor={["subject_code"]}
                        insert={{
                          subject_id: "id",
                        }}
                        defaultValue={getSelectedLabel(
                          allSubjects,
                          "id",
                          row.subject_id,
                          "subject_code",
                        )}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        updateRow={updateRow}
                        mode="option"
                        placeholder="Select Subject"
                      />
                    </td>
                    <td className="p-2.5 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={allFaculty}
                        searchFor={["name"]}
                        insert={{
                          faculty_id: "id",
                        }}
                        defaultValue={getSelectedLabel(
                          allFaculty,
                          "id",
                          row.faculty_id,
                          "name",
                        )}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        updateRow={updateRow}
                        mode="option"
                        placeholder="Select Faculty"
                      />
                    </td>
                    <td className="p-2.5 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={[
                          { day: "Monday", day_of_week: 1 },
                          { day: "Tuesday", day_of_week: 2 },
                          { day: "Wednesday", day_of_week: 3 },
                          { day: "Thursday", day_of_week: 4 },
                          { day: "Friday", day_of_week: 5 },
                          { day: "Saturday", day_of_week: 6 },
                          { day: "Sunday", day_of_week: 7 },
                        ]}
                        searchFor={["day"]}
                        insert={{
                          day_of_week: "day_of_week",
                        }}
                        defaultValue={getSelectedLabel(
                          [
                            { day: "Monday", day_of_week: 1 },
                            { day: "Tuesday", day_of_week: 2 },
                            { day: "Wednesday", day_of_week: 3 },
                            { day: "Thursday", day_of_week: 4 },
                            { day: "Friday", day_of_week: 5 },
                            { day: "Saturday", day_of_week: 6 },
                            { day: "Sunday", day_of_week: 7 },
                          ],
                          "day_of_week",
                          row.day_of_week,
                          "day",
                        )}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        updateRow={updateRow}
                        mode="option"
                        placeholder="Select Day"
                      />
                    </td>
                    <td className="p-2.5 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={[]}
                        searchFor={["period_number"]}
                        insert={{
                          period_number: "period_number",
                        }}
                        defaultValue={row.period_number ?? ""}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        updateRow={updateRow}
                        mode="custom"
                        placeholder="Period No."
                      />
                    </td>
                    <td className="p-2.5 align-to border-r border-gray-200">
                      <SearchAbleDropdown
                        options={[]}
                        searchFor={["room_no"]}
                        insert={{
                          room_no: "room_no",
                        }}
                        defaultValue={row.room_no ?? ""}
                        setDataToInsert={setDataToInsert}
                        index={index}
                        updateRow={updateRow}
                        mode="custom"
                        placeholder="Room No."
                      />
                    </td>
                    <td className="p-2.5 text-center align-middle">
                      <button
                        onClick={() => duplicateRow(index)}
                        title="Duplicate Row"
                        className="mr-2 text-gray-400 hover:text-blue-600 transition font-bold p-1 rounded-md"
                      >
                        ⎘
                      </button>
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
                    No timetable slots added yet. Click &ldquo;+ Add Row&rdquo;
                    above to get started.
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
