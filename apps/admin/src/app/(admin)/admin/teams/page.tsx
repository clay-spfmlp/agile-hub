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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/base/alert-dialog';
import { Badge } from '@repo/ui/components/base/badge';
import { Avatar, AvatarFallback } from '@repo/ui/components/base/avatar';
import { StatsCarousel, StatItem } from '@repo/ui/components/stats-carousel';
import { toast } from 'sonner';
import { Textarea } from '@repo/ui/components/base/textarea';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Users, 
  UserCheck, 
  UserX,
  TrendingUp,
  Crown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@repo/ui/components/base/dropdown-menu';

interface Team {
  id: number;
  name: string;
  description: string | null;
  scrumMasterId: number | null;
  scrumMaster: {
    id: number;
    name: string;
    email: string;
  } | null;
  membersCount: number;
  sessionsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Statistics {
  total: number;
  withScrumMaster: number;
  withoutScrumMaster: number;
  totalMembers: number;
  avgMembersPerTeam: number;
}

interface ApiResponse {
  teams: Team[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  statistics: Statistics;
}



export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [scrumMasters, setScrumMasters] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    withScrumMaster: 0,
    withoutScrumMaster: 0,
    totalMembers: 0,
    avgMembersPerTeam: 0
  });
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Modal States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Form States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scrumMasterId: 'none',
  });

  useEffect(() => {
    fetchTeams();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`http://localhost:8080/api/teams?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch teams');

      const data: ApiResponse = await response.json();
      setTeams(data.teams);
      setStatistics(data.statistics);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to fetch teams');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8080/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setAllUsers(data);
      setScrumMasters(data.filter((user: User) => 
        ['SCRUM_MASTER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)
      ));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('auth_token');
      
      const payload = {
        name: formData.name,
        description: formData.description || null,
        scrumMasterId: formData.scrumMasterId && formData.scrumMasterId !== 'none' ? parseInt(formData.scrumMasterId) : null,
      };

      const response = await fetch('http://localhost:8080/api/teams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create team');
      }

      toast.success('Team created successfully');

      await fetchTeams();
      setIsCreateDialogOpen(false);
      setFormData({ name: '', description: '', scrumMasterId: 'none' });
    } catch (error: any) {
      console.error('Error creating team:', error);
      toast.error(error.message || 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !teamToEdit) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('auth_token');
      
      const payload = {
        name: formData.name,
        description: formData.description || null,
        scrumMasterId: formData.scrumMasterId && formData.scrumMasterId !== 'none' ? parseInt(formData.scrumMasterId) : null,
      };

      const response = await fetch(`http://localhost:8080/api/teams/${teamToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team');
      }

      toast.success('Team updated successfully');

      await fetchTeams();
      setIsEditDialogOpen(false);
      setTeamToEdit(null);
      setFormData({ name: '', description: '', scrumMasterId: 'none' });
    } catch (error: any) {
      console.error('Error updating team:', error);
      toast.error(error.message || 'Failed to update team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`http://localhost:8080/api/teams/${teamToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete team');
      }

      toast.success('Team deleted successfully');

      await fetchTeams();
      setIsDeleteDialogOpen(false);
      setTeamToDelete(null);
    } catch (error: any) {
      console.error('Error deleting team:', error);
      toast.error(error.message || 'Failed to delete team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (team: Team) => {
    setTeamToEdit(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      scrumMasterId: team.scrumMasterId?.toString() || 'none',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (team: Team) => {
    setTeamToDelete(team);
    setIsDeleteDialogOpen(true);
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
  };

  const performSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const renderPagination = () => {
    const getPageNumbers = () => {
      const pages = [];
      const maxPagesToShow = 5;
      
      if (totalPages <= maxPagesToShow) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, start + maxPagesToShow - 1);
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    };

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} teams
          {searchTerm && ` (filtered)`}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="bg-white/80 backdrop-blur-sm border-white/20"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-white/80 backdrop-blur-sm border-white/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {getPageNumbers().map((pageNum) => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="icon"
              onClick={() => setCurrentPage(pageNum)}
              className={currentPage === pageNum 
                ? "bg-blue-500 hover:bg-blue-600 text-white" 
                : "bg-white/80 backdrop-blur-sm border-white/20"
              }
            >
              {pageNum}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-white/80 backdrop-blur-sm border-white/20"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="bg-white/80 backdrop-blur-sm border-white/20"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Teams Management
              </h1>
              <p className="text-gray-600">
                {searchTerm 
                  ? `Found ${totalItems} teams matching "${searchTerm}"`
                  : `Manage your ${totalItems} teams`
                }
              </p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Team
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-md border border-white/30 shadow-2xl rounded-3xl max-w-md mx-auto">
                <DialogHeader className="space-y-4 pb-6">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Create New Team
                  </DialogTitle>
                  <p className="text-center text-gray-600 text-sm">
                    Build your dream team with the perfect members
                  </p>
                </DialogHeader>
                <form onSubmit={handleCreateTeam} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="create-name" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Users className="w-4 h-4 mr-2 text-blue-500" />
                      Team Name *
                    </Label>
                    <Input
                      id="create-name"
                      placeholder="Enter an inspiring team name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-white/80 backdrop-blur-sm border-white/40 rounded-xl h-12 text-gray-900 placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-description" className="text-sm font-semibold text-gray-700 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-purple-500" />
                      Description
                    </Label>
                    <Textarea
                      id="create-description"
                      placeholder="Describe your team's mission and goals..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-white/80 backdrop-blur-sm border-white/40 rounded-xl min-h-[100px] text-gray-900 placeholder:text-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-200 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-scrumMaster" className="text-sm font-semibold text-gray-700 flex items-center">
                      <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                      Scrum Master
                    </Label>
                    <Select
                      value={formData.scrumMasterId}
                      onValueChange={(value) => setFormData({ ...formData, scrumMasterId: value })}
                    >
                      <SelectTrigger className="bg-white/80 backdrop-blur-sm border-white/40 rounded-xl h-12 text-gray-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-200">
                        <SelectValue placeholder="Choose a team leader (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-md border-white/40 rounded-xl shadow-2xl">
                        <SelectItem value="none" className="rounded-lg">
                          <div className="flex items-center">
                            <UserX className="w-4 h-4 mr-2 text-gray-400" />
                            No Scrum Master
                          </div>
                        </SelectItem>
                        {scrumMasters.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()} className="rounded-lg">
                            <div className="flex items-center">
                              <Avatar className="w-6 h-6 mr-2">
                                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-xs">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.role}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={isSubmitting}
                      className="flex-1 h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm hover:bg-gray-50 transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:transform-none"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Create Team
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Carousel */}
        <StatsCarousel stats={[
          {
            title: 'Total Teams',
            value: statistics.total,
            icon: Users,
            description: 'All teams in the system',
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-500/10',
            iconColor: 'text-blue-500'
          },
          {
            title: 'With Scrum Master',
            value: statistics.withScrumMaster,
            icon: UserCheck,
            description: 'Teams with assigned Scrum Master',
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-500/10',
            iconColor: 'text-green-500'
          },
          {
            title: 'Without Scrum Master',
            value: statistics.withoutScrumMaster,
            icon: UserX,
            description: 'Teams needing Scrum Master',
            color: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-500/10',
            iconColor: 'text-orange-500'
          },
          {
            title: 'Total Members',
            value: statistics.totalMembers,
            icon: TrendingUp,
            description: 'All team members',
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-500/10',
            iconColor: 'text-purple-500'
          },
          {
            title: 'Avg Members/Team',
            value: Math.round(statistics.avgMembersPerTeam * 10) / 10,
            icon: Crown,
            description: 'Average team size',
            color: 'from-indigo-500 to-indigo-600',
            bgColor: 'bg-indigo-500/10',
            iconColor: 'text-indigo-500'
          }
        ]} />

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search teams by name or description..."
                  value={searchInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="pl-10 pr-4 bg-white/80 backdrop-blur-sm border-white/30 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={performSearch}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 h-11 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                {(searchInput || searchTerm) && (
                  <Button
                    onClick={clearSearch}
                    variant="outline"
                    className="h-11 px-4 rounded-xl border-2 border-gray-200 bg-white/80 hover:bg-gray-50 transition-all duration-200"
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            {searchTerm && (
              <div className="mt-3 text-sm text-gray-600">
                <span className="font-medium">Searching for:</span> "{searchTerm}"
              </div>
            )}
          </div>
        </div>

        {/* Teams Table */}
        <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 hover:bg-white/50">
                <TableHead className="font-semibold text-gray-700">Team</TableHead>
                <TableHead className="font-semibold text-gray-700">Description</TableHead>
                <TableHead className="font-semibold text-gray-700">Scrum Master</TableHead>
                <TableHead className="font-semibold text-gray-700">Members</TableHead>
                <TableHead className="font-semibold text-gray-700">Sessions</TableHead>
                <TableHead className="font-semibold text-gray-700">Created</TableHead>
                <TableHead className="font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id} className="border-white/20 hover:bg-white/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                          {getInitials(team.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900">{team.name}</div>
                        <div className="text-sm text-gray-500">ID: {team.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {team.description ? (
                        <p className="text-gray-700 truncate" title={team.description}>
                          {team.description}
                        </p>
                      ) : (
                        <span className="text-gray-400 italic">No description</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.scrumMaster ? (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8 border border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-xs font-semibold">
                            {getInitials(team.scrumMaster.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{team.scrumMaster.name}</div>
                          <div className="text-xs text-gray-500">{team.scrumMaster.email}</div>
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                        Not Assigned
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{team.membersCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{team.sessionsCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {new Date(team.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-white/80">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-white/20">
                        <DropdownMenuItem onClick={() => openEditDialog(team)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(team)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-white/95 via-white/90 to-white/95 backdrop-blur-md border border-white/30 shadow-2xl rounded-3xl max-w-md mx-auto">
          <DialogHeader className="space-y-4 pb-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Edit className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Team
            </DialogTitle>
            <p className="text-center text-gray-600 text-sm">
              Update your team's details and configuration
            </p>
          </DialogHeader>
          <form onSubmit={handleEditTeam} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-semibold text-gray-700 flex items-center">
                <Users className="w-4 h-4 mr-2 text-blue-500" />
                Team Name *
              </Label>
              <Input
                id="edit-name"
                placeholder="Enter an inspiring team name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white/80 backdrop-blur-sm border-white/40 rounded-xl h-12 text-gray-900 placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-700 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-purple-500" />
                Description
              </Label>
              <Textarea
                id="edit-description"
                placeholder="Describe your team's mission and goals..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/80 backdrop-blur-sm border-white/40 rounded-xl min-h-[100px] text-gray-900 placeholder:text-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-200 resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-scrumMaster" className="text-sm font-semibold text-gray-700 flex items-center">
                <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                Scrum Master
              </Label>
              <Select
                value={formData.scrumMasterId}
                onValueChange={(value) => setFormData({ ...formData, scrumMasterId: value })}
              >
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-white/40 rounded-xl h-12 text-gray-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all duration-200">
                  <SelectValue placeholder="Choose a team leader (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border-white/40 rounded-xl shadow-2xl">
                  <SelectItem value="none" className="rounded-lg">
                    <div className="flex items-center">
                      <UserX className="w-4 h-4 mr-2 text-gray-400" />
                      No Scrum Master
                    </div>
                  </SelectItem>
                  {scrumMasters.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()} className="rounded-lg">
                      <div className="flex items-center">
                        <Avatar className="w-6 h-6 mr-2">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.role}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Update Team
                  </div>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete team "{teamToDelete?.name}"? 
              This action cannot be undone and will also delete:
              <ul className="mt-2 ml-4 list-disc text-sm">
                <li>All team members</li>
                <li>All planning sessions</li>
                <li>All stories and votes</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}