import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    schoolName: '',
    subjectsTaught: '',
    gradeLevels: '',
    yearsOfExperience: '',
    teachingStyle: '',
    interests: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          school_name: formData.schoolName,
          subjects_taught: formData.subjectsTaught.split(',').map(s => s.trim()),
          grade_levels: formData.gradeLevels.split(',').map(s => s.trim()),
          years_of_experience: parseInt(formData.yearsOfExperience),
          teaching_style: formData.teachingStyle,
          interests: formData.interests.split(',').map(s => s.trim()),
          onboarding_completed: true
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Help us personalize your experience
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="schoolName">School Name</Label>
              <Input
                id="schoolName"
                name="schoolName"
                type="text"
                required
                value={formData.schoolName}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="subjectsTaught">Subjects Taught (comma-separated)</Label>
              <Input
                id="subjectsTaught"
                name="subjectsTaught"
                type="text"
                required
                placeholder="Math, Science, History"
                value={formData.subjectsTaught}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="gradeLevels">Grade Levels (comma-separated)</Label>
              <Input
                id="gradeLevels"
                name="gradeLevels"
                type="text"
                required
                placeholder="9, 10, 11, 12"
                value={formData.gradeLevels}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="yearsOfExperience">Years of Experience</Label>
              <Input
                id="yearsOfExperience"
                name="yearsOfExperience"
                type="number"
                required
                min="0"
                value={formData.yearsOfExperience}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="teachingStyle">Teaching Style</Label>
              <Textarea
                id="teachingStyle"
                name="teachingStyle"
                required
                placeholder="Describe your teaching approach..."
                value={formData.teachingStyle}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="interests">Professional Interests (comma-separated)</Label>
              <Input
                id="interests"
                name="interests"
                type="text"
                required
                placeholder="EdTech, Project-based Learning, STEM"
                value={formData.interests}
                onChange={handleChange}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}