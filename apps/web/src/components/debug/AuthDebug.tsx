import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function AuthDebug() {
  const { user, token, isAuthenticated, isLoading } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-xs">
      <h4 className="font-bold mb-2">Debug Auth</h4>
      <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
      <div>Loading: {isLoading ? '⏳' : '✅'}</div>
      <div>User: {user ? `${user.firstName} ${user.lastName}` : 'None'}</div>
      <div>Token: {token ? '✅' : '❌'}</div>
      <div>Token Preview: {token ? `${token.substring(0, 20)}...` : 'None'}</div>
      <div>LocalStorage Token: {localStorage.getItem('auth_token') ? '✅' : '❌'}</div>
    </div>
  );
}
