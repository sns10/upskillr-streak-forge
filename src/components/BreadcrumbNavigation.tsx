import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
}

const BreadcrumbNavigation = ({ items, className = '' }: BreadcrumbNavigationProps) => {
  return (
    <nav className={`flex items-center space-x-1 text-sm text-gray-600 ${className}`} aria-label="Breadcrumb">
      <Link to="/" className="flex items-center hover:text-gray-900 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {item.href && !item.isActive ? (
            <Link 
              to={item.href} 
              className="hover:text-gray-900 transition-colors truncate max-w-[200px]"
              title={item.label}
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className={`truncate max-w-[200px] ${item.isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
              title={item.label}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNavigation;