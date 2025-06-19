import React from 'react';
import { Menu, Bell, Search, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email?.split('@')[0] || 'Admin';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex items-center ml-4">
          <Shield className="w-6 h-6 text-red-600 mr-2" />
          <span className="text-lg font-semibold text-gray-900">Admin Panel</span>
        </div>
        
        <div className="hidden md:flex items-center ml-8">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search admin panel..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        {/* User Menu */}
        <div className="relative group">
          <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.email ? getUserInitials(user.email) : 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-gray-900">{getUserDisplayName()}</div>
              <div className="text-xs text-red-600 font-medium">Administrator</div>
            </div>
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-900">{getUserDisplayName()}</div>
              <div className="text-xs text-red-600 font-medium">Administrator</div>
            </div>
            
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <User className="w-4 h-4 mr-3" />
              Admin Profile
            </button>
            
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;