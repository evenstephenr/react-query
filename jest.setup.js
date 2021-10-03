import 'regenerator-runtime/runtime'
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterAll(() => server.close());
