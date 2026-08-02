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
    <div>
      <div className="">
        <div className="">
          <h1>All Faculty </h1>
          <div className="">
            {allFaculty.map((faculty) => (
              <div key={faculty.id}>{faculty.name}</div>
            ))}
          </div>
        </div>
        <div className="">
          <h1>All Batches </h1>
          <div className="">
            {allBatches.map((batch) => (
              <div key={batch.id}>{batch.batch_code}</div>
            ))}
          </div>
        </div>
        <div className="">
          <h1>All Subjects </h1>
          <div className="">
            {allSubjects.map((subject) => (
              <div key={subject.id}>{subject.subject_name}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-gray-200 p-4">
        <h1>Faculty Allocation</h1>
        <form>
          <input type="text" placeholder="Session Year" {...register("sessionYear")} />
        </form>
        <button onClick={insertRow}>Add more</button>
        <button
          onClick={() => {
            submitFacultyAllocation(dataToInsert);
          }}
        >
          Submit
        </button>
        <div className="">
          <div className="w-full border-collapse border border-gray-300">
            <div className="border border-gray-300 p-2 flex">
              <div className="border border-gray-300 p-2">Faculty Name</div>
              <div className="border border-gray-300 p-2">Batch Code</div>
              <div className="border border-gray-300 p-2">Subject CODE</div>
            </div>
            <div className="border border-gray-300 p-2">
              {dataToInsert.map((row, index) => (
                <div className=" flex " key={index}>
                  <div className="border border-gray-300 p-2">
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
                  </div>
                  <div className="border border-gray-300 p-2">
                    <SearchAbleDropdown
                      options={allBatches}
                      searchFor={["batch_code", "semester", "branch", "course"]}
                      insert={{ batch_id: "id" }}
                      setDataToInsert={setDataToInsert}
                      index={index}
                      // defaultValue={row.batchCode}
                      updateRow={updateRow}
                      mode="option"
                      placeholder="Select Batch"
                    />
                  </div>
                  <div className="border border-gray-300 p-2">
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
