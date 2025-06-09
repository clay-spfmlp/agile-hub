'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';

interface UserProfileProps {
  apiBaseUrl: string;
}

export function UserProfile({ apiBaseUrl }: UserProfileProps) {
  const { user, loading: authLoading } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticatedFetch(`${apiBaseUrl}/api/protected/profile`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  if (authLoading) {
    return <div className="p-4">Loading authentication...</div>;
  }

  if (!user) {
    return <div className="p-4">Please log in to view your profile.</div>;
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      
      {loading && <div className="text-blue-600">Loading profile...</div>}
      
      {error && (
        <div className="text-red-600 mb-4">
          Error: {error}
          <button 
            onClick={fetchProfile}
            className="ml-2 text-blue-600 underline"
          >
            Retry
          </button>
        </div>
      )}
      
      {profileData && (
        <div className="space-y-2">
          <div><strong>Name:</strong> {profileData.user.name}</div>
          <div><strong>Email:</strong> {profileData.user.email}</div>
          <div><strong>Role:</strong> {profileData.user.role}</div>
          <div><strong>ID:</strong> {profileData.user.id}</div>
        </div>
      )}
      
      <button
        onClick={fetchProfile}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Refresh Profile
      </button>
    </div>
  );
} 