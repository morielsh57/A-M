import { useEffect } from 'react';
import type { IAPIError, IAPIRequestState } from '../api/models';
import { EAPIStatus } from '../api/models';

// Written using https://levelup.gitconnected.com/handle-api-lifecycle-with-react-axios-and-redux-toolkit-1212645a6a06

/**
 * An unhandled generic error when error was not supplied from reducers
 */
export const UnhandledError = {
  message: 'Cannot handle error data.',
  code: -400,
};

/**
 * Hook to be used you want to run a function on each state of a get request
 * @param response The response to listen to
 * @param handlers The handles that will run on each state
 */
export const useApiData = <DataType>(
  response: IAPIRequestState<DataType>,
  handlers: {
    onFulfilled?: (data: DataType) => void;
    onRejected?: (error: IAPIError) => void;
    onPending?: () => void;
  },
) => {
  const { onFulfilled, onRejected, onPending } = handlers;

  /**
   * Run the provided onRejected fn when needed
   */
  useEffect(() => {
    if (response.status !== EAPIStatus.REJECTED) {
      return;
    }
    onRejected?.(response.error || UnhandledError);
    // eslint-disable-next-line
  }, [response.status]);

  //
  /**
   * Run the provided onFulfilled fn when fulfilled
   */
  useEffect(() => {
    if (response.status !== EAPIStatus.FULFILLED) {
      return;
    }
    // eslint-disable-next-line
    onFulfilled?.(response.data!);
    // eslint-disable-next-line
  }, [response.status]);

  /**
   * Run the provided onPending fn when pending
   */
  useEffect(() => {
    if (response.status !== EAPIStatus.PENDING) {
      return;
    }
    onPending?.();
    // eslint-disable-next-line
  }, [response.status]);
};
