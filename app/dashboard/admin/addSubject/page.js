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
  useEffect(() => {
    async function fetchData() {
      const subjectsData = await fetchSubject();
      setallSubjects(subjectsData.data);
    }
    fetchData();
  }, []);
  return (
    <div>
      <div className="">
        <h1>Add Subject</h1>
        <button onClick={insertRow}>Add more</button>
        <button onClick={() => submitSubject(dataToInsert)}>Submit</button>
      </div>
      <div className="w-full border-collapse border border-gray-300">
        <div className="border border-gray-300 p-2 flex">
          <div className="border border-gray-300 p-2">Subject CODE</div>
          <div className="border border-gray-300 p-2">Subject NAME</div>
        </div>
        <div className="border border-gray-300 p-2">
          {dataToInsert.map((row, index) => (
            <div className=" flex " key={index}>
              <div className="border border-gray-300 p-2">
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
              </div>
              <div className="border border-gray-300 p-2">
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default page;
