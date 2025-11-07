'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types/models';
import { 
  UserPlus, 
  Pencil,
  Trash2,
  Search,
  MoreVertical,
  Filter,
  Calendar,
  ExternalLink,
  ChevronRight,
  Home
} from "lucide-react";
import Link from "next/link";

// Composants Shadcn/UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  plan?: 'STARTER' | 'PRO' | 'PREMIUM';
  permissions: string[];
  image: string | null;
  createdAt: string;
  lastLogin?: string | null;
};

type Event = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  slug: string;
}

export default function UsersManagementPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Mettre à jour la date de dernière connexion au chargement de la page
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetch('/api/auth/update-last-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(err => {
        console.error('Erreur lors de la mise à jour de la date de dernière connexion:', err);
      });
    }
  }, [session, status]);

  // Charger les utilisateurs
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers();
    }
  }, [session, status, page, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?page=${page}&limit=10&search=${searchTerm}`);
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
    
    // Charger les événements de l'utilisateur
    if (user.id) {
      setLoadingEvents(true);
      fetch(`/api/users/${user.id}/events`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setUserEvents(data.events || []);
        })
        .catch(err => {
          console.error('Erreur lors du chargement des événements:', err);
          setUserEvents([]);
        })
        .finally(() => setLoadingEvents(false));
    }
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }
      
      toast.success('Utilisateur supprimé avec succès');
      setShowDeleteDialog(false);
      fetchUsers();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Une erreur est survenue');
      } else {
        toast.error('Une erreur inconnue est survenue');
      }
    }
  };

  const handleCreateUser = () => {
    setShowCreateModal(true);
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return 'border-red-500 text-red-500';
      case UserRole.ORGANIZER:
        return 'border-blue-500 text-blue-500';
      case UserRole.STAFF:
        return 'border-amber-500 text-amber-500';
      default:
        return 'border-slate-500 text-slate-500';
    }
  };

  const getPlanBadgeColor = (plan: 'STARTER' | 'PRO' | 'PREMIUM'): string => {
    switch (plan) {
      case 'STARTER':
        return 'border-gray-500 text-gray-500';
      case 'PRO':
        return 'border-[#81B441] text-[#81B441]';
      case 'PREMIUM':
        return 'border-yellow-500 text-yellow-500';
      default:
        return 'border-slate-500 text-slate-500';
    }
  };

  if (status === 'loading' || (status === 'authenticated' && !session)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container flex h-screen bg-gray-50">
      <Sidebar onExpandChange={(expanded) => setSidebarExpanded(expanded)} />
      <div 
        className={`dashboard-content flex-1 overflow-auto transition-all duration-300 ${
          sidebarExpanded ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="container mx-auto py-8 px-4">
          
          {/* Breadcrumb navigation */}
          <nav className="flex mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/dashboard" className="inline-flex items-center hover:text-gray-900">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4 mx-1" />
                  <span className="text-gray-900 font-medium">Gestion des utilisateurs</span>
                </div>
              </li>
            </ol>
          </nav>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">Gestion des utilisateurs</CardTitle>
                <CardDescription>
                  Gérez les utilisateurs de la plateforme
                </CardDescription>
              </div>
              <Button onClick={handleCreateUser} style={{ backgroundColor: '#81B441' }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Créer un utilisateur
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 my-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filtrer par rôle</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setSearchTerm('')}>
                      Tous les rôles
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setSearchTerm('ADMIN')}>
                      Administrateurs
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setSearchTerm('ORGANIZER')}>
                      Organisateurs
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setSearchTerm('STAFF')}>
                      Staff
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setSearchTerm('USER')}>
                      Utilisateurs
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Créé le</TableHead>
                      <TableHead>Dernière connexion</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-destructive">
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Aucun utilisateur trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow 
                          key={user.id} 
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleViewUserDetails(user)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.image || undefined} alt={user.name || "Utilisateur"} />
                                <AvatarFallback className="bg-primary text-primary-foreground" style={{ backgroundColor: '#81B441' }}>
                                  {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.name || "Sans nom"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getRoleBadgeColor(user.role as UserRole)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.plan ? (
                              <Badge variant="outline" className={getPlanBadgeColor(user.plan as 'STARTER' | 'PRO' | 'PREMIUM')}>
                                {user.plan}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {user.lastLogin 
                              ? new Date(user.lastLogin).toLocaleDateString() 
                              : <span className="text-muted-foreground text-sm">Jamais connecté</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => { 
                                  e.stopPropagation();
                                  handleEditUser(user);
                                }}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                {user.id !== session?.user?.id && (
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive" 
                                    onClick={(e) => { 
                                      e.stopPropagation();
                                      handleDeleteUser(user);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  style={{ borderColor: '#81B441' }}
                >
                  Suivant
                </Button>
              </div>
            </CardFooter>
          </Card>

          {showCreateModal && (
            <CreateUserModal
              onClose={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false);
                fetchUsers();
                toast.success("Utilisateur créé avec succès");
              }}
            />
          )}

          {showEditModal && selectedUser && (
            <EditUserModal
              user={selectedUser}
              onClose={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}
              onSuccess={() => {
                setShowEditModal(false);
                setSelectedUser(null);
                fetchUsers();
                toast.success("Utilisateur mis à jour avec succès");
              }}
            />
          )}

          {showUserDetails && selectedUser && (
            <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Détails de l&apos;utilisateur</DialogTitle>
                  <DialogDescription>
                    Informations complètes sur {selectedUser.name || selectedUser.email}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center space-y-4 py-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={selectedUser.image || undefined} alt={selectedUser.name || "Utilisateur"} />
                    <AvatarFallback className="text-2xl" style={{ backgroundColor: '#81B441' }}>
                      {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : selectedUser.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="text-lg font-medium">{selectedUser.name || "Sans nom"}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Rôle</Label>
                    <Badge variant="outline" className={`${getRoleBadgeColor(selectedUser.role as UserRole)} w-fit`}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    <Label>Date d&apos;inscription</Label>
                    <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()} à {new Date(selectedUser.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Dernière connexion</Label>
                    <p className="text-sm">
                      {selectedUser.lastLogin 
                        ? `${new Date(selectedUser.lastLogin).toLocaleDateString()} à ${new Date(selectedUser.lastLogin).toLocaleTimeString()}`
                        : "Jamais connecté"}
                    </p>
                  </div>
                  {selectedUser.permissions && selectedUser.permissions.length > 0 && (
                    <div className="grid gap-2">
                      <Label>Permissions</Label>
                      <div className="flex flex-wrap gap-1">
                        {selectedUser.permissions.map((permission, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-2 mt-4">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Événements créés
                    </Label>
                    {loadingEvents ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary"></div>
                      </div>
                    ) : userEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">Aucun événement créé par cet utilisateur</p>
                    ) : (
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nom</TableHead>
                              <TableHead>Dates</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userEvents.map(event => (
                              <TableRow key={event.id}>
                                <TableCell className="font-medium">{event.name}</TableCell>
                                <TableCell>
                                  {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    asChild
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <a href={`/dashboard/events/${event.id}`} target="_blank">
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUserDetails(false)}>
                    Fermer
                  </Button>
                  <Button onClick={() => {
                    setShowUserDetails(false);
                    handleEditUser(selectedUser);
                  }} style={{ backgroundColor: '#81B441' }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={confirmDeleteUser}>
                  Supprimer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

// Composant modal pour créer un utilisateur
function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email invalide');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création de l&apos;utilisateur');
      }

      onSuccess();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Une erreur est survenue');
      } else {
        setError('Une erreur inconnue est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un utilisateur</DialogTitle>
          <DialogDescription>
            Créez un nouvel utilisateur sur la plateforme
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 text-sm rounded-md bg-destructive/15 text-destructive">
              {error}
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom complet"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Rôle</Label>
              <Select 
                value={role} 
                onValueChange={(value) => setRole(value as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.USER}>Utilisateur</SelectItem>
                  <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                  <SelectItem value={UserRole.ORGANIZER}>Organisateur</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} style={{ backgroundColor: '#81B441' }}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Composant modal pour éditer un utilisateur
function EditUserModal({ user, onClose, onSuccess }: { user: User; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [role, setRole] = useState<UserRole>(user.role as UserRole);
  const [plan, setPlan] = useState<'STARTER' | 'PRO' | 'PREMIUM'>(user.plan || 'STARTER');
  const [password, setPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email) {
      setError('Le nom et l&apos;email sont obligatoires');
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email invalide');
      return;
    }

    // Validation du mot de passe si changé
    if (changePassword && password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name,
        email,
        role,
        plan,
        ...(changePassword && password ? { password } : {})
      };

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour de l&apos;utilisateur');
      }

      onSuccess();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Une erreur est survenue');
      } else {
        setError('Une erreur inconnue est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          <DialogDescription>
            Mettre à jour les informations de {user.name || user.email}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 text-sm rounded-md bg-destructive/15 text-destructive">
              {error}
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="changePassword"
                checked={changePassword}
                onCheckedChange={(checked) => setChangePassword(checked === true)}
              />
              <Label htmlFor="changePassword">Changer le mot de passe</Label>
            </div>
            
            {changePassword && (
              <div className="grid gap-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                />
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="role">Rôle</Label>
              <Select 
                value={role} 
                onValueChange={(value) => setRole(value as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.USER}>Utilisateur</SelectItem>
                  <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                  <SelectItem value={UserRole.ORGANIZER}>Organisateur</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="plan">Plan d&apos;abonnement</Label>
              <Select 
                value={plan} 
                onValueChange={(value) => setPlan(value as 'STARTER' | 'PRO' | 'PREMIUM')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTER">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span>Starter - Gratuit</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PRO">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-[#81B441] rounded-full"></div>
                      <span>Pro - 29€/mois</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PREMIUM">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Premium - 99€/mois</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} style={{ backgroundColor: '#81B441' }}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 