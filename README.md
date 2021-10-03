# react-query

`react-query` is a react-powered module meant to be used to fetch and set external data into your React application.

This project was inspired by the API design of Tanner Linsley's [react-query](https://github.com/tannerlinsley/react-query). **I do not recommend using this project instead of `react-query`**, I wanted to challenge myself to try and build my own React-based external data module. This project should be purely for educational purposes and is not at all meant to be a direct replacement version of the real react-query module.

Hopefully this project might inspire you to build your own react-query library, as well!

## API

`react-query` exposes the following modules and API

### useQuery

`useQuery` is a fancy React hook that allows you to deterministically fetch and update data provided by an external source.

Because `useQuery` is implemented as a react hook, you can use it pretty much anywhere you want in a modern React application - in a function component, inside another hook, inside a Context module, etc.

```js
import { useEffect } from "react";
import { useQuery } from "query";

/** using useQuery inside a function component as a hook */
function Users() {
  const { isLoading, data, error, fetch } = useQuery({
    endpoint: "https://randomuser.me/api/",
  });

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <>
      {isLoading ? "loading..." : <pre>{JSON.stringify(data, null, 2)}</pre>}
      {error && <>{error}</>}
    </>
  );
}
```

### useQuery options

When initializing a new `useQuery` module, you can pass in the following options

```js
import { useQuery } from "query";

useQuery({
  /** (required) endpoint should point to the location of the external data you are retrieving */
  endpoint: "https://randomuser.me/api/",
  /** (optional) params given here will be stringified and appended to the endpoint on every request */
  params: {
    nat: "AU,US,NZ",
    inc: "nat,name,location,email,picture",
  },
  /**
   * (optional) withCache will save a cached version of the data returned on every request to localStorage.
   *
   * When you have 'withCache' defined, it will optimistically render the data present in the cache,
   *  if any, before refreshing when new data is returned from the request.
   * */
  withCache: "randomuser-demo",
  /**
   * (optional) by default, useQuery uses the fetch API provided by most modern browsers.
   *
   *  You can provide your own asynchronous fetch utility here instead, if you choose! Just make sure
   *  it follows the same API design and logic as the browser fetch api
   *  (https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
   * */
  requestUtil: (url, options) => new Promise((resolve, reject) => { ... })
});
```

### useQuery state

`useQuery` uses core React APIs under the hood to maintain a state of your external request. Any data or errors that are returned from your external request will be accessible by the values returned from the `useQuery` module

```js
import { useQuery } from "query";

const {
  /** set to 'true' when the module is waiting for the result of an external request */
  isLoading,
  /**
   * when errors are thrown by the external request (or the fetch utility) they should
   *  be caught by 'useQuery', and any message found in the error will be available here
   * */
  error,
  /**
   * when errors are thrown by the external request (or the fetch utility) they should
   *  be caught by 'useQuery', and any errorCode (4xx, 5xx, etc.) returned from the request
   *  will be available here
   * */
  errorCode,
  /**
   * when data is retrieved by the external request, it will be available here
   * */
  data,
  /**
   * 'fetch' uses the stock or provided request utility to retreive the data we expect to find at our
   *  external location. 'fetch' is implemented as a memoized callback using React's useCallback API,
   *  and should only update if any of the useQuery options are updated
   * */
  fetch,
  /** the endpoint used in the previous 'fetch', useful for debugging */
  endpoint,
  /** the params used in the previous 'fetch', useful for debugging */
  params,
  /** the full url used in the previous 'fetch', useful for debugging */
  url,
} = useQuery(...);
```

### useQuery fetch

The `fetch` function returned by a useQuery hook triggers the actual retrieval of your remote data when it is called. This is an asynchronous process, so you should be using this function anywhere else you would normally use a React Hook

> Not a requirement, but I highly recommend using [`eslint-plugin-react-hooks`](https://www.npmjs.com/package/eslint-plugin-react-hooks) if you aren't already

```js
import { useQuery } from "query";

const { fetch } = useQuery(...);

useEffect(() => {
  fetch();
}, [fetch]);
```

The `fetch` function takes optional parameters to customize the behavior of your external request

```js
fetch({
  /**
   * (optional) `params` allows you to pass in params directly to your request utility, which will be
   *  included with the params already set on your useQuery hook.
   *
   * This is useful if you set a default param on useQuery, such as a limit param, and have dynamic
   *  params being referenced in an individual fetch by some UI component, such as filters on a table
   * */
  params,
  /**
   * (optional) options refers to the RequestInit options passed into the requset utility
   *
   * These are the default options set (without any user input)
   *  {
   *    method: "GET",
   *    headers: {
   *      "Content-Type": "application/json",
   *    },
   *    mode: "cors",
   *    cache: "no-cache",
   *  }
   *
   * Additional options passed into each individual request will be appended to or override the
   *  default values, such as { method: "POST", body: JSON.stringify({ ... }) }
   * */
  options,
  /**
   * (optional) onResponse is a callback wrapped in a Promise that is called, if it exists, immediately
   *  before the response from your external source is mounted to useQuery.
   *
   * This means you can perform transformations, set your own metadata based on response data, call or
   *  import other external sources based on response values, etc.
   * */
  onResponse,
});
```
