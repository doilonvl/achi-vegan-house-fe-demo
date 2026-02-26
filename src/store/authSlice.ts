import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AuthState = { token?: string; user?: { email: string } | null };
const initialState: AuthState = { token: undefined, user: null };

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<AuthState>) {
      state.token = action.payload.token;
      state.user = action.payload.user ?? null;
    },
    logout(state) {
      state.token = undefined;
      state.user = null;
    },
  },
});

export const { setAuth, logout } = slice.actions;
export default slice.reducer;
