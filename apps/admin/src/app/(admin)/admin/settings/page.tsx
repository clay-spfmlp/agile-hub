'use client';

import React, { useEffect, useState } from 'react';

interface Settings {
  defaultStoryPoints: number[];
  defaultTShirtSizes: string[];
  allowCustomVotes: boolean;
  requireVoteConfirmation: boolean;
  autoRevealVotes: boolean;
  votingTimeLimit: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    defaultStoryPoints: [1, 2, 3, 5, 8, 13, 21],
    defaultTShirtSizes: ['XS', 'S', 'M', 'L', 'XL'],
    allowCustomVotes: false,
    requireVoteConfirmation: true,
    autoRevealVotes: false,
    votingTimeLimit: 60,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="mt-2 text-sm text-gray-700">
            Configure global settings for the Fun Scrum application.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
        <div className="space-y-8 divide-y divide-gray-200">
          <div>
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Voting Settings</h3>
              <p className="mt-1 text-sm text-gray-500">
                Configure how voting works in planning sessions.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="storyPoints" className="block text-sm font-medium text-gray-700">
                  Default Story Points
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="storyPoints"
                    id="storyPoints"
                    value={settings.defaultStoryPoints.join(', ')}
                    onChange={(e) => {
                      const points = e.target.value.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
                      setSettings({ ...settings, defaultStoryPoints: points });
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="1, 2, 3, 5, 8, 13, 21"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Comma-separated list of story point values.
                </p>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="tShirtSizes" className="block text-sm font-medium text-gray-700">
                  Default T-Shirt Sizes
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="tShirtSizes"
                    id="tShirtSizes"
                    value={settings.defaultTShirtSizes.join(', ')}
                    onChange={(e) => {
                      const sizes = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                      setSettings({ ...settings, defaultTShirtSizes: sizes });
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="XS, S, M, L, XL"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Comma-separated list of T-shirt size values.
                </p>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="allowCustomVotes"
                      name="allowCustomVotes"
                      type="checkbox"
                      checked={settings.allowCustomVotes}
                      onChange={(e) => setSettings({ ...settings, allowCustomVotes: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="allowCustomVotes" className="font-medium text-gray-700">
                      Allow Custom Votes
                    </label>
                    <p className="text-gray-500">
                      Allow users to enter custom vote values instead of using predefined options.
                    </p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="requireVoteConfirmation"
                      name="requireVoteConfirmation"
                      type="checkbox"
                      checked={settings.requireVoteConfirmation}
                      onChange={(e) => setSettings({ ...settings, requireVoteConfirmation: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="requireVoteConfirmation" className="font-medium text-gray-700">
                      Require Vote Confirmation
                    </label>
                    <p className="text-gray-500">
                      Require users to confirm their votes before they are counted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="autoRevealVotes"
                      name="autoRevealVotes"
                      type="checkbox"
                      checked={settings.autoRevealVotes}
                      onChange={(e) => setSettings({ ...settings, autoRevealVotes: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="autoRevealVotes" className="font-medium text-gray-700">
                      Auto-Reveal Votes
                    </label>
                    <p className="text-gray-500">
                      Automatically reveal votes when all participants have voted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="votingTimeLimit" className="block text-sm font-medium text-gray-700">
                  Voting Time Limit (seconds)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="votingTimeLimit"
                    id="votingTimeLimit"
                    value={settings.votingTimeLimit}
                    onChange={(e) => setSettings({ ...settings, votingTimeLimit: parseInt(e.target.value) })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    min="0"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Set to 0 for no time limit.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => fetchSettings()}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 