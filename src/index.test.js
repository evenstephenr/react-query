import React from 'react';
import fetch from 'node-fetch';

import {render} from '@testing-library/react'
import { renderHook, act } from '@testing-library/react-hooks'
import '@testing-library/jest-dom'

globalThis.fetch = fetch

import { useQuery, useQueryReducer, ACTION } from '.';

test('should pass', () => {
  const Greeting = () => (<h1>Hello, world!</h1>)
  expect(1 === 1).toEqual(true);
  expect (1 === 2).toEqual(false);
  const { getByText } = render(<Greeting />);
  expect(getByText('Hello, world!')).toBeInTheDocument();
});

test('useQueryReducer UNKNOWN ACTION', () => {
  expect(useQueryReducer({
    data: 'test',
  }, {})).toEqual({
    data: 'test',
  });
});

test('useQueryReducer ACTION.RESET', () => {
  expect(useQueryReducer({
    data: 'test',
  }, {
    type: ACTION.RESET,
  })).toEqual({
    isLoading: false,
    url: undefined,
    params: undefined
  });
  expect(useQueryReducer({
    data: 'test',
    url: 'test_url',
    params: { param1: 'test' },
  }, {
    type: ACTION.RESET,
  })).toEqual({
    isLoading: false,
    url: 'test_url',
    params:  { param1: 'test' }
  });
});

test('useQueryReducer ACTION.REFRESH', () => {
  expect(useQueryReducer({
    data: 'test',
  }, {
    type: ACTION.REFRESH,
  })).toEqual({
    data: 'test',
    url: undefined,
    params: {},
    isLoading: true
  });

  expect(useQueryReducer({
    data: 'test',
    url: 'test_url_from_data',
  }, {
    type: ACTION.REFRESH,
    url: 'test_url',
    params: { param1: 'test' },
  })).toEqual({
    data: 'test',
    isLoading: true,
    url: 'test_url',
    params:  { param1: 'test' }
  });
});

test('useQueryReducer ACTION.SUCCESS', () => {
  expect(useQueryReducer({
    data: 'test',
    url: 'test_url_from_data',
    params:  { param1: 'test' },
  }, {
    type: ACTION.SUCCESS,
    data: 'some other data',
  })).toEqual({
    data: 'some other data',
    isLoading: false,
    url: 'test_url_from_data',
    params:  { param1: 'test' }
  });
});

test('useQueryReducer ACTION.ERROR', () => {
  expect(useQueryReducer({
    data: 'test',
    url: 'test_url_from_data',
    params:  { param1: 'test' },
  }, {
    type: ACTION.ERROR,
    error: 'oh no :(',
    errorCode: 404,
  })).toEqual({
    data: 'test',
    error: 'oh no :(',
    errorCode: 404,
    isLoading: false,
    url: 'test_url_from_data',
    params:  { param1: 'test' }
  });
});

test('useQuery - GET /user - with params', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useQuery({
    endpoint: 'https://api.backend.dev/user',
  }));

  act(() => {
    result.current.fetch({ params: { 'limit': 10, 'countryCode': 'US' }});
  });

  expect(result.current.isLoading).toEqual(true);
  expect(result.current.endpoint).toEqual('https://api.backend.dev/user');
  expect(result.current.url).toEqual('https://api.backend.dev/user?limit=10&countryCode=US');
  expect(result.current.fetch).toBeDefined();

  await waitForNextUpdate();

  expect(result.current.isLoading).toEqual(false);
  expect(result.current.error).toBeUndefined();
  expect(result.current.errorCode).toBeUndefined();
  expect(result.current.data).toEqual({ username: 'randomuser' })
});

test('useQuery - GET /user-error', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useQuery({
    endpoint: 'https://api.backend.dev/user-error',
  }));

  act(() => {
    result.current.fetch();
  });

  expect(result.current.isLoading).toEqual(true);
  expect(result.current.endpoint).toEqual('https://api.backend.dev/user-error');
  expect(result.current.url).toEqual('https://api.backend.dev/user-error');
  expect(result.current.fetch).toBeDefined();

  await waitForNextUpdate();

  expect(result.current.isLoading).toEqual(false);
  expect(result.current.error).toEqual('bad request');
  expect(result.current.errorCode).toEqual(500);
  expect(result.current.data).toBeUndefined();
});
