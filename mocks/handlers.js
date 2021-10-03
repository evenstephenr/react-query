import { rest } from 'msw'

export const handlers = [
  rest.get('https://api.backend.dev/user', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        username: 'randomuser',
      }),
    );
  }),
  rest.get('https://api.backend.dev/user-error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        error: "bad request",
      }),
    );
  }),
];
