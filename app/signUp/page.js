"use client";

import React from "react";
import { useForm } from "react-hook-form";
import OAuthButton from "../component/OAuthButton";
import Link from "next/link";
import { createUser } from "../action/createUser";

const signUp = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const onSubmit = (data) => {
    console.log(data);
    createUser(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md my-6">
        <div className="bg-white py-8 px-8 shadow-md rounded-xl border border-gray-200 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Create a New Account
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              Fill in your details below to get started
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                {...register("fullName", {
                  required: { value: true, message: "Full name is required" },
                  minLength: {
                    value: 2,
                    message: "Full name must be at least 2 characters",
                  },
                })}
                placeholder="Enter your full name"
              />
              {errors.fullName && <p className="mt-1 text-xs font-medium text-red-500">{errors.fullName.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                {...register("email", {
                  required: { value: true, message: "Email is required" },
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                placeholder="Enter your email"
              />
              {errors.email && <p className="mt-1 text-xs font-medium text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                {...register("password", {
                  required: { value: true, message: "Password is required" },
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                placeholder="Enter your password"
              />
              {errors.password && <p className="mt-1 text-xs font-medium text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                {...register("confirmPassword", {
                  required: {
                    value: true,
                    message: "Confirm password is required",
                  },
                  validate: (value) =>
                    value === watch("password") || "Passwords do not match",
                })}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <p className="mt-1 text-xs font-medium text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <div className="pt-2 space-y-2.5">
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    {...register("terms", { required: true })}
                  />
                  <span className="text-xs text-gray-600 font-medium">I agree to the terms and conditions</span>
                </label>
                {errors.terms && <p className="mt-1 text-xs text-red-500 font-medium">You must agree to the terms and conditions</p>}
              </div>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  {...register("newsletter")}
                />
                <span className="text-xs text-gray-600 font-medium">Subscribe to newsletter</span>
              </label>
            </div>

            <div className="pt-3">
              <input
                type="submit"
                value="Sign Up"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition text-sm cursor-pointer"
              />
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400 font-medium">Or continue with</span>
            </div>
          </div>

          <OAuthButton />

          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default signUp;
