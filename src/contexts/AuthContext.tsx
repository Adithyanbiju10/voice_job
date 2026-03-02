import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'seeker' | 'employer';

interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    disability?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password?: string) => boolean;
    signup: (userData: Omit<User, 'id'>) => void;
    logout: () => void;
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
                { id: '1', name: 'Job Seeker', email: 'user@example.com', role: 'seeker' as Role, disability: 'none' },
                { id: '2', name: 'TechCorp', email: 'employer@example.com', role: 'employer' as Role, disability: 'none' }
            ];
            localStorage.setItem('ability_jobs_registered_users', JSON.stringify(demoUsers));
        }

        setIsLoading(false);
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

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}>
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
