import { useReducer, useCallback, Dispatch } from "react";

const URLformat = ({ query }: { query: { [k: string]: string } }) => {
  return `?${Object.keys(query).map((key) => `${key}=${query[key]}`)}`;
};

const mergeRequestOptions = (
  defaultOptions: RequestInit,
  customOptions: RequestInit = {}
): RequestInit => {
  const defaultKeys = Object.keys(defaultOptions);
  const customKeys = Object.keys(customOptions);
  const sharedKeys = defaultKeys.concat(
    customKeys.filter((k) => !defaultKeys.includes(k))
  );
  return sharedKeys.reduce((acc: RequestInit, key: keyof RequestInit) => {
    const defaultValue = defaultOptions[key];
    const customValue = customOptions[key];

    if (typeof defaultValue === "object" && typeof customValue === "object") {
      return {
        ...acc,
        [key]: {
          ...defaultValue,
          ...customValue,
        },
      };
    }

    return {
      ...acc,
      [key]: customValue || defaultValue,
    };
  }, {});
};

// TODO: make this configurable by useQuery
const setDefaultOptions = (): RequestInit => ({
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
  mode: "cors",
  cache: "no-cache",
});

const request = (url: string, options?: RequestInit): Promise<Response> => {
  const defaultOptions = setDefaultOptions();
  const opts = mergeRequestOptions(defaultOptions, options);
  return fetch(url, opts);
};

/**
 * QueryProps defines the properties required (or optionally used) to define
 *  a useQuery hook.
 *
 * QueryProps uses generics (received from a useQuery hook) to determine the following...
 *  1. what data is accessible in the useQuery hook
 *  2. what query params exist for the useQuery hook
 */
type QueryProps<Params> = {
  /** All queries require a target endpoint */
  endpoint: string;
  /** All queries have optional params (defaults to `undefined`) */
  params?: Params;
  /**
   * useQuery defaults to using the global `fetch` browser API
   *  - you can provide your own external request util here as needed
   */
  requestUtil?: (
    url: string,
    options?: RequestInit | undefined
  ) => Promise<Response>;
  /**
   * useQuery can optionally serve cached data, rather than what's provided by an
   *  external `fetch`
   *  - localStorage is used for the cache
   *  - data provided by this hook will be cached using the given key passed by `withCache`
   *  - the data that is cached will be replaced by any use of useQuery's `requestUtil`
   * */
  withCache?: string;
  // TODO: add a flag here to 'cancel' requests (prevent data from updating if parent is unmounted)
};
/**
 * QueryState defines the stateful properties that are returned from every instance
 *  of a useQuery hook
 */
type QueryState<Data, Params> = {
  /** If an external request is currently active, isLoading will be set to `true` */
  isLoading: boolean;
  /** The params used in the current or most recent instance of a useQuery hook */
  params: Params | {};
  /** The resulting URL used in the current or most recent instance of a useQuery hook */
  url: string;
  /** This will always match the endpoint defined in QueryProps */
  endpoint?: string;
  /** The data expected to be retrieved by a useQuery hook */
  data?: Data;
  /** Any error thrown by a useQuery hook will be communicated here */
  error?: string;
  /** If an error status code is returned from an external request, it will be populated here */
  errorCode?: number;
};
/**
 * QueryFetch is exported here for typing use outside of this module
 *
 * ex:
 *  type FetchSomeType = QueryFetch<{ data: SomeType }, {}>;
 */
export type QueryFetch<Data, Params> = (config?: {
  params?: Params;
  options?: RequestInit;
  /**
   * `onResponse` can be used to mutate the data returned from your external source
   *  - This function defaults to a noop wrapped in a Promise that immediately resolves
   *  - if you supply your own handler here, it must be wrapped in a promise
   */
  onResponse?: (
    data: any
  ) => Promise<{
    data: Data;
  }>;
}) => void;
/**
 * QueryResult defines the properties that are returned from every instance
 *  of a useQuery hook.
 *
 * QueryResult extends QueryState
 *
 * QueryResult uses generics (received from a useQuery hook) to determine the following...
 *  1. what data is accessible in the useQuery hook
 *  2. what query params exist for the useQuery hook
 */
type QueryResult<Data, Params> = QueryState<Data, Params> & {
  /**
   * `fetch` can be used for controlled external data retrieval from whatever context
   *  defines a useQuery hook
   */
  fetch: QueryFetch<Data, Params>;
  // /**
  //  * `reset` sets the QueryState back to the original values passed in to the useQuery options
  //  */
  // reset: () => void;
  /**
   * this is generally useful for testing, you can also use it to wipe the state of the hook
   */
  dispatch: Dispatch<QueryActions<Data, Params>>;
};
export enum ACTION {
  RESET = "reset",
  REFRESH = "refresh",
  SUCCESS = "success",
  ERROR = "error",
}
type RESET_ACTION = { type: ACTION.RESET };
type REFRESH_ACTION<P> = {
  type: ACTION.REFRESH;
  url: string;
  params?: P | {};
};
type SUCCESS_ACTION<D> = {
  type: ACTION.SUCCESS;
  data: D;
  prevPage?: string;
  nextPage?: string;
};
type ERROR_ACTION = { type: ACTION.ERROR; error: string; errorCode?: number };
type QueryActions<D, P> =
  | RESET_ACTION
  | REFRESH_ACTION<P>
  | SUCCESS_ACTION<D>
  | ERROR_ACTION;
export function useQueryReducer<Data, Params>(
  state: QueryState<Data, Params>,
  action: QueryActions<Data, Params>
): QueryState<Data, Params> {
  switch (action.type) {
    case ACTION.RESET: {
      return {
        isLoading: false,
        url: state.url,
        params: state.params,
      };
    }
    case ACTION.REFRESH: {
      const { url: actionUrl, params = {} } = action;
      return {
        ...state,
        url: actionUrl,
        params,
        isLoading: true,
      };
    }
    case ACTION.SUCCESS: {
      const { data } = action;
      return {
        ...state,
        data,
        isLoading: false,
      };
    }
    case ACTION.ERROR: {
      const { error, errorCode } = action;
      return {
        ...state,
        error,
        errorCode,
        isLoading: false,
      };
    }
    default:
      return state;
  }
}
/**
 * useQuery is a custom hook that enforces consistent patterns for...
 *  1. retrieving data from external resources
 *  2. typing the values returned from external resources
 *  3. typing the optional query parameters available on an external resource
 */
export function useQuery<D, P>({
  endpoint,
  withCache,
  params,
  requestUtil = request,
}: QueryProps<P>): QueryResult<D, P> {
  const reducer = useQueryReducer as (
    prev: QueryState<D, P>,
    action: QueryActions<D, P>
  ) => QueryState<D, P>;
  const [state, dispatch] = useReducer(reducer, {
    isLoading: false,
    params: params || {},
    url: endpoint + URLformat({ query: { ...(params || {}) } }),
  });

  const {
    url: urlState,
    params: paramsState,
    isLoading,
    data,
    error,
    errorCode,
  } = state;

  const fetch = useCallback(
    async (
      config: {
        params?: P;
        options?: RequestInit;
        onResponse?: (data: any) => Promise<{ data: D }>;
      } = {}
    ) => {
      const queryParams = {
        ...params,
        ...config?.params,
      };
      const requestUrl =
        endpoint +
        URLformat({
          // @ts-ignore
          query: { ...queryParams },
        });
      const defaultErrorMessage =
        "Sorry, we are unable to retrieve this data for you right now. Please try again later.";

      function mountData(d: D): void {
        if (withCache) {
          window.localStorage.setItem(withCache, JSON.stringify(d));
        }

        dispatch({
          type: ACTION.SUCCESS,
          data: d,
        });
      }

      try {
        dispatch({
          type: ACTION.REFRESH,
          url: requestUrl,
          params,
        });
        const response = await requestUtil(requestUrl, config?.options);

        if (!response.ok) {
          const { error } = await response.json();
          dispatch({
            type: ACTION.ERROR,
            error: error || defaultErrorMessage,
            errorCode: response.status,
          });
          return;
        }

        const payload = await response.json().catch(async () => {
          // response.ok but no body
          if (config?.onResponse) {
            const { data: responseData } = await config.onResponse(payload);
            mountData(responseData || ({} as D));
            return;
          }
        });

        if (config?.onResponse) {
          const { data: responseData } = await config.onResponse(payload);
          mountData(responseData);
          return;
        }

        mountData(payload);
      } catch (e) {
        const { message = defaultErrorMessage } = e as { message: string };
        dispatch({
          type: ACTION.ERROR,
          error: message,
          errorCode: 500,
        });
      }
    },
    [params, endpoint, withCache, requestUtil]
  );

  let cachedData;
  if (withCache) {
    const cache = window.localStorage.getItem(withCache);
    if (cache) cachedData = JSON.parse(cache);
  }

  // TODO: implement this
  // const reset = useCallback(() => dispatch({ type: ACTION.RESET }), [dispatch]);

  return {
    isLoading,
    endpoint,
    params: paramsState,
    url: urlState,
    fetch,
    data: cachedData || data,
    error,
    errorCode,
    dispatch,
    // reset,
  };
}
