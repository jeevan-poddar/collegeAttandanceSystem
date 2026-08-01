"use client";
import React from "react";
import { useForm } from "react-hook-form";
import OAuthButton from "../component/OAuthButton";
import Link from "next/link";

const login = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const onSubmit = (data) => {
    console.log(data);    
  };
  return (
    <div>
      <div className="">
        <div className="">Login</div>
        <form className=" flex-col" onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor="email">
            <div className="">Email</div>
            <input
              type="email"
              {...register("email", {
                required: { value: true, message: "Email is required" },
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              placeholder="Enter your email"
            />
            {errors.email && <p>{errors.email.message}</p>}
          </label>
          <label htmlFor="password">
            <div className="">Password</div>
            <input
              type="password"
              {...register("password", {
                required: { value: true, message: "Password is required" },
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              placeholder="Enter your password"
            />
            {errors.password && <p>{errors.password.message}</p>}
          </label>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Login
          </button>
        </form>
        <div className="text-center mt-4">
          <p>
            Don't have an account?{" "}
            <Link href="/signUp" className="text-blue-500 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
        <OAuthButton />
      </div>
    </div>
  );
};

export default login;
