'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Briefcase,
  FileText,
  Settings,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  Lock,
  Download,
  AlertCircle,
  Check,
  Bell,
  Eye,
  Camera,
  DollarSign
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'employment' | 'documents' | 'settings'>('personal');
  const [success, setSuccess] = useState('');
  
  // Editable state (saved locally in component)
  const [contactInfo, setContactInfo] = useState({
    phone: '+94 77 123 4567',
    address: '123, Galle Road, Colombo 03, Sri Lanka',
    emergencyName: 'Amal Silva',
    emergencyRelation: 'Spouse',
    emergencyPhone: '+94 77 987 6543'
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReport: true,
    marketingEmails: false
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('Contact information updated successfully!');
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleToggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSuccess('Preferences updated.');
    setTimeout(() => setSuccess(''), 2500);
  };

  const getInitials = () => {
    if (!user) return 'OX';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'U';
  };

  const formattedHireDate = () => {
    if (!user?.hire_date) return 'N/A';
    try {
      return format(new Date(user.hire_date), 'MMMM dd, yyyy');
    } catch {
      return user.hire_date;
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Profile Settings</h1>
        <p className="text-sm text-[var(--gray-400)] font-medium mt-1">Manage your personal details, view employment details, and access documents.</p>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[var(--success-light)] border-l-4 border-[var(--success)] text-[var(--success-text)] p-4 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <Check className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Avatar & Summary Info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="text-center shadow-[var(--shadow)] border-[var(--gray-100)] overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] opacity-10" />
            
            <div className="relative pt-6 flex flex-col items-center">
              {/* Profile Avatar */}
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white text-3xl font-extrabold flex items-center justify-center border-4 border-[var(--card-bg)] shadow-[var(--shadow-md)]">
                  {getInitials()}
                </div>
                <button className="absolute bottom-0 right-0 p-2 rounded-full bg-[var(--primary)] text-white border-2 border-[var(--card-bg)] shadow hover:bg-[var(--primary-hover)] transition-colors cursor-pointer">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              <h2 className="text-lg font-extrabold text-[var(--foreground)] mt-4">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider mt-0.5">
                {user?.position || 'Team Member'}
              </p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--gray-50)] text-[var(--gray-600)] border border-[var(--gray-100)] mt-2">
                ID: {user?.employee_id || 'N/A'}
              </span>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--gray-50)] text-left space-y-4">
              <div className="flex items-center gap-3 text-xs">
                <Mail className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold text-[var(--foreground)] mt-0.5 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Briefcase className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Department</p>
                  <p className="font-semibold text-[var(--foreground)] mt-0.5">{user?.department || 'Operations'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Shield className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Role Access</p>
                  <p className="font-semibold text-[var(--foreground)] mt-0.5 capitalize">{user?.role?.replace('_', ' ') || 'Employee'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Tabbed Content Areas */}
        <div className="lg:col-span-8 space-y-6">
          {/* Navigation Bar inside wrapper */}
          <div className="bg-[var(--card-bg)] border border-[var(--gray-100)] p-1.5 rounded-2xl shadow-sm flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'personal'
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--gray-400)] hover:text-[var(--foreground)] hover:bg-[var(--gray-25)]'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Personal Details</span>
            </button>
            <button
              onClick={() => setActiveTab('employment')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'employment'
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--gray-400)] hover:text-[var(--foreground)] hover:bg-[var(--gray-25)]'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Employment Info</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--gray-400)] hover:text-[var(--foreground)] hover:bg-[var(--gray-25)]'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Document Vault</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--gray-400)] hover:text-[var(--foreground)] hover:bg-[var(--gray-25)]'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>System Settings</span>
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="min-h-96">
            {activeTab === 'personal' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="shadow-sm border-[var(--gray-100)] p-6">
                  <h3 className="text-base font-bold text-[var(--foreground)] mb-6">Contact & Personal details</h3>
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    {/* Read Only Account Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">First Name</label>
                        <input
                          type="text"
                          readOnly
                          value={user?.first_name || ''}
                          className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--gray-400)] bg-[var(--gray-25)] cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">Last Name</label>
                        <input
                          type="text"
                          readOnly
                          value={user?.last_name || ''}
                          className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--gray-400)] bg-[var(--gray-25)] cursor-not-allowed"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">SSO Email Address</label>
                        <input
                          type="email"
                          readOnly
                          value={user?.email || ''}
                          className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--gray-400)] bg-[var(--gray-25)] cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="border-t border-[var(--gray-50)] pt-6" />

                    {/* Editable Details */}
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">Mobile Phone *</label>
                          <input
                            type="text"
                            required
                            value={contactInfo.phone}
                            onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">Home Address *</label>
                          <input
                            type="text"
                            required
                            value={contactInfo.address}
                            onChange={(e) => setContactInfo(prev => ({ ...prev, address: e.target.value }))}
                            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                          />
                        </div>
                      </div>

                      <div className="bg-[var(--gray-25)] p-4 rounded-2xl border border-[var(--gray-50)] space-y-4">
                        <p className="text-[10px] font-bold text-[var(--gray-500)] uppercase tracking-wider">Emergency Contact Details</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-1">
                            <label className="block text-[10px] font-semibold text-[var(--gray-400)] mb-1.5">Contact Name</label>
                            <input
                              type="text"
                              required
                              value={contactInfo.emergencyName}
                              onChange={(e) => setContactInfo(prev => ({ ...prev, emergencyName: e.target.value }))}
                              className="block w-full px-3.5 py-2 border border-[var(--gray-100)] rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-1">
                            <label className="block text-[10px] font-semibold text-[var(--gray-400)] mb-1.5">Relation</label>
                            <input
                              type="text"
                              required
                              value={contactInfo.emergencyRelation}
                              onChange={(e) => setContactInfo(prev => ({ ...prev, emergencyRelation: e.target.value }))}
                              className="block w-full px-3.5 py-2 border border-[var(--gray-100)] rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-1">
                            <label className="block text-[10px] font-semibold text-[var(--gray-400)] mb-1.5">Contact Phone</label>
                            <input
                              type="text"
                              required
                              value={contactInfo.emergencyPhone}
                              onChange={(e) => setContactInfo(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                              className="block w-full px-3.5 py-2 border border-[var(--gray-100)] rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-[var(--gray-50)]">
                      <Button
                        type="submit"
                        className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm cursor-pointer text-xs"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}

            {activeTab === 'employment' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="shadow-sm border-[var(--gray-100)] p-6">
                  <h3 className="text-base font-bold text-[var(--foreground)] mb-6">Employment Information</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl mt-0.5">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Employee ID #</p>
                        <p className="text-sm font-bold text-[var(--foreground)] mt-1">{user?.employee_id || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl mt-0.5">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Access Access Level / Role</p>
                        <p className="text-sm font-bold text-[var(--foreground)] mt-1 capitalize">{user?.role?.replace('_', ' ') || 'Employee'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl mt-0.5">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Department</p>
                        <p className="text-sm font-bold text-[var(--foreground)] mt-1">{user?.department || 'Operations'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl mt-0.5">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Job Designation</p>
                        <p className="text-sm font-bold text-[var(--foreground)] mt-1">{user?.position || 'Specialist'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl mt-0.5">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Hire Date</p>
                        <p className="text-sm font-bold text-[var(--foreground)] mt-1">{formattedHireDate()}</p>
                      </div>
                    </div>

                    {user?.hourly_rate && (
                      <div className="flex items-start gap-3.5">
                        <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl mt-0.5">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Hourly Pay Rate</p>
                          <p className="text-sm font-bold text-[var(--foreground)] mt-1">LKR {user.hourly_rate.toLocaleString()}/hr</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 p-4.5 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-2xl flex gap-3.5 items-start">
                    <Lock className="h-5 w-5 text-[var(--gray-400)] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-[var(--foreground)]">Corporate Access Details</p>
                      <p className="text-xs text-[var(--gray-400)] font-medium mt-1 leading-relaxed">
                        Your core employment records, design assignments, and salary parameters are managed by HR. If any detail above is incorrect, please raise a ticket inside the system.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'documents' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="shadow-sm border-[var(--gray-100)] p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-bold text-[var(--foreground)]">Your Signed Agreements</h3>
                    <span className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider bg-[var(--gray-50)] border border-[var(--gray-100)] px-2 py-0.5 rounded-full">
                      4 documents
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: 'OXO_Employment_Agreement_2026.pdf', size: '1.4 MB', type: 'Employment Agreement' },
                      { name: 'Mutual_Non_Disclosure_Agreement.pdf', size: '820 KB', type: 'Security NDA' },
                      { name: 'Medical_Insurance_Coverage_Booklet.pdf', size: '2.5 MB', type: 'Insurance policy' },
                      { name: 'Corporate_Code_of_Conduct.pdf', size: '1.1 MB', type: 'Company Policy' }
                    ].map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-[var(--gray-25)] hover:bg-[var(--gray-50)] border border-[var(--gray-100)] hover:border-[var(--primary-ring)] rounded-2xl transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-white text-[var(--primary)] border border-[var(--gray-100)] rounded-xl shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--foreground)] truncate max-w-[200px] sm:max-w-md">{doc.name}</p>
                            <span className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider block mt-0.5">
                              {doc.type} · {doc.size}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => alert(`Downloading: ${doc.name}`)}
                          className="p-2 bg-white text-[var(--gray-500)] hover:text-[var(--primary)] border border-[var(--gray-100)] hover:border-[var(--primary-ring)] rounded-xl hover:shadow-sm cursor-pointer transition-colors shrink-0"
                          title="Download Document"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="shadow-sm border-[var(--gray-100)] p-6">
                  <h3 className="text-base font-bold text-[var(--foreground)] mb-6">System & Notification Preferences</h3>
                  
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-2xl">
                      <div className="flex gap-3 items-start pr-4">
                        <Bell className="h-4 w-4 text-[var(--gray-400)] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-[var(--foreground)]">Email Alerts</p>
                          <p className="text-[10px] font-medium text-[var(--gray-400)] mt-0.5 leading-relaxed">
                            Receive notifications about salary updates, leave balance allocations, and claims reports.
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleToggleSetting('emailNotifications')}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.emailNotifications ? 'bg-[var(--primary)]' : 'bg-[var(--gray-200)]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-2xl">
                      <div className="flex gap-3 items-start pr-4">
                        <Bell className="h-4 w-4 text-[var(--gray-400)] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-[var(--foreground)]">Push Notifications</p>
                          <p className="text-[10px] font-medium text-[var(--gray-400)] mt-0.5 leading-relaxed">
                            Show desktop announcements and important corporate updates.
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleToggleSetting('pushNotifications')}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.pushNotifications ? 'bg-[var(--primary)]' : 'bg-[var(--gray-200)]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.pushNotifications ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-2xl">
                      <div className="flex gap-3 items-start pr-4">
                        <FileText className="h-4 w-4 text-[var(--gray-400)] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-[var(--foreground)]">Weekly Reports Digest</p>
                          <p className="text-[10px] font-medium text-[var(--gray-400)] mt-0.5 leading-relaxed">
                            A weekly consolidated email containing leave records, claims updates, and calendar bookings.
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleToggleSetting('weeklyReport')}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.weeklyReport ? 'bg-[var(--primary)]' : 'bg-[var(--gray-200)]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.weeklyReport ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
