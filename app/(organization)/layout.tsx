import React from 'react';
import { UserProvider } from '@/context/UserContext';

const Layout: React.FC = ({ children }) => {
  return (
    <UserProvider>
      <div>
        <header>
          {/* Add your header content here */}
        </header>
        <main>
          {children}
        </main>
        <footer>
          {/* Add your footer content here */}
        </footer>
      </div>
    </UserProvider>
  );
};

export default Layout;