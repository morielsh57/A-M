import type { ActionReducerMapBuilder, AsyncThunk, Draft } from '@reduxjs/toolkit';
import type { IAPIError, IAPIRequestState } from '../api/models';
import { EAPIStatus } from '../api/models';

export interface ApiDataStateType {
  [apiData: string]: IAPIRequestState | any;
}

export const createAPIReducerCases = <T, S = void>(
  thunk:
    | AsyncThunk<T, S, { rejectValue: IAPIError }>
    | AsyncThunk<T, unknown, { rejectValue: IAPIError }>,
  dataKey: keyof ApiDataStateType,
  builder: ActionReducerMapBuilder<ApiDataStateType>,
  handlers?: {
    onPending?: (state: Draft<ApiDataStateType>) => void;
    onFulfilled?: (state: Draft<ApiDataStateType>, payload: T) => void;
    onRejected?: (state: Draft<ApiDataStateType>, payload: IAPIError) => void;
  },
) => {
  builder
    .addCase(thunk.pending, (state) => {
      state[dataKey].status = EAPIStatus.PENDING;
      handlers?.onPending?.(state);
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state[dataKey].status = EAPIStatus.FULFILLED;
      state[dataKey].data = action.payload;
      handlers?.onFulfilled?.(state, action.payload);
    })
    .addCase(thunk.rejected, (state, action) => {
      state[dataKey].status = EAPIStatus.REJECTED;
      const error = action.payload as IAPIError;
      state[dataKey].error = error;
      handlers?.onRejected?.(state, error);
    });
};
