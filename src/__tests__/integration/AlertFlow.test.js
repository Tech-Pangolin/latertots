import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/testUtils';
import UserProfile from '../../components/Pages/UserProfile';

// Mock all the dependencies
jest.mock('../../components/AuthProvider', () => ({
  useAuth: () => ({
    currentUser: { Name: 'Test User', Email: 'test@example.com', PhotoURL: null },
  }),
}));

jest.mock('../../Hooks/query-related/useChildrenRQ', () => ({
  useChildrenRQ: () => ({ data: [] }),
}));

jest.mock('../../Hooks/query-related/useContactsRQ', () => ({
  useContactsRQ: () => ({ data: [] }),
}));

// Mock all the child components
jest.mock('../../components/Pages/ChildRegistration', () => () => <div>Child Registration</div>);
jest.mock('../../components/Pages/ContactRegistration', () => () => <div>Contact Registration</div>);
jest.mock('../../components/Shared/UserForm', () => () => <div>User Form</div>);
jest.mock('../../components/Shared/ChildCard', () => () => <div>Child Card</div>);
jest.mock('../../components/Shared/ContactsTable', () => () => <div>Contacts Table</div>);

describe('Alert Flow Integration', () => {
  it('displays alert and switches tab when navigating with alert state', async () => {
    const alertState = {
      alerts: [{ id: '1', type: 'warning', message: 'Please register a child' }],
      switchToTab: 'children',
    };

    renderWithProviders(<UserProfile />, {
      route: '/profile',
      locationState: alertState,
    });

    // Wait for the alert to be displayed
    await waitFor(() => {
      expect(screen.getByText('Please register a child')).toBeInTheDocument();
    });

    // Wait for the tab to be switched
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /children/i })).toHaveClass('active');
    });
  });

  it('allows dismissing alerts', async () => {
    const alertState = {
      alerts: [{ id: '1', type: 'warning', message: 'Test warning' }],
    };

    renderWithProviders(<UserProfile />, {
      route: '/profile',
      locationState: alertState,
    });

    // Wait for the alert to be displayed
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    // Click the dismiss button within the alert
    const alert = screen.getByRole('alert');
    const closeButton = alert.querySelector('button[aria-label="Close"]');
    fireEvent.click(closeButton);
    
    // Wait for the alert to be removed
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('handles navigation without alerts gracefully', () => {
    renderWithProviders(<UserProfile />, { route: '/profile' });
    
    expect(screen.getByRole('tab', { name: /user info/i })).toHaveClass('active');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
