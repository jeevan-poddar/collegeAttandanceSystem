import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userName: null,
    email: null,
    role: null,
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
      state.userName = null;
      state.email = null;
      state.role = null;
      state.userId = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;