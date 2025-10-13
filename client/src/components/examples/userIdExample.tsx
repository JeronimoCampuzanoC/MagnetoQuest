import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/authService';

// Example component showing how to get the current user ID
const UserIdExample: React.FC = () => {
    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Method 1: Get just the user ID
        const currentUserId = AuthService.getCurrentUserId();
        setUserId(currentUserId);

        // Method 2: Get full user data (includes ID)
        const currentUser = AuthService.getCurrentUser();
        setUser(currentUser);

        console.log('Current User ID:', currentUserId);
        console.log('Full User Data:', currentUser);
    }, []);

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
            <h3>Current User Information</h3>

            <div>
                <strong>User ID:</strong> {userId || 'Not logged in'}
            </div>

            {user && (
                <div style={{ marginTop: '10px' }}>
                    <strong>Full User Data:</strong>
                    <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
                        {JSON.stringify(user, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default UserIdExample;