"use client";
import React, { useState } from "react";

const page = () => {
  const [dataToInsert, setDataToInsert] = useState([]);
  const insertRow = () => {
    setDataToInsert((prevData) => [
      ...prevData,
      { facultyName: "", batchCode: "", subjectCode: "" },
    ]);
  };
  return (
    <div>
      <div className="bg-gray-200 p-4">
        <h1>Faculty Allocation</h1>
        <button onClick={insertRow}>Add more</button>
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
                    <input
                      type="text"
                      value={row.facultyName}
                      onChange={(e) =>
                        setDataToInsert((prevData) => {
                          const newData = [...prevData];
                          newData[index].facultyName = e.target.value;
                          return newData;
                        })
                      }
                    />
                  </div>
                  <div className="border border-gray-300 p-2">
                    <input
                      type="text"
                      value={row.batchCode}
                      onChange={(e) =>
                        setDataToInsert((prevData) => {
                          const newData = [...prevData];
                          newData[index].batchCode = e.target.value;
                          return newData;
                        })
                      }
                    />
                  </div>
                  <div className="border border-gray-300 p-2">
                    <input
                      type="text"
                      value={row.subjectCode}
                      onChange={(e) =>
                        setDataToInsert((prevData) => {
                          const newData = [...prevData];
                          newData[index].subjectCode = e.target.value;
                          return newData;
                        })
                      }
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

export default page;
