import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'seeker' | 'employer' | 'admin';

interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    disability?: string;
    isVerified?: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password?: string) => boolean;
    signup: (userData: Omit<User, 'id'>) => void;
    logout: () => void;
    verifyEmployer: (employerId: string) => void;
    unverifyEmployer: (employerId: string) => void;
    getAllEmployers: () => User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user and seed registered users on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('ability_jobs_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse user session');
            }
        }

        // Seed demo users if first time
        const registeredUsers = localStorage.getItem('ability_jobs_registered_users');
        if (!registeredUsers) {
            const demoUsers = [
                { id: '1', name: 'Job Seeker', email: 'user@example.com', role: 'seeker' as Role, disability: 'none', isVerified: false },
                { id: '2', name: 'TechCorp', email: 'employer@example.com', role: 'employer' as Role, disability: 'none', isVerified: false },
                { id: 'admin-001', name: 'Platform Admin', email: 'admin@abilityjobs.com', role: 'admin' as Role, disability: 'none', isVerified: true }
            ];
            localStorage.setItem('ability_jobs_registered_users', JSON.stringify(demoUsers));
        } else {
            // Ensure admin always exists even in older saved data
            const parsed: User[] = JSON.parse(registeredUsers);
            if (!parsed.find(u => u.role === 'admin')) {
                parsed.push({ id: 'admin-001', name: 'Platform Admin', email: 'admin@abilityjobs.com', role: 'admin' as Role, disability: 'none', isVerified: true });
                localStorage.setItem('ability_jobs_registered_users', JSON.stringify(parsed));
            }
        }

        setIsLoading(false);
    }, []);

    // Real-time cross-tab sync: when admin verifies/unverifies on another tab,
    // the employer's tab picks it up immediately via the storage event.
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'ability_jobs_registered_users' && e.newValue) {
                // Check if the currently logged-in user's record was updated
                const currentSession = localStorage.getItem('ability_jobs_user');
                if (!currentSession) return;
                try {
                    const sessionUser: User = JSON.parse(currentSession);
                    const updatedUsers: User[] = JSON.parse(e.newValue);
                    const freshRecord = updatedUsers.find(u => u.id === sessionUser.id);
                    if (freshRecord && freshRecord.isVerified !== sessionUser.isVerified) {
                        // Update the active session to reflect the new verification status
                        const { ...freshUser } = freshRecord;
                        setUser(freshUser as User);
                        localStorage.setItem('ability_jobs_user', JSON.stringify(freshUser));
                    }
                } catch (err) {
                    console.error('Failed to sync session from storage event', err);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const getUsers = (): (User & { password?: string })[] => {
        try {
            const stored = localStorage.getItem('ability_jobs_registered_users');
            if (!stored) return [];
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Failed to parse registered users', e);
            return [];
        }
    };

    const login = (email: string, password?: string) => {
        const cleanEmail = (email || '').trim().toLowerCase();
        if (!cleanEmail) return false;

        const users = getUsers();
        const foundUser = users.find(u => u.email.toLowerCase() === cleanEmail);

        if (foundUser) {
            const { password: _, ...userWithoutPassword } = foundUser;
            setUser(userWithoutPassword as User);
            localStorage.setItem('ability_jobs_user', JSON.stringify(userWithoutPassword));
            return true;
        } else {
            // "Magic Login": If user not found, create a default profile so they are "remembered"
            const baseName = cleanEmail.split('@')[0] || 'User';
            const name = baseName.charAt(0).toUpperCase() + baseName.slice(1);

            const newUser: User = {
                id: Math.random().toString(36).substr(2, 9),
                name,
                email: cleanEmail,
                role: 'seeker',
                disability: 'none'
            };

            const updatedUsers = [...users, newUser];
            localStorage.setItem('ability_jobs_registered_users', JSON.stringify(updatedUsers));

            setUser(newUser);
            localStorage.setItem('ability_jobs_user', JSON.stringify(newUser));
            return true;
        }
    };

    const signup = (userData: Omit<User, 'id'>) => {
        const users = getUsers();
        const newUser: User = {
            ...userData,
            id: Math.random().toString(36).substr(2, 9),
        };

        // Save to registered users list
        const updatedUsers = [...users, newUser];
        localStorage.setItem('ability_jobs_registered_users', JSON.stringify(updatedUsers));

        // Set as current user
        setUser(newUser);
        localStorage.setItem('ability_jobs_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ability_jobs_user');
    };

    const getAllEmployers = (): User[] => {
        return getUsers().filter(u => u.role === 'employer');
    };

    const verifyEmployer = (employerId: string) => {
        const users = getUsers();
        const updated = users.map(u => u.id === employerId ? { ...u, isVerified: true } : u);
        localStorage.setItem('ability_jobs_registered_users', JSON.stringify(updated));
        // If the currently logged-in employer is being verified, update their live session too
        if (user?.id === employerId) {
            const updatedUser = { ...user, isVerified: true };
            setUser(updatedUser);
            localStorage.setItem('ability_jobs_user', JSON.stringify(updatedUser));
        } else {
            // Employer is on a different tab: update their session storage so they see it immediately
            const sessionRaw = localStorage.getItem('ability_jobs_user');
            if (sessionRaw) {
                try {
                    const sessionUser: User = JSON.parse(sessionRaw);
                    if (sessionUser.id === employerId) {
                        const updatedSession = { ...sessionUser, isVerified: true };
                        localStorage.setItem('ability_jobs_user', JSON.stringify(updatedSession));
                    }
                } catch { }
            }
        }
    };

    const unverifyEmployer = (employerId: string) => {
        const users = getUsers();
        const updated = users.map(u => u.id === employerId ? { ...u, isVerified: false } : u);
        localStorage.setItem('ability_jobs_registered_users', JSON.stringify(updated));
        // Mirror the revocation to the employer's active session immediately
        if (user?.id === employerId) {
            const updatedUser = { ...user, isVerified: false };
            setUser(updatedUser);
            localStorage.setItem('ability_jobs_user', JSON.stringify(updatedUser));
        } else {
            const sessionRaw = localStorage.getItem('ability_jobs_user');
            if (sessionRaw) {
                try {
                    const sessionUser: User = JSON.parse(sessionRaw);
                    if (sessionUser.id === employerId) {
                        const updatedSession = { ...sessionUser, isVerified: false };
                        localStorage.setItem('ability_jobs_user', JSON.stringify(updatedSession));
                    }
                } catch { }
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, verifyEmployer, unverifyEmployer, getAllEmployers }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
