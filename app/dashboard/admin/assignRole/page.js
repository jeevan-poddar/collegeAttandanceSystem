"use client";

import React, { useEffect, useState } from "react";
import SearchAbleDropdown from "@/app/component/SearchableDropdown";
import { callWithRole } from "@/app/utlis/callWithRole";
import { useSelector } from "react-redux";
import {
  fetchDepartments as fetchDepartmentsAction,
  fetchUnkownUsers,
  submitStudentAndUpdateUserRole,
} from "@/app/action/assignRole/all";

const AssignRolePage = () => {
  const [role, setRole] = useState("student");
  const [duration, setduration] = useState(30);
  const [dataToInsert, setDataToInsert] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [unknownUsers, setUnknownUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const roleRedux = useSelector((state) => state.user.role);

  useEffect(() => {
    let isMounted = true;

    const loadDepartments = async () => {
      if (!roleRedux) return;

      try {
        setLoading(true);
        const response = await callWithRole(
          roleRedux,
          ["admin"],
          fetchDepartmentsAction,
        );

        if (!isMounted) return;

        if (response.success) {
          setDepartments(response.departments || []);
          console.log("Departments loaded:", response.departments);
          setError(null);
        } else {
          setError(response.error || "Failed to fetch departments.");
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching departments:", error);
        setError("Failed to fetch departments.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDepartments();

    return () => {
      isMounted = false;
    };
  }, [roleRedux]);

  useEffect(() => {
    let isMounted = true;

    const loadUnknownUsers = async () => {
      try {
        if (!roleRedux || duration === "") {
          setUnknownUsers([]);
          return;
        }

        const durations = Number(duration);
        if (!Number.isFinite(durations) || durations < 0) {
          setUnknownUsers([]);
          return;
        }

        const response = await callWithRole(
          roleRedux,
          ["admin"],
          fetchUnkownUsers,
          duration,
        );

        if (!isMounted) return;

        if (response.success) {
          setUnknownUsers(response.unknownUsers || []);
          console.log("Unknown users loaded:", response.unknownUsers);
          setError(null);
        } else {
          setError(response.error || "Failed to fetch users.");
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching unknown users:", error);
        setError("Failed to fetch users.");
      }
    };

    loadUnknownUsers();

    return () => {
      isMounted = false;
    };
  }, [roleRedux, duration]);

  // Required actions for this page:
  // add row, remove row, update row, and submit the prepared role rows.
  const addRow = () => {
    setDataToInsert((prev) => [
      ...prev,
      {
        role: role,
        user_id: "",
        email: "",
        phone: 0,
        name: "",
        department_id:
          Number(dataToInsert[dataToInsert.length - 1]?.department_id) || 0,
        cRollNo:
          Number(dataToInsert[dataToInsert.length - 1]?.cRollNo) + 1 || 1, // Auto-incrementing C Roll No. for new rows
        parentName: "",
        parentPhone: 0,
        sessionYear: dataToInsert[dataToInsert.length - 1]?.sessionYear || "2026-2027",
      },
    ]);
  };

  const removeRow = (index) => {
    setDataToInsert((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
    setActiveRow(null);
  };

  const updateRow = (index, key, value) => {
    setDataToInsert((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  };

  const handleSubmit = async () => {
    // Placeholder action name required for this file.
    // Replace this log with the real submit action when the backend is ready.
    console.log("Submit role assignments", {
      role,
      duration,
      dataToInsert,
    });

    const response = await callWithRole(
      roleRedux,
      ["admin"],
      submitStudentAndUpdateUserRole,
      dataToInsert,
    );

    if (response.success) {
      console.log("Successfully submitted role assignments.");
      setDataToInsert([]); // Clear the form after successful submission
      setError(null);
    } else {
      console.error("Error submitting role assignments:", response.error);
      setError(response.error || "Failed to submit role assignments.");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Assign Role
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Prepare user role rows and submit them once the required data is
            filled in.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addRow}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm transition shadow-xs"
          >
            + Add Row
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition shadow-sm"
          >
            Submit
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        {loading && (
          <p className="text-sm text-gray-500">Loading departments...</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            <span>User Created times ago (in days)</span>
            <input
              type="number"
              value={duration}
              onChange={(e) => setduration(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter number of days"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            <span>Select Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="hod">Hod</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </label>
        </div>

        <div className="overflow-visible w-full">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-3.5 border-r border-gray-200">Email</th>
                <th className="py-3 px-3.5 border-r border-gray-200">Phone</th>
                {(role === "student" ||
                  role === "hod" ||
                  role === "faculty") && (
                  <>
                    <th className="py-3 px-3.5 border-r border-gray-200">
                      Official Name
                    </th>
                    <th className="py-3 px-3.5 border-r border-gray-200">
                      Department
                    </th>
                  </>
                )}
                {role === "student" && (
                  <>
                    <th className="py-3 px-3.5 border-r border-gray-200">
                      C Roll No.
                    </th>
                    <th className="py-3 px-3.5 border-r border-gray-200">
                      Parent's name
                    </th>
                    <th className="py-3 px-3.5 border-r border-gray-200">
                      Parent's phone
                    </th>
                    <th className="py-3 px-3.5 border-r border-gray-200">
                      Session Year
                    </th>
                  </>
                )}
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dataToInsert.length > 0 ? (
                dataToInsert.map((item, index) => (
                  <tr
                    key={index}
                    onFocus={() => setActiveRow(index)}
                    className="hover:bg-gray-50/40 transition-colors"
                    style={{
                      position: "relative",
                      zIndex: activeRow === index ? 50 : 1,
                    }}
                  >
                    <td className="p-2.5 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={unknownUsers}
                        searchFor={["email"]}
                        insert={{ email: "email" , user_id: "id", name: "full_name" }}
                        index={index}
                        updateRow={updateRow}
                        mode="both"
                        placeholder="Email"
                      />
                    </td>
                    <td className="p-2.5 border-r border-gray-200 align-top">
                      <SearchAbleDropdown
                        options={[]}
                        searchFor={["phone"]}
                        insert={{ phone: "phone" }}
                        index={index}
                        updateRow={updateRow}
                        mode="custom"
                        placeholder="Phone"
                      />
                    </td>
                    {(role === "student" ||
                      role === "hod" ||
                      role === "faculty") && (
                      <>
                        <td className="p-2.5 border-r border-gray-200 align-top">
                          <SearchAbleDropdown
                            options={[]}
                            searchFor={["officialName"]}
                            insert={{ name: "name" }}
                            index={index}
                            defaultValue={item.name}
                            updateRow={updateRow}
                            mode="custom"
                            placeholder="Official Name"
                          />
                        </td>
                        <td className="p-2.5 border-r border-gray-200 align-top">
                          <SearchAbleDropdown
                            options={departments}
                            searchFor={["s_name"]}
                            insert={{ department_id: "id" }}
                            index={index}
                            updateRow={updateRow}
                            mode="both"
                            placeholder="Department"
                            defaultValue={departments.find((dep) => dep.id === item.department_id)?.s_name || ""}
                          />
                        </td>
                      </>
                    )}
                    {role === "student" && (
                      <>
                        <td className="p-2.5 border-r border-gray-200 align-top">
                          <SearchAbleDropdown
                            options={[]}
                            searchFor={["cRollNo"]}
                            insert={{ cRollNo: "cRollNo" }}
                            index={index}
                            updateRow={updateRow}
                            mode="custom"
                            placeholder="C Roll No."
                            defaultValue={item.cRollNo}
                          />
                        </td>
                        <td className="p-2.5 border-r border-gray-200 align-top">
                          <input
                            type="text"
                            value={item.parentName}
                            placeholder="Parent's name"
                            onChange={(e) =>
                              updateRow(index, "parentName", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2.5 border-r border-gray-200 align-top">
                          <input
                            type="number"
                            value={item.parentPhone}
                            placeholder="Parent's phone"
                            onChange={(e) =>
                              updateRow(index, "parentPhone", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2.5 border-r border-gray-200 align-top">
                          <input
                            type="text"
                            value={item.sessionYear}
                            placeholder="Session Year"
                            onChange={(e) =>
                              updateRow(index, "sessionYear", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      </>
                    )}
                    <td className="p-2.5 align-top text-center">
                      {/* Actions: remove row */}
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={role === "student" ? 9 : 3}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No rows added yet. Use the Add Row action to begin.
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

export default AssignRolePage;
