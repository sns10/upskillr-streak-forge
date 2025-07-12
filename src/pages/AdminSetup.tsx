
import AdminAccountCreator from '@/components/AdminAccountCreator';
import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap } from 'lucide-react';

const AdminSetup = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Upskillr
            </h1>
          </div>
          <p className="text-gray-600">Admin Account Setup</p>
        </div>

        <AdminAccountCreator />
      </div>
    </div>
  );
};

export default AdminSetup;
