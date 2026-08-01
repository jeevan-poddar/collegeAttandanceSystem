"use client";
import { fetchAttendance } from "@/app/action/fetchAttandance";
import { fetchClassSession } from "@/app/action/fetchClassSession";
import { fetchStudent } from "@/app/action/fetchStudent";
import { submitAttendance } from "@/app/action/submitAttandance";
import Cell from "@/app/component/Cell";
import React, { useEffect, useState } from "react";

const page = () => {
  const [sessionDesOn, setSessionDesOn] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeClass, setActiveClass] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [classSessions, setClassSessions] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await fetchClassSession();
        setClassSessions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching class sessions:", error);
      }
    };

    fetchSessions();
  }, []);

  const markStudent = (studentId, status) => {
    setAttendance((prevAttendance) => ({
      ...prevAttendance, // Keep all the previous students' statuses
      [studentId]: status, // Update or add this specific student's status
    }));
  };
  const handleSubmitAttendance = async () => {
    // 1. Prevent submission if no class is active or no attendance is marked
    if (!activeClass || Object.keys(attendance).length === 0) return;

    // 2. Convert the attendance object into an array of rows for Supabase
    // Object.entries() turns { s1: 'present' } into [['s1', 'present']]
    const attendanceRecords = Object.entries(attendance).map(
      ([studentId, status]) => {
        return {
          student_id: studentId,
          status: status,
          class_session_id: activeClass.id, // We use the ID of the modal's current class
        };
      },
    );

    // 3. For now, since we don't have the backend connected, let's just log it!
    console.log("READY TO SEND TO SUPABASE:", attendanceRecords);

    const result = await submitAttendance(attendanceRecords); // Call the server action to submit attendance
    console.log("Attendance submission result:", result);
    alert(
      `Successfully marked attendance for ${attendanceRecords.length} students!`,
    );

    // 4. Close the modal and clean up
    setActiveClass(null);
    setAttendance({});
  };

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const periods = [
    "08:50 AM - 10:00 AM",
    "10:00 AM - 11:10 AM",
    "11:10 AM - 12:15 PM",
    "12:15 PM - 01:05 PM", //LUNCH
    "01:05 PM - 02:10 PM",
    "02:10 PM - 03:15 PM",
  ];
  return (
    <>
      <div>
        <div className="p-8 bg-gray-50">
          <h1 className="text-2xl font-bold mb-6">Teacher Dashboard</h1>
          <p>Welcome to your dashboard!</p>
        </div>
        <div className="">
          <h1 className="text-xl font-bold mb-4">Time Table</h1>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th>Time</th>
                {days.map((day) => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period, index) => {
                return (
                  <tr key={index}>
                    <td>{period}</td>
                    {days.map((day) => {
                      const session =
                        index === 3
                          ? null
                          : classSessions.find(
                              (s) =>
                                s.day === day &&
                                (index < 3
                                  ? s.period === index + 1
                                  : s.period === index),
                            );
                      return (
                        <td
                          key={day}
                          onClick={async () => {
                            session &&
                              (setSelectedSession(session),
                              setSessionDesOn(true));
                            if (!session) return;

                            const studentData = await fetchStudent(
                              session.batchId,
                            ); // Fetch students for the batch
                            setStudents(
                              studentData.success ? studentData.data : [],
                            );
                            const attandanceData = await fetchAttendance(
                              session.id,
                            );
                            console.log(
                              "Fetched Attendance Data:",
                              attandanceData.data,
                            );
                            setAttendance(
                              attandanceData.success ? attandanceData.data : {},
                            );
                          }}
                        >
                          {session ? (
                            <div>
                              <p>{session.batch_code}</p>
                              <p>{session.room}</p>
                            </div>
                          ) : (
                            "Free"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {sessionDesOn && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <div className=" flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold mb-4">Session Details</h2>
              <div
                className=""
                onClick={() => {
                  setSessionDesOn(false);
                }}
              >
                X
              </div>
            </div>
            {selectedSession && (
              <div className="">
                <Cell
                  selectedSession={selectedSession}
                  setSessionDesOn={setSessionDesOn}
                  setActiveClass={setActiveClass}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {/* The Attendance Register Modal */}
      {activeClass && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          {/* The Slide-over Panel */}
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{activeClass.subject}</h2>
                <p className="text-blue-200 text-sm">
                  Batch: {activeClass.batch_code} | Room: {activeClass.room}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveClass(null);
                  setSelectedSession(null);
                  setSessionDesOn(false);
                  setAttendance({});
                  setStudents([]);
                }}
                className="text-white hover:bg-blue-500 p-2 rounded"
              >
                Close
              </button>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex gap-2">
                <p className=" font-medium text-gray-500">Roll No</p>
                <p className="font-medium">Full Name</p>
                <button
                  onClick={() => {
                    students.forEach((student) => {
                      markStudent(student.id, "present");
                    });
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded font-bold hover:bg-blue-600"
                >
                  Mark all Present
                </button>
              </div>
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2 border-b"
                >
                  <div className="flex gap-2 justify-center">
                    <p className=" font-medium text-gray-500">
                      {student.rollNo}
                    </p>
                    <p className="font-medium">{student.name}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => markStudent(student.id, "present")}
                      className={`px-3 py-1 rounded font-bold transition ${
                        attendance[student.id] === "present"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      P
                    </button>
                    <button
                      onClick={() => markStudent(student.id, "absent")}
                      className={`px-3 py-1 rounded font-bold transition ${
                        attendance[student.id] === "absent"
                          ? "bg-red-500 text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => markStudent(student.id, "late")}
                      className={`px-3 py-1 rounded font-bold transition ${
                        attendance[student.id] === "late"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      L
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="text-center text-sm text-gray-500">
                Present:{" "}
                {
                  Object.values(attendance).filter(
                    (status) => status === "present" || status === "late",
                  ).length
                }{" "}
                | Absent:{" "}
                {
                  Object.values(attendance).filter(
                    (status) => status === "absent",
                  ).length
                }
              </div>
              <button
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                onClick={() => {
                  console.log(attendance);
                  handleSubmitAttendance();
                }}
              >
                Submit Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default page;
