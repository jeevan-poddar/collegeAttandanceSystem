import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userName: "USER_NAME" || null,
    email: "user@gmail.com" || null,
    role: "unknown" || null,
    userId: null,
    isAuthenticated: false,
  },
  reducers: {
    setUser(state, action) {
      state.userName = action.payload.userName;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.userId = action.payload.userId;
      state.isAuthenticated = !!action.payload;
    },
    clearUser(state) {
      state.userName = "USER_NAME" || null;
      state.email = "user@gmail.com" || null;
      state.role = "unknown" || null;
      state.userId = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;