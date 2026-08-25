import { Outlet, useLocation } from 'react-router';
import { CircleQuestionMark, Trophy, Activity } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/authContext';

function DashboardLayout() {
  const location = useLocation();
  const [currentActive, setCurrentActive] = useState(0);

  const { user, logout } = useAuth();

  console.log(user);

  const menuItems = [
    {
      name: 'Quiz',
      link: '/admin/createquiz',
      icon: <CircleQuestionMark size={20} />,
    },
    {
      name: 'Requests',
      link: '/admin/live',
      icon: <Activity size={20} />,
    },
    {
      name: 'Results',
      link: '/admin/results',
      icon: <Trophy size={20} />,
    },
  ];

  useEffect(() => {
    const index = menuItems.findIndex((item) =>
      location.pathname.startsWith(item.link),
    );
    if (index !== -1) setCurrentActive(index);
  }, [location.pathname]);

  return (
    <div className="w-screen h-dvh flex flex-col bg-zinc-100/50 font-sans text-zinc-950">
      {/* Header */}
      <div className="flex justify-between items-center w-full h-14 bg-white border-b border-zinc-300 px-6 shrink-0">
        <h1 className="text-xl font-bold tracking-tight">
          QUIZ<span className="text-green-500">IT</span>
        </h1>
        <div className="flex gap-4 items-center">
          <span className="text-sm font-medium text-zinc-600">
            Hi, {user?.username || 'User'}
          </span>
          <button
            onClick={logout}
            className="inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md border border-zinc-300 bg-white shadow-sm hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Sidebar + Content */}
      <div className="w-full flex flex-1 overflow-hidden">
        <div className="bg-white w-[220px] h-full flex flex-col gap-1 py-4 px-3 border-r border-zinc-300 shrink-0">
          {menuItems.map((item, index) => {
            const isActive = currentActive === index;
            return (
              <Link
                key={index}
                to={item.link}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {React.cloneElement(item.icon, { size: 16 })}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex-1 bg-zinc-100/50 h-full overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
