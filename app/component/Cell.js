"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";

const Cell = (props) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  return (
    <>
      <div>
        <div className="flex">
          <div className="">Branch: </div>
          {props.selectedSession?.branch || "N/A"}
        </div>
        <div className="flex">
          <div className="">Course: </div>
          {props.selectedSession?.course || "N/A"}
        </div>
        <div className="flex">
          <div className="">Sem: </div>
          {props.selectedSession?.sem || "N/A"}
        </div>
        <div className="flex">
          <div className="">Batch: </div>
          {props.selectedSession?.batch_code || "N/A"}
        </div>
        <div className="flex">
          <div className="">Subject: </div>
          {props.selectedSession?.subject || "N/A"}
        </div>
        <div className="flex">
          <div className="">Room No: </div>
          {props.selectedSession?.room || "N/A"}
        </div>
        <div className="">
          <form action="" onSubmit={handleSubmit(props.onSubmit)}>
            <label
              htmlFor="is_proxy_toggle"
              className="flex items-center space-x-2"
            >
              <input
                type="checkbox"
                id="is_proxy_toggle"
                {...register("is_proxy")}
              />
              <span>Mark as Proxy</span>
            </label>
            {watch("is_proxy") && (
              <label htmlFor="proxyFaculty">
                <input placeholder="Enter proxy Teacher name" className=" border-black border-2" type="text" {...register("proxy_faculty")} />
              </label>
            )}
            {}
          </form>
        </div>
        <div className="">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => {
              props.setSessionDesOn(false);
              props.setActiveClass(props.selectedSession);
            }}
          >
            Mark Attendance
          </button>
        </div>
      </div>
    </>
  );
};

export default Cell;
