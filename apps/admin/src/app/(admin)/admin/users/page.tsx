'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/base/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
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
  Users, 
  UserCheck, 
  Crown, 
  Plus,
  Search,
  Filter,
  Calendar,
  Mail,
  UserCircle,
  TrendingUp,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserX,
  FileText,
  Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/base/dropdown-menu';
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
import { Avatar, AvatarFallback } from '@repo/ui/components/base/avatar';
import { StatsCarousel, StatItem } from '@repo/ui/components/stats-carousel';
import { MultiSelect } from '@repo/ui/components/multi-select';
import { useAuthenticatedFetch, UserRole, getRoleConfig, getRoleLabel, getRoleColor, getAssignableRoles, useAuth as useAuthContext } from '@repo/auth';

interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  managedTeams: Array<{ id: number; name: string }>;
  memberTeams: Array<{ id: number; name: string }>;
  allTeams: Array<{ id: number; name: string }>;
  created_at: string;
}

interface Team {
  id: number;
  name: string;
  description: string | null;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '-'; // Return dash for invalid dates
  }
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getRoleIcon = (role: UserRole) => {
  const config = getRoleConfig(role);
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return Crown;
    case 'SCRUM_MASTER':
      return UserCheck;
    default:
      return UserCircle;
  }
};

const getRoleBadgeClasses = (role: UserRole) => {
  const colors = getRoleColor(role);
  return `${colors.bg} ${colors.text} ${colors.border}`;
};



export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'USER' as UserRole,
    password: '',
    teamIds: [] as number[],
  });
  const [editUser, setEditUser] = useState({
    email: '',
    name: '',
    role: 'USER' as UserRole,
    password: '',
    teamIds: [] as number[],
  });

  const authenticatedFetch = useAuthenticatedFetch();
  const { user: currentUser } = useAuthContext();

  // Get roles that current user can assign
  const assignableRoles = currentUser ? getAssignableRoles(currentUser.role as UserRole) : [];

  // Search functions
  const performSearch = () => {
    setActiveSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8080/api/teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setError(null);
      const response = await authenticatedFetch('http://localhost:8080/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await authenticatedFetch('http://localhost:8080/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      await fetchUsers();
      setIsDialogOpen(false);
      setNewUser({ email: '', name: '', role: 'USER', password: '', teamIds: [] });
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      email: user.email,
      name: user.name,
      role: user.role,
      password: '', // Leave empty for no password change
      teamIds: user.allTeams ? user.allTeams.map(team => team.id) : [],
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedUser) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const updateData = {
        email: editUser.email,
        name: editUser.name,
        role: editUser.role,
        ...(editUser.password && { password: editUser.password }),
        ...(editUser.teamIds.length > 0 && { teamIds: editUser.teamIds }),
      };
      
      const response = await authenticatedFetch(`http://localhost:8080/api/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      await fetchUsers();
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setEditUser({ email: '', name: '', role: 'USER', password: '', teamIds: [] });
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (isSubmitting || !selectedUser) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await authenticatedFetch(`http://localhost:8080/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      await fetchUsers();
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = activeSearchTerm === '' || 
                         user.name.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(activeSearchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchTerm, filterRole]);

  // Calculate role-based statistics (use all users, not filtered)
  const roleStats = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<UserRole, number>);

  const userStats = {
    total: users.length,
    filtered: filteredUsers.length,
    recentlyAdded: users.filter(u => {
      const createdDate = new Date(u.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate > weekAgo;
    }).length,
    ...roleStats
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-white" />
          </div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-indigo-600/30 rounded-2xl blur-xl"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                User Management
              </h1>
              <p className="text-gray-600 mt-1">Manage your 18 users</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <StatsCarousel stats={[
          {
            title: 'Total Users',
            value: users.length,
            icon: Users,
            description: 'All registered users',
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-500/10',
            iconColor: 'text-blue-500'
          },
          {
            title: 'Administrators',
            value: (roleStats.ADMIN || 0) + (roleStats.SUPER_ADMIN || 0),
            icon: Crown,
            description: 'System administrators with full platform access',
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-500/10',
            iconColor: 'text-purple-500'
          },
          {
            title: 'Scrum Masters',
            value: roleStats.SCRUM_MASTER || 0,
            icon: UserCheck,
            description: 'Team leads with planning and facilitation access',
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-500/10',
            iconColor: 'text-green-500'
          },
          {
            title: 'Team Members',
            value: roleStats.USER || 0,
            icon: UserCircle,
            description: 'Standard team members with basic access',
            color: 'from-indigo-500 to-indigo-600',
            bgColor: 'bg-indigo-500/10',
            iconColor: 'text-indigo-500'
          }
        ]} />

        {/* Controls and Table */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <CardTitle className="text-xl">All Users</CardTitle>
                <CardDescription>
                  {filteredUsers.length === users.length 
                    ? `Manage and view all ${users.length} registered users`
                    : `Showing ${filteredUsers.length} of ${users.length} users`
                  }
                </CardDescription>
              </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-slate-600 to-indigo-600 hover:from-slate-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
          </DialogTrigger>
                <DialogContent className="bg-white/95 backdrop-blur border-white/20 shadow-2xl max-w-md">
                  <DialogHeader className="text-center pb-6">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                      <Plus className="h-8 w-8 text-white" />
                    </div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Create New User
                    </DialogTitle>
                    <p className="text-gray-600 mt-2">Add a new user to your team</p>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="h-12 bg-white/50 backdrop-blur border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-green-500" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="h-12 bg-white/50 backdrop-blur border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="role" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Crown className="h-4 w-4 text-purple-500" />
                        Role
                      </Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value: UserRole) =>
                          setNewUser({ ...newUser, role: value })
                        }
                      >
                        <SelectTrigger className="h-12 bg-white/50 backdrop-blur border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur border-white/20">
                          {assignableRoles.map((roleKey) => {
                            const config = getRoleConfig(roleKey);
                            return (
                              <SelectItem key={roleKey} value={roleKey}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${config.color.bg}`}></span>
                                  <span>{config.label}</span>
                                  <span className="text-xs text-gray-500">- {config.description}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-500" />
                        Password (Optional)
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Leave empty for default password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="h-12 bg-white/50 backdrop-blur border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                      />
                      <p className="text-xs text-gray-500">If left empty, default password will be assigned</p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="teams" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-blue-500" />
                        Teams (Optional)
                      </Label>
                      <MultiSelect
                        options={teams.map(team => ({ value: team.id.toString(), label: team.name }))}
                        selected={newUser.teamIds.map(id => id.toString())}
                        onChange={(selected) => setNewUser({ ...newUser, teamIds: selected.map(s => parseInt(s)) })}
                        placeholder="Select teams to assign..."
                        className="bg-white/50 backdrop-blur border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                      />
                      <p className="text-xs text-gray-500">User will be added as a member to selected teams</p>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 rounded-xl font-semibold"
                    >
                      {isSubmitting ? (
                        <>
                          <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create User
                        </>
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and Filter */}
            <div className="space-y-4 mt-6">
              {/* Search Section */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl blur-sm"></div>
                  <div className="relative flex">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="pl-12 pr-24 h-12 bg-white/90 backdrop-blur border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {searchInput && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearSearch}
                          className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                        >
                          <UserX className="h-4 w-4 text-gray-400" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={performSearch}
                        size="sm"
                        className="h-8 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg rounded-lg"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-3 bg-white/80 backdrop-blur border border-white/20 rounded-xl shadow-lg">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger className="border-0 bg-transparent h-6 text-sm font-medium min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur border-white/20">
                        <SelectItem value="ALL">All Roles</SelectItem>
                        {Object.keys(roleStats).map((roleKey) => {
                          const config = getRoleConfig(roleKey as UserRole);
                          return (
                            <SelectItem key={roleKey} value={roleKey}>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${config.color.bg}`}></span>
                                <span>{config.label}s</span>
                                <span className="text-xs text-gray-500">({roleStats[roleKey as UserRole]})</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Search Results Indicator */}
              {activeSearchTerm && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50/80 backdrop-blur border border-blue-200/50 rounded-lg">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-700">
                    Searching for: <span className="font-medium">"{activeSearchTerm}"</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="ml-auto h-6 w-6 p-0 hover:bg-blue-100 text-blue-500"
                  >
                    <UserX className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200/50">
                    <TableHead className="font-semibold text-gray-700">User</TableHead>
                    <TableHead className="font-semibold text-gray-700">Role</TableHead>
                    <TableHead className="font-semibold text-gray-700">Teams</TableHead>
                    <TableHead className="font-semibold text-gray-700">Joined</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const RoleIcon = getRoleIcon(user.role);
                    return (
                      <TableRow key={user.id} className="border-b border-gray-100/50 hover:bg-gray-50/50 transition-colors">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-slate-700 font-semibold text-sm">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClasses(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          {user.allTeams && user.allTeams.length > 0 ? (
                            <div className="space-y-1">
                              <div className="text-sm text-gray-700">
                                {user.allTeams.map((team) => team.name).join(', ')}
                              </div>
                              {user.managedTeams && user.managedTeams.length > 0 && (
                                <div className="text-xs text-green-600">
                                  Manages: {user.managedTeams.map((team) => team.name).join(', ')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No teams assigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm text-gray-700 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {formatDate(user.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur">
                              <DropdownMenuItem onClick={() => handleEditUser(user)} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user)} 
                                className="cursor-pointer text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {paginatedUsers.length === 0 && filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No users found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </CardContent>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
                  </span>
                  {filteredUsers.length !== users.length && (
                    <span className="text-gray-400">
                      (filtered from {users.length} total)
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* First Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="w-9 h-9 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Previous Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-9 h-9 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return page;
                    }).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-9 h-9 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Next Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  {/* Last Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-white/95 backdrop-blur">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="user@example.com"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="edit-name"
                  placeholder="John Doe"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="h-11"
                  required
                />
              </div>
                                    <div className="space-y-2">
                        <Label htmlFor="edit-role" className="text-sm font-medium">Role</Label>
                <Select
                          value={editUser.role}
                          onValueChange={(value: UserRole) =>
                            setEditUser({ ...editUser, role: value })
                          }
                        >
                          <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                            {assignableRoles.map((roleKey) => {
                              const config = getRoleConfig(roleKey);
                              return (
                                <SelectItem key={roleKey} value={roleKey}>
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${config.color.bg}`}></span>
                                    <span>{config.label}</span>
                                    <span className="text-xs text-gray-500">- {config.description}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                  </SelectContent>
                </Select>
                      </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password" className="text-sm font-medium">New Password (Optional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Leave empty to keep current password"
                  value={editUser.password}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">Only fill this if you want to change the password</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-teams" className="text-sm font-medium">Teams (Optional)</Label>
                <MultiSelect
                  options={teams.map(team => ({ value: team.id.toString(), label: team.name }))}
                  selected={editUser.teamIds.map(id => id.toString())}
                  onChange={(selected) => setEditUser({ ...editUser, teamIds: selected.map(s => parseInt(s)) })}
                  placeholder="Select teams to assign..."
                  className="h-11"
                />
                <p className="text-xs text-gray-500">User will be assigned to selected teams</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-slate-600 to-indigo-600 hover:from-slate-700 hover:to-indigo-700"
                >
                  {isSubmitting ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-white/95 backdrop-blur">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Delete User
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Are you sure you want to delete <strong>{selectedUser?.name}</strong>? 
                  This action cannot be undone and will permanently remove the user and all associated data.
                </p>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Error:</span>
                    </div>
                    <p className="mt-1">{error}</p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setError(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteUser}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? 'Deleting...' : 'Delete User'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 