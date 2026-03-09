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
    signup: (userData: Omit<User, 'id'>, password?: string) => void;
    logout: () => void;
    verifyEmployer: (employerId: string) => void;
    unverifyEmployer: (employerId: string) => void;
    getAllEmployers: () => User[];
}

// A simple deterministic hash — good enough for a localStorage-backed demo.
// NOT cryptographically secure; for a real app use bcrypt on the server.
const hashPassword = (pwd: string): string => {
    let hash = 0;
    for (let i = 0; i < pwd.length; i++) {
        hash = (Math.imul(31, hash) + pwd.charCodeAt(i)) | 0;
    }
    return hash.toString(16);
};

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

        // Seed demo users with known passwords if first time
        const registeredUsers = localStorage.getItem('ability_jobs_registered_users');
        if (!registeredUsers) {
            const demoUsers = [
                { id: '1', name: 'Job Seeker', email: 'user@example.com', role: 'seeker' as Role, disability: 'none', isVerified: false, password: hashPassword('password123') },
                { id: 'admin-001', name: 'Platform Admin', email: 'admin@abilityjobs.com', role: 'admin' as Role, disability: 'none', isVerified: true, password: hashPassword('admin123') }
            ];
            localStorage.setItem('ability_jobs_registered_users', JSON.stringify(demoUsers));
        } else {
            // Migrate existing users: ensure every record has a password and admin always exists
            const parsed: any[] = JSON.parse(registeredUsers);
            let changed = false;

            // Ensure admin exists
            if (!parsed.find(u => u.role === 'admin')) {
                parsed.push({ id: 'admin-001', name: 'Platform Admin', email: 'admin@abilityjobs.com', role: 'admin' as Role, disability: 'none', isVerified: true, password: hashPassword('admin123') });
                changed = true;
            }

            // Remove the hardcoded dummy TechCorp employer if present
            const techCorpIndex = parsed.findIndex(u => u.id === '2' && u.email === 'employer@example.com');
            if (techCorpIndex !== -1) {
                parsed.splice(techCorpIndex, 1);
                changed = true;
            }

            // Give any user without a password the default password 'password123'
            const migrated = parsed.map(u => {
                if (!u.password) {
                    changed = true;
                    // Admin gets its own default
                    const defaultPwd = u.role === 'admin' ? 'admin123' : 'password123';
                    return { ...u, password: hashPassword(defaultPwd) };
                }
                return u;
            });

            if (changed) {
                localStorage.setItem('ability_jobs_registered_users', JSON.stringify(migrated));
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

        if (!foundUser) {
            // User does not exist — reject login
            return false;
        }

        // Validate password if the stored record has one
        if (foundUser.password) {
            const incoming = hashPassword(password || '');
            if (incoming !== foundUser.password) {
                return false; // Wrong password
            }
        }

        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword as User);
        localStorage.setItem('ability_jobs_user', JSON.stringify(userWithoutPassword));
        return true;
    };

    const signup = (userData: Omit<User, 'id'>, password?: string) => {
        const users = getUsers();
        const newUser = {
            ...userData,
            id: Math.random().toString(36).substr(2, 9),
            ...(password ? { password: hashPassword(password) } : {}),
        };

        // Save to registered users list
        const updatedUsers = [...users, newUser];
        localStorage.setItem('ability_jobs_registered_users', JSON.stringify(updatedUsers));

        // Set as current user (without password in session)
        const { password: _, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword as User);
        localStorage.setItem('ability_jobs_user', JSON.stringify(userWithoutPassword));
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
