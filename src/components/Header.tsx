import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Menu, User, Bell, ChevronDown, LogOut } from 'lucide-react';
import { cn, getInitials, generateAvatarColor } from '../lib/utils';

export default function Header() {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  const toggleSidebar = () => {
    // For mobile devices, we would toggle sidebar visibility
    // This is a placeholder for actual implementation
    console.log('Toggle sidebar');
  };
  
  return (
    <header className="bg-white border-b border-border py-2 px-4 flex items-center justify-between">
      {/* Mobile menu button */}
      <button 
        className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-muted"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </button>
      
      <div className="flex-1 md:pl-4">
        <h2 className="text-lg font-semibold text-foreground">My Secure Vault</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="p-2 rounded-full text-muted-foreground hover:bg-muted">
          <Bell className="h-5 w-5" />
        </button>
        
        {/* User menu */}
        <div className="relative">
          <button
            className="flex items-center space-x-2"
            onClick={toggleDropdown}
          >
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-white",
              generateAvatarColor(user?.email || '')
            )}>
              <span className="text-sm font-medium">
                {getInitials(user?.email?.split('@')[0] || '')}
              </span>
            </div>
            <span className="hidden md:inline text-sm font-medium">
              {user?.email?.split('@')[0]}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={closeDropdown}
              ></div>
              <div className="absolute right-0 mt-2 w-48 py-1 bg-white rounded-md shadow-lg z-20 border border-border">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
                
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </button>
                
                <button
                  onClick={signOut}
                  className="flex w-full items-center px-4 py-2 text-sm text-error-500 hover:bg-muted"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}