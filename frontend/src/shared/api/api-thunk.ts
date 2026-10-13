import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { ApiThunkCallback } from './models';
import type { IAPIError } from './models';
import { isApiSuccessResponse } from './response.utils';

/**
 * Create an api thunk, which will run the provided promise and await it
 * @param typePrefix The type prefix of the action
 * @param requestCallback A callback function which returns an api request using axios
 */
export const createApiThunk = <TData, TArgs = void>(
  typePrefix: string,
  requestCallback: ApiThunkCallback<TData, TArgs>,
) => {
  return createAsyncThunk<TData, TArgs, { rejectValue: IAPIError; fulfilledMeta: { apiMeta?: unknown } }>(
    typePrefix,
    async (args, { rejectWithValue, fulfillWithValue }) => {
      try {
        const payload = await requestCallback(args as TArgs);

        if (isApiSuccessResponse(payload)) {
          return fulfillWithValue(payload.data, { apiMeta: payload.meta });
        }

        return fulfillWithValue(payload, {});
        // eslint-disable-next-line
      } catch (e: unknown) {
        const axiosError = e as AxiosError;
        const responseData = axiosError?.response?.data;
        const structuredError = responseData as {
          message?: string;
          msg?: string;
          detail?: string;
          error?: { message?: string; details?: unknown };
        } | undefined;
        const responseMessage = typeof responseData === 'string'
          ? responseData
          : (
            structuredError?.error?.message
            || structuredError?.message
            || structuredError?.msg
            || structuredError?.detail
          );

        return rejectWithValue({
          message: responseMessage || axiosError?.message,
          code: axiosError?.response?.status ?? axiosError?.status,
          details: structuredError?.error?.details,
          axiosError,
        });
      }
    },
  );
};

