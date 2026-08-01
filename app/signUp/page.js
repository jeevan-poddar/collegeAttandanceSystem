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
    <div>
      <div className="">
        <h1>Sign Up </h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor="fullName">
            <div className="">Full Name</div>
            <input
              type="text"
              {...register("fullName", {
                required: { value: true, message: "Full name is required" },
                minLength: {
                  value: 2,
                  message: "Full name must be at least 2 characters",
                },
              })}
              placeholder="Enter your full name"
            />
            {errors.fullName && <p>{errors.fullName.message}</p>}
          </label>
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
          <label htmlFor="confirmPassword">
            <div className="">Confirm Password</div>
            <input
              type="password"
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
            {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}
          </label>
          <div className="">
            <input type="checkbox" {...register("terms", { required: true })} />
            <span className="">I agree to the terms and conditions</span>
            {errors.terms && <p>You must agree to the terms and conditions</p>}
          </div>
          <div className="flex items-center">
            <input type="checkbox" {...register("newsletter")} />
            <span className="ml-2">Subscribe to newsletter</span>
          </div>

          <input type="submit" />
        </form>
        <div className="mt-4 text-center">
          <p>
            Already have an account? <Link href="/login" className="text-blue-500 hover:underline">Login here</Link>
          </p>
        </div>
        <OAuthButton />
      </div>
    </div>
  );
};

export default signUp;
