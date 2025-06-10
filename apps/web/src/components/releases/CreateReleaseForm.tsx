'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { 
  X, 
  Package, 
  Plus,
  Minus,
  Calendar
} from 'lucide-react';

interface Team {
  id: number;
  name: string;
}

interface CreateReleaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teams: Team[];
}

interface ReleaseFormData {
  teamId: string;
  name: string;
  version: string;
  description: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  targetDate: string;
  actualDate: string;
  goals: string[];
}

export function CreateReleaseForm({ isOpen, onClose, onSuccess, teams }: CreateReleaseFormProps) {
  const [formData, setFormData] = useState<ReleaseFormData>({
    teamId: '',
    name: '',
    version: '',
    description: '',
    status: 'PLANNING',
    startDate: '',
    targetDate: '',
    actualDate: '',
    goals: ['']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teams.length > 0 && !formData.teamId) {
      const firstTeam = teams[0];
      if (firstTeam && firstTeam.id) {
        setFormData(prev => ({ ...prev, teamId: firstTeam.id.toString() }));
      }
    }
  }, [teams, formData.teamId]);

  const handleInputChange = (field: keyof ReleaseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...formData.goals];
    newGoals[index] = value;
    setFormData(prev => ({ ...prev, goals: newGoals }));
  };

  const addGoal = () => {
    setFormData(prev => ({ ...prev, goals: [...prev.goals, ''] }));
  };

  const removeGoal = (index: number) => {
    if (formData.goals.length > 1) {
      const newGoals = formData.goals.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, goals: newGoals }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        teamId: parseInt(formData.teamId),
        goals: formData.goals.filter(goal => goal.trim() !== ''),
        startDate: formData.startDate || undefined,
        targetDate: formData.targetDate || undefined,
        actualDate: formData.actualDate || undefined,
      };

      const response = await fetch('http://localhost:8080/api/releases', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          teamId: teams.length > 0 && teams[0] ? teams[0].id.toString() : '',
          name: '',
          version: '',
          description: '',
          status: 'PLANNING',
          startDate: '',
          targetDate: '',
          actualDate: '',
          goals: ['']
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create release');
      }
    } catch (error) {
      console.error('Error creating release:', error);
      setError('Failed to create release');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Create New Release
            </CardTitle>
            <CardDescription>
              Define a new product release with goals and timeline
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Team Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team *
              </label>
              <select
                value={formData.teamId}
                onChange={(e) => handleInputChange('teamId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                required
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Release Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., User Authentication System"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version *
                </label>
                <Input
                  value={formData.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  placeholder="e.g., 1.0.0"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={3}
                placeholder="Describe the purpose and scope of this release..."
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date
                </label>
                <Input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => handleInputChange('targetDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Date
                </label>
                <Input
                  type="date"
                  value={formData.actualDate}
                  onChange={(e) => handleInputChange('actualDate', e.target.value)}
                />
              </div>
            </div>

            {/* Goals */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Release Goals
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addGoal}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Goal
                </Button>
              </div>
              <div className="space-y-2">
                {formData.goals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={goal}
                      onChange={(e) => handleGoalChange(index, e.target.value)}
                      placeholder={`Goal ${index + 1}`}
                    />
                    {formData.goals.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeGoal(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Release'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 