import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'seeker' | 'employer';

interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (userData: Omit<User, 'id'>) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('ability_jobs_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse user session');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (userData: Omit<User, 'id'>) => {
        // Simulate assigning an ID and generating a token
        const newUser: User = {
            ...userData,
            id: Math.random().toString(36).substr(2, 9),
        };
        setUser(newUser);
        localStorage.setItem('ability_jobs_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ability_jobs_user');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
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
