import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import AuthPage from '../../pages/AuthPage';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn()
    }
  }
}));

describe('AuthPage', () => {
  it('renders sign in form by default', () => {
    render(
      <BrowserRouter>
        <AuthProvider session={null}>
          <AuthPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('switches to sign up form', async () => {
    render(
      <BrowserRouter>
        <AuthProvider session={null}>
          <AuthPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Sign up'));
    expect(screen.getByText('Create an account')).toBeInTheDocument();
  });

  it('handles sign in submission', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({ data: {}, error: null });
    supabase.auth.signInWithPassword = mockSignIn;

    render(
      <BrowserRouter>
        <AuthProvider session={null}>
          <AuthPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('displays error message on failed sign in', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      error: { message: 'Invalid credentials' }
    });
    supabase.auth.signInWithPassword = mockSignIn;

    render(
      <BrowserRouter>
        <AuthProvider session={null}>
          <AuthPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' }
    });
    fireEvent.click(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});