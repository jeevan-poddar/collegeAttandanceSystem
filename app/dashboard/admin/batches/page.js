"use client";

import SearchAbleDropdown from "@/app/component/SearchableDropdown";
import React, { useState } from "react";
import { submitBatches } from "@/app/action/submitBatches";

const page = () => {
  const [dataToInsert, setDataToInsert] = useState([]);
  const insertRow = () => {
    setDataToInsert((prevData) => [
      ...prevData,
      {
        batch_code: "",
        session_year: "",
        semester: "",
        branch: "",
        course: "",
        room_no: "",
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
  return (
    <div>
      <div className="">
        <h1>Add Batch</h1>
        <button onClick={insertRow}>Add more</button>
        <button onClick={() => submitBatches(dataToInsert)}>Submit</button>
      </div>
      <div className="w-full border-collapse border border-gray-300">
        <div className="border border-gray-300 p-2 flex">
          <div className="border border-gray-300 p-2">Batch code</div>
          <div className="border border-gray-300 p-2">Session year</div>
          <div className="border border-gray-300 p-2">Semester</div>
          <div className="border border-gray-300 p-2">Branch</div>
          <div className="border border-gray-300 p-2">Course</div>
          <div className="border border-gray-300 p-2">Room no.</div>
        </div>
        <div className="border border-gray-300 p-2">
          {dataToInsert.map((row, index) => (
            <div className=" flex " key={index}>
              <div className="border border-gray-300 p-2">
                <SearchAbleDropdown
                  options={[]}
                  searchFor={["batch_code"]}
                  insert={{
                    batch_code: "batch_code",
                  }}
                  setDataToInsert={setDataToInsert}
                  index={index}
                  updateRow={updateRow}
                  mode="custom"
                  placeholder="Enter Batch Code"
                />
              </div>
              <div className="border border-gray-300 p-2">
                <SearchAbleDropdown
                  options={[]}
                  searchFor={["session_year"]}
                  insert={{
                    session_year: "session_year",
                  }}
                  setDataToInsert={setDataToInsert}
                  index={index}
                  updateRow={updateRow}
                  mode="custom"
                  placeholder="Enter Session Year"
                />
              </div>
              <div className="border border-gray-300 p-2">
                <SearchAbleDropdown
                  options={[]}
                  searchFor={["name"]}
                  insert={{
                    semester: "semester",
                  }}
                  setDataToInsert={setDataToInsert}
                  index={index}
                  updateRow={updateRow}
                  mode="custom"
                  placeholder="Enter Semester"
                />
              </div>
              <div className="border border-gray-300 p-2">
                <SearchAbleDropdown
                  options={[]}
                  searchFor={["branch"]}
                  insert={{
                    branch: "branch",
                  }}
                  setDataToInsert={setDataToInsert}
                  index={index}
                  updateRow={updateRow}
                  mode="custom"
                  placeholder="Enter Branch"
                />
              </div>
              <div className="border border-gray-300 p-2">
                <SearchAbleDropdown
                  options={[]}
                  searchFor={["course"]}
                  insert={{
                    course: "course",
                  }}
                  setDataToInsert={setDataToInsert}
                  index={index}
                  updateRow={updateRow}
                  mode="custom"
                  placeholder="Enter Course"
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
