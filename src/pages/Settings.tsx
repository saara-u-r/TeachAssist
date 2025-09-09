import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  school_name: string;
  subjects_taught: string[];
  grade_levels: string[];
  years_of_experience: number;
  teaching_style: string;
  interests: string[];
  notification_preferences: {
    event_reminder: number;
    notification_style: 'popup' | 'glow' | 'standard';
  };
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    schoolName: '',
    subjectsTaught: '',
    gradeLevels: '',
    yearsOfExperience: '',
    teachingStyle: '',
    interests: '',
    eventReminder: '30',
    notificationStyle: 'popup'
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  async function loadProfile() {
    if (user) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
        setFormData({
          schoolName: data.school_name || '',
          subjectsTaught: data.subjects_taught?.join(', ') || '',
          gradeLevels: data.grade_levels?.join(', ') || '',
          yearsOfExperience: data.years_of_experience?.toString() || '',
          teachingStyle: data.teaching_style || '',
          interests: data.interests?.join(', ') || '',
          eventReminder: data.notification_preferences?.event_reminder?.toString() || '30',
          notificationStyle: data.notification_preferences?.notification_style || 'popup'
        });
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          school_name: formData.schoolName,
          subjects_taught: formData.subjectsTaught.split(',').map(s => s.trim()),
          grade_levels: formData.gradeLevels.split(',').map(s => s.trim()),
          years_of_experience: parseInt(formData.yearsOfExperience),
          teaching_style: formData.teachingStyle,
          interests: formData.interests.split(',').map(s => s.trim()),
          notification_preferences: {
            event_reminder: parseInt(formData.eventReminder),
            notification_style: formData.notificationStyle
          }
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      setEditing(false);
      loadProfile();
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setIsPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== user?.email) {
      toast.error('Email confirmation does not match');
      return;
    }

    try {
      // Delete user data first
      const { error: dataError } = await supabase
        .from('users')
        .delete()
        .eq('id', user?.id);

      if (dataError) throw dataError;

      // Mark user as deleted in auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { deleted: true }
      });

      if (authError) throw authError;

      await signOut();
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Failed to delete account. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {/* Profile Settings */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <User className="h-6 w-6 text-gray-400" />
              <h2 className="ml-3 text-lg font-medium text-gray-900">Profile Settings</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="subjectsTaught">Subjects Taught</Label>
                <Input
                  id="subjectsTaught"
                  name="subjectsTaught"
                  value={formData.subjectsTaught}
                  onChange={handleChange}
                  placeholder="Comma-separated subjects"
                />
              </div>

              <div>
                <Label htmlFor="gradeLevels">Grade Levels</Label>
                <Input
                  id="gradeLevels"
                  name="gradeLevels"
                  value={formData.gradeLevels}
                  onChange={handleChange}
                  placeholder="Comma-separated grades"
                />
              </div>

              <div>
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  type="number"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="teachingStyle">Teaching Style</Label>
                <Textarea
                  id="teachingStyle"
                  name="teachingStyle"
                  value={formData.teachingStyle}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="interests">Professional Interests</Label>
                <Input
                  id="interests"
                  name="interests"
                  value={formData.interests}
                  onChange={handleChange}
                  placeholder="Comma-separated interests"
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {profile && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">School</h3>
                    <p className="mt-1 text-sm text-gray-900">{profile.school_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Subjects</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {profile.subjects_taught.map((subject) => (
                        <span key={subject} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Grade Levels</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {profile.grade_levels.map((grade) => (
                        <span key={grade} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {grade}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Notification Settings */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Bell className="h-6 w-6 text-gray-400" />
              <div className="ml-3">
                <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
                <p className="mt-1 text-sm text-gray-500">Manage your notification preferences</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="eventReminder">Event Reminder</Label>
              <select
                id="eventReminder"
                name="eventReminder"
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                value={formData.eventReminder}
                onChange={handleChange}
              >
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="120">2 hours before</option>
              </select>
            </div>

            <div>
              <Label htmlFor="notificationStyle">Notification Style</Label>
              <select
                id="notificationStyle"
                name="notificationStyle"
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                value={formData.notificationStyle}
                onChange={handleChange}
              >
                <option value="popup">Popup Notification</option>
                <option value="glow">Glowing Effect</option>
                <option value="standard">Standard Toast</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-gray-400" />
              <div className="ml-3">
                <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
                <p className="mt-1 text-sm text-gray-500">Update your security preferences</p>
              </div>
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(true)}
              >
                Change Password
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteAccountDialogOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="p-6">
          <div className="flex items-center">
            <Palette className="h-6 w-6 text-gray-400" />
            <div className="ml-3">
              <h2 className="text-lg font-medium text-gray-900">Appearance</h2>
              <p className="mt-1 text-sm text-gray-500">Customize your interface</p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">
                Warning: This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>
            <div>
              <Label htmlFor="deleteConfirmation">
                Please type your email ({user?.email}) to confirm deletion
              </Label>
              <Input
                id="deleteConfirmation"
                type="email"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="mt-1"
                placeholder={user?.email}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteAccountDialogOpen(false);
                  setDeleteConfirmation('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== user?.email}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}