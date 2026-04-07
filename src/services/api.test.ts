import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { api, DEFAULT_CITY, CITY_ENDPOINTS } from './api';

const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
  localStorage.clear();
});

afterAll(() => mock.restore());

describe('request interceptor — city injection', () => {
  it('injects city param on GET requests to CITY_ENDPOINTS', async () => {
    const endpoint = CITY_ENDPOINTS[0]; // '/events/feed'
    mock.onGet(endpoint).reply(200, []);
    await api.get(endpoint);
    expect(mock.history.get[0].params?.city).toBe(DEFAULT_CITY);
  });

  it('does not override city param if already provided', async () => {
    const endpoint = CITY_ENDPOINTS[0];
    mock.onGet(endpoint).reply(200, []);
    await api.get(endpoint, { params: { city: 'São Paulo' } });
    expect(mock.history.get[0].params?.city).toBe('São Paulo');
  });

  it('does not inject city for non-CITY_ENDPOINTS', async () => {
    mock.onGet('/partners/events').reply(200, []);
    await api.get('/partners/events');
    expect(mock.history.get[0].params?.city).toBeUndefined();
  });

  it('does not inject city on POST requests', async () => {
    mock.onPost(CITY_ENDPOINTS[0]).reply(200, {});
    await api.post(CITY_ENDPOINTS[0], {});
    expect(mock.history.post[0].params?.city).toBeUndefined();
  });
});

describe('request interceptor — auth header', () => {
  it('adds Authorization header when bf_token is in localStorage', async () => {
    localStorage.setItem('bf_token', 'my-jwt-token');
    mock.onGet('/partners/events').reply(200, []);
    await api.get('/partners/events');
    expect(mock.history.get[0].headers?.Authorization).toBe('Bearer my-jwt-token');
  });

  it('does not add Authorization header when no token', async () => {
    mock.onGet('/partners/events').reply(200, []);
    await api.get('/partners/events');
    expect(mock.history.get[0].headers?.Authorization).toBeUndefined();
  });
});

describe('response interceptor — 401 handling', () => {
  it('removes bf_token from localStorage on 401', async () => {
    localStorage.setItem('bf_token', 'expired-token');
    mock.onGet('/partners/events').reply(401, { detail: 'Token expirado' });
    await expect(api.get('/partners/events')).rejects.toThrow();
    expect(localStorage.getItem('bf_token')).toBeNull();
  });

  it('does not crash if there is no token when 401 arrives', async () => {
    mock.onGet('/partners/events').reply(401, { detail: 'Unauthorized' });
    await expect(api.get('/partners/events')).rejects.toThrow();
    // Should not throw, just reject
    expect(localStorage.getItem('bf_token')).toBeNull();
  });
});
