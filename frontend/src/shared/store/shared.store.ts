import { createAction, createReducer } from '@reduxjs/toolkit';

export interface SharedStoreState {
  exampleForGlobalState?: string;
}

const initialStateSharedStore: SharedStoreState = {
  exampleForGlobalState: 'hello world',
};

export const setexampleForGlobalState = createAction<string>(
  'sharedStore/setexampleForGlobalState',
);

export const sharedStoreReducer = createReducer(initialStateSharedStore, (builder) => {
  builder.addCase(setexampleForGlobalState, (state, action) => {
    state.exampleForGlobalState = action.payload;
  });
});
