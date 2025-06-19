import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Plus, Home, Settings, Users, LogOut, Shield, BarChart3, FileText, HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Admin Dashboard', path: '/admin' },
    { icon: BookOpen, label: 'Manage Courses', path: '/admin/courses' },
    { icon: Plus, label: 'Add Course', path: '/admin/courses/add' },
    { icon: HelpCircle, label: 'Manage Quizzes', path: '/admin/quizzes' },
    { icon: Users, label: 'Manage Students', path: '/admin/students' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: FileText, label: 'Reports', path: '/admin/reports' },
    { icon: Settings, label: 'Admin Settings', path: '/admin/settings' },
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
    return user?.email?.split('@')[0] || 'Admin';
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
        lg:translate-x-0 lg:static lg:z-auto border-r border-gray-200
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 bg-red-600 text-white">
            <Shield className="w-8 h-8 mr-2" />
            <span className="text-xl font-bold">Admin Panel</span>
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
                    isActive ? 'bg-red-50 text-red-600 border-r-2 border-red-600' : ''
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.email ? getUserInitials(user.email) : 'A'}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{getUserDisplayName()}</p>
                <p className="text-xs text-red-600 font-medium">Administrator</p>
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

export default AdminSidebar;