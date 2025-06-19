import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Home, Settings, Users, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, signOut, isAdmin } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, label: 'Courses', path: '/courses' },
    { icon: Users, label: 'Students', path: '/students' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 bg-primary-600 text-white">
            <BookOpen className="w-8 h-8 mr-2" />
            <span className="text-xl font-bold">EduSaaS</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors ${
                    isActive ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : ''
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            ))}

            {/* Admin Panel Link */}
            {isAdmin && (
              <>
                <div className="border-t border-gray-200 my-4"></div>
                <NavLink
                  to="/admin"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-red-50 transition-colors ${
                      isActive ? 'bg-red-50 text-red-600 border-r-2 border-red-600' : ''
                    }`
                  }
                >
                  <Shield className="w-5 h-5 mr-3 text-red-600" />
                  <span className="font-medium">Admin Panel</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.email ? getUserInitials(user.email) : 'U'}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{getUserDisplayName()}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {isAdmin && (
                  <p className="text-xs text-red-600 font-medium">Administrator</p>
                )}
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;