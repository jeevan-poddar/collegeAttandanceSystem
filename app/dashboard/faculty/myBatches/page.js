"use client";
import { fetchAttandanceForOverall } from "@/app/action/fetchAttandanceForOverall";
import { fetchBatches } from "@/app/action/fetchBatches";
import { fetchSessionForAttandance } from "@/app/action/fetchSessionForAttandance";
import { fetchStudent } from "@/app/action/fetchStudent";
import React, { use, useEffect, useState } from "react";

const page = () => {
  const [myBatches, setMyBatches] = useState([]);
  const [viewAttandance, setViewAttandance] = useState(false);
  const [sessionDetails, setSessionDetails] = useState([]);
  const [students, setStudents] = useState([]);
  const [attandance, setAttandance] = useState([]);
  async function fetchSessions(batchId, subjectId) {
    try {
      const data = await fetchSessionForAttandance(batchId, subjectId);
      if (data.success) {
        setSessionDetails(data.data);
      } else {
        console.error("Error fetching sessions:", data.error);
      }
      return data;
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return { success: false, error };
    }
  }
  useEffect(() => {
    async function fetchBatchesFrontend() {
      try {
        const data = await fetchBatches(); // Replace with actual batchId and subjectId
        if (data.success) {
          setMyBatches(data.data);
        } else {
          console.error("Error fetching batches:", data.error);
        }
      } catch (error) {
        console.error("Error fetching batches:", error);
      }
    }
    fetchBatchesFrontend();
  }, []);
  return (
    <>
      <div>
        <h1>My Batches</h1>
        {myBatches.map((batch) => (
          <div
            key={batch.id}
            onClick={async () => {
              const sessionResponse = await fetchSessions(
                batch.batch_id,
                batch.subject_id,
              );
              const studentResponse = await fetchStudent(batch.batch_id);
              setStudents(studentResponse?.success ? studentResponse.data : []);

              const sessionIds = sessionResponse?.success
                ? sessionResponse.data.map((session) => session.id)
                : [];
              const studentIds = studentResponse?.success
                ? studentResponse.data.map((student) => student.id)
                : [];

              const attandanceData = await fetchAttandanceForOverall(
                batch.batch_id,
                sessionIds,
                studentIds,
              );
              if (attandanceData.success) {
                setAttandance(attandanceData.data);
                setViewAttandance(true);
              }
            }}
            className="border-2 "
          >
            <h2>{batch.batch_code}</h2>
            <p>
              {batch.subject_name} ({batch.batch_id}, {batch.subject_id})
            </p>
          </div>
        ))}
      </div>
      {viewAttandance && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="w-full bg-white h-full shadow-2xl flex flex-col">
            <div className=" flex justify-between items-center p-4 border-b-2">
              <h1>Attendance Details</h1>
              <button
                onClick={() => setViewAttandance(false)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <td>Roll No.</td>
                  <td>Student Name</td>
                  {sessionDetails.map((session, index) => (
                    <td key={index}>{index + 1}</td>
                  ))}
                  <td>Total</td>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index}>
                    <td>{student.rollNo}</td>
                    <td>{student.name}</td>
                    {sessionDetails.map((session, sessionIndex) => {
                      const attendanceRecord = attandance.find(
                        (record) =>
                          record.class_session_id === session.id &&
                          record.student_id === student.id,
                      );
                      const status = attendanceRecord
                        ? attendanceRecord.status
                        : "N/A";
                      return (
                        <td key={sessionIndex}>
                          {
                            <button
                              className={`px-3 py-1 rounded font-bold transition ${
                                status === "present"
                                  ? "bg-green-500 text-white"
                                  : status === "absent"
                                    ? "bg-red-500 text-white"
                                    : status === "late"
                                      ? "bg-yellow-500 text-white"
                                      : "bg-gray-300 text-black"
                              }`}
                            >
                              {status === "present"
                                ? "P"
                                : status === "absent"
                                  ? "A"
                                  : status === "late"
                                    ? "L"
                                    : "N/A"}
                            </button>
                          }
                        </td>
                      );
                    })}
                    {(() => {
                      const totalPresent = attandance.filter(
                        (record) =>
                          record.student_id === student.id &&
                          (record.status === "present" || record.status === "late"),
                      ).length;
                      const totalSessions = sessionDetails.length;
                      return (
                        <td>
                          {totalPresent}/{totalSessions}
                        </td>
                      );
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default page;
