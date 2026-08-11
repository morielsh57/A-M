import type { ActionReducerMapBuilder, AsyncThunk, Draft } from '@reduxjs/toolkit';
import type { IAPIError, IAPIRequestState } from '../api/models';
import { EAPIStatus } from '../api/models';

export interface ApiDataStateType {
  [apiData: string]: IAPIRequestState | any;
}

export const createAPIReducerCases = <T, S = void>(
  thunk:
    | AsyncThunk<T, S, { rejectValue: IAPIError; fulfilledMeta: { apiMeta?: unknown } }>
    | AsyncThunk<T, unknown, { rejectValue: IAPIError; fulfilledMeta: { apiMeta?: unknown } }>,
  dataKey: keyof ApiDataStateType,
  builder: ActionReducerMapBuilder<ApiDataStateType>,
  handlers?: {
    onPending?: (state: Draft<ApiDataStateType>, action: any) => void;
    onFulfilled?: (state: Draft<ApiDataStateType>, payload: T, action: any) => void;
    onRejected?: (state: Draft<ApiDataStateType>, payload: IAPIError, action: any) => void;
  },
) => {
  builder
    .addCase(thunk.pending, (state, action) => {
      state[dataKey].status = EAPIStatus.PENDING;
      state[dataKey].error = undefined;
      handlers?.onPending?.(state, action);
    })
    .addCase(thunk.fulfilled, (state, action) => {
      const apiMeta = (action.meta as { apiMeta?: unknown }).apiMeta;

      state[dataKey].status = EAPIStatus.FULFILLED;
      state[dataKey].data = action.payload;
      if (apiMeta !== undefined) {
        state[dataKey].meta = apiMeta;
      } else {
        delete state[dataKey].meta;
      }
      handlers?.onFulfilled?.(state, action.payload, action);
    })
    .addCase(thunk.rejected, (state, action) => {
      state[dataKey].status = EAPIStatus.REJECTED;
      const error = action.payload as IAPIError;
      state[dataKey].error = error;
      handlers?.onRejected?.(state, error, action);
    });
};

export const createAPIMapReducerCases = <T, S = void>(
  thunk:
    | AsyncThunk<T, S, { rejectValue: IAPIError; fulfilledMeta: { apiMeta?: unknown } }>
    | AsyncThunk<T, unknown, { rejectValue: IAPIError; fulfilledMeta: { apiMeta?: unknown } }>,
  mapKey: keyof ApiDataStateType,
  getRequestKey: (arg: S, action: any) => string,
  builder: ActionReducerMapBuilder<ApiDataStateType>,
) => {
  builder
    .addCase(thunk.pending, (state, action) => {
      const requestKey = getRequestKey(action.meta.arg as S, action);
      const currentRequest = state[mapKey][requestKey] || {};

      state[mapKey][requestKey] = {
        ...currentRequest,
        status: EAPIStatus.PENDING,
        error: undefined,
      };
    })
    .addCase(thunk.fulfilled, (state, action) => {
      const requestKey = getRequestKey(action.meta.arg as S, action);
      const apiMeta = (action.meta as { apiMeta?: unknown }).apiMeta;

      state[mapKey][requestKey] = {
        status: EAPIStatus.FULFILLED,
        data: action.payload,
        ...(apiMeta !== undefined ? { meta: apiMeta } : {}),
      };
    })
    .addCase(thunk.rejected, (state, action) => {
      const requestKey = getRequestKey(action.meta.arg as S, action);
      const currentRequest = state[mapKey][requestKey] || {};
      const error = action.payload as IAPIError;

      state[mapKey][requestKey] = {
        ...currentRequest,
        status: EAPIStatus.REJECTED,
        error,
      };
    });
};
