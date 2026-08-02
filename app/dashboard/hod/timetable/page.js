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
    <div>
      <div className="">
        <h1>Add Subject</h1>
        <form>
          <input type="text" placeholder="Enter Session Year" {...register("sessionYear")} />
        </form>
        <button onClick={insertRow}>Add more</button>
        <button onClick={() => submitTimeTable(dataToInsert)}>Submit</button>
      </div>
      <div className="w-full border-collapse border border-gray-300">
        <div className="border border-gray-300 p-2 flex">
          <div className="border border-gray-300 p-2">Batch code</div>
          <div className="border border-gray-300 p-2">Subject code</div>
          <div className="border border-gray-300 p-2">Faculty name</div>
          <div className="border border-gray-300 p-2">Day</div>
          <div className="border border-gray-300 p-2">Period no.</div>
          <div className="border border-gray-300 p-2">Room no.</div>
        </div>
        <div className="border border-gray-300 p-2">
          {dataToInsert.map((row, index) => (
            <div className=" flex " key={index}>
              <div className="border border-gray-300 p-2">
                <SearchAbleDropdown
                  options={allBatches}
                  searchFor={["batch_code"]}
                  insert={{
                    batch_id: "id",
                  }}
                  setDataToInsert={setDataToInsert}
                  index={index}
                  updateRow={updateRow}
                  mode="option"
                  placeholder="Select Batch Code"
                />
              </div>
              <div className="border border-gray-300 p-2">
                <SearchAbleDropdown
                  options={allSubjects}
                  searchFor={["subject_code"]}
                  insert={{
                    subject_id: "id",
                  }}
                  setDataToInsert={setDataToInsert}
                  index={index}
                  updateRow={updateRow}
                  mode="option"
                  placeholder="Select Subject Code"
                />
              </div>
              <div className="border border-gray-300 p-2">
                <SearchAbleDropdown
                  options={allFaculty}
                  searchFor={["name"]}
                  insert={{
                    faculty_id: "id",
                  }}
                  setDataToInsert={setDataToInsert}
                  index={index}
                  updateRow={updateRow}
                  mode="option"
                  placeholder="Select Faculty"
                />
              </div>
              <div className="border border-gray-300 p-2">
                <SearchAbleDropdown
                  options={[
                    {
                      day: "Monday",
                      day_of_week: 1,
                    },
                    {
                      day: "Tuesday",
                      day_of_week: 2,
                    },
                    {
                      day: "Wednesday",
                      day_of_week: 3,
                    },
                    {
                      day: "Thursday",
                      day_of_week: 4,
                    },
                    {
                      day: "Friday",
                      day_of_week: 5,
                    },
                    {
                      day: "Saturday",
                      day_of_week: 6,
                    },
                    {
                      day: "Sunday",
                      day_of_week: 7,
                    },
                  ]}
                  searchFor={["day"]}
                  insert={{
                    day_of_week: "day_of_week",
                  }}
                  setDataToInsert={setDataToInsert}
                  index={index}
                  updateRow={updateRow}
                  mode="option"
                  placeholder="Select Day"
                />
              </div>
              <div className="border border-gray-300 p-2">
                <SearchAbleDropdown
                  options={[]}
                  searchFor={["period_number"]}
                  insert={{
                    period_number: "period_number",
                  }}
                  setDataToInsert={setDataToInsert}
                  index={index}
                  updateRow={updateRow}
                  mode="custom"
                  placeholder="Enter Period No."
                />
              </div>
              <div className="border border-gray-300 p-2">
                <SearchAbleDropdown
                  options={[]}
                  searchFor={["room_no"]}
                  insert={{
                    room_no: "room_no",
                  }}
                  setDataToInsert={setDataToInsert}
                  index={index}
                  updateRow={updateRow}
                  mode="custom"
                  placeholder="Enter Room No."
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
