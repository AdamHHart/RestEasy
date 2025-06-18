import { useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  FolderClosed, 
  FileText, 
  HeartHandshake, 
  Users, 
  Settings,
  Scale,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function Sidebar() {
  const location = useLocation();
  const { userRole } = useAuth();
  const [logoError, setLogoError] = useState(false);
  
  // Navigation items
  const navItems = [
    {
      title: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      href: '/dashboard',
      roles: ['planner', 'executor'],
    },
    {
      title: 'My Checklist',
      icon: <CheckSquare className="h-5 w-5" />,
      href: '/checklist',
      roles: ['planner'],
    },
    {
      title: 'Assets',
      icon: <FolderClosed className="h-5 w-5" />,
      href: '/assets',
      roles: ['planner', 'executor'],
    },
    {
      title: 'Documents',
      icon: <FileText className="h-5 w-5" />,
      href: '/documents',
      roles: ['planner', 'executor'],
    },
    {
      title: 'Wishes',
      icon: <HeartHandshake className="h-5 w-5" />,
      href: '/wishes',
      roles: ['planner', 'executor'],
    },
    {
      title: 'Executors',
      icon: <Users className="h-5 w-5" />,
      href: '/executors',
      roles: ['planner'],
    },
    {
      title: 'Legal & Privacy',
      icon: <Scale className="h-5 w-5" />,
      href: '/legal',
      roles: ['planner', 'executor'],
    },
    {
      title: 'Profile',
      icon: <Settings className="h-5 w-5" />,
      href: '/profile',
      roles: ['planner', 'executor'],
    },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => 
    !userRole || item.roles.includes(userRole)
  );

  return (
    <aside className="hidden md:flex w-64 flex-col bg-white border-r border-border">
      <div className="p-4 flex items-center justify-center border-b border-border">
        <Link to="/dashboard">
          {logoError ? (
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-calm-600" />
              <span className="text-xl font-semibold">Ever Ease</span>
            </div>
          ) : (
            <img 
              src="/everease_logo.png" 
              alt="Ever Ease" 
              className="h-12 w-auto"
              onError={() => setLogoError(true)}
            />
          )}
        </Link>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-calm-100 text-calm-600"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.icon}
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="p-3 bg-calm-100 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-calm-600">End-to-end encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}