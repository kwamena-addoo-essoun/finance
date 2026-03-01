import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock the api module so no real HTTP calls are made
jest.mock('../utils/api', () => ({
  authAPI: {
    login: jest.fn(),
  },
}));

// Mock zustand authStore
jest.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    setAuth: jest.fn(),
  }),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import LoginPage from '../pages/LoginPage';
import { authAPI } from '../utils/api';

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders username and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders the login button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('navigates to / on successful login', async () => {
    // Login now returns session metadata (cookies are set by the server)
    authAPI.login.mockResolvedValueOnce({
      data: { username: 'alice', is_verified: true, is_admin: false },
    });
    renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows an error message on failed login', async () => {
    authAPI.login.mockRejectedValueOnce({
      response: { data: { detail: 'Invalid credentials' } },
    });
    renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() =>
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    );
  });

  it('shows "Logging in..." while the request is in flight', async () => {
    let resolveLogin;
    authAPI.login.mockReturnValueOnce(
      new Promise((res) => { resolveLogin = res; })
    );
    renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/logging in/i)).toBeInTheDocument();

    // Clean up the pending promise
    resolveLogin({ data: { username: 'alice', is_verified: true, is_admin: false } });
  });
});
