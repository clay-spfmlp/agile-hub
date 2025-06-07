'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@repo/ui/components/base/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';
import { Input } from '@repo/ui/components/base/input';
import { Label } from '@repo/ui/components/base/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/base/dialog';
import { MultiSelect, Option } from '@repo/ui/components/multi-select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@repo/ui/components/base/dropdown-menu';
import { MoreVertical } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  description: string | null;
  scrumMasters: Array<{
    id: number;
    name: string;
    email: string;
    isLead: boolean;
  }>;
  members: Array<{
    id: number;
    userId: number;
    role: string;
  }>;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'SCRUM_MASTER';
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [scrumMasters, setScrumMasters] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    scrumMasterIds: [] as string[],
  });

  useEffect(() => {
    fetchTeams();
    fetchScrumMasters();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScrumMasters = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setScrumMasters(data.filter((user: User) => user.role === 'SCRUM_MASTER'));
    } catch (error) {
      console.error('Error fetching scrum masters:', error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTeam,
          scrumMasterIds: newTeam.scrumMasterIds.map(id => parseInt(id)),
        }),
      });

      if (!response.ok) throw new Error('Failed to create team');

      await fetchTeams();
      setIsDialogOpen(false);
      setNewTeam({ name: '', description: '', scrumMasterIds: [] });
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      setTeams(teams.filter(team => team.id !== teamId));
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const scrumMasterOptions: Option[] = scrumMasters.map(sm => ({
    value: sm.id.toString(),
    label: sm.name,
  }));

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teams</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Team</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  placeholder="Enter team name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="scrumMasters">Scrum Masters</Label>
                <MultiSelect
                  options={scrumMasterOptions}
                  selected={newTeam.scrumMasterIds}
                  onChange={(selected) => setNewTeam({ ...newTeam, scrumMasterIds: selected })}
                  placeholder="Select Scrum Masters..."
                />
              </div>
              <Button type="submit">Create Team</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Scrum Masters</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow key={team.id}>
              <TableCell>{team.name}</TableCell>
              <TableCell>{team.description || '-'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {team.scrumMasters?.map((sm) => (
                    <span
                      key={sm.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                    >
                      {sm.name}
                      {sm.isLead && ' (Lead)'}
                    </span>
                  )) || '-'}
                </div>
              </TableCell>
              <TableCell>{team.members.length}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => alert('Edit team coming soon!')}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDeleteTeam(team.id)} className="text-destructive">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 