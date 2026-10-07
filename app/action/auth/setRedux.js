"use client"

import { setUser } from "@/app/redux/user/userSlice";
import { useDispatch } from "react-redux";

const dispatch = useDispatch();
export async function setRedux() {
    dispatch(setUser(
        
    ))
}