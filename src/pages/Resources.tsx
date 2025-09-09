import React, { useState, useRef } from 'react';
import { Search, Plus, FileText, Link as LinkIcon, FolderOpen, Trash2, Upload, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  url?: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

export default function Resources() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    type: 'document',
    url: '',
    file: null as File | null
  });

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching resources:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user?.id
  });

  const addResourceMutation = useMutation({
    mutationFn: async (resourceData: typeof newResource) => {
      if (!user?.id) throw new Error('User not authenticated');

      let fileUrl = null;
      let fileType = null;
      let fileSize = null;

      if (resourceData.file) {
        const fileExt = resourceData.file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload file to Supabase Storage
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('resources')
          .upload(filePath, resourceData.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('resources')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileType = resourceData.file.type;
        fileSize = resourceData.file.size;
      }

      // Create resource record
      const { data, error } = await supabase
        .from('resources')
        .insert([{
          title: resourceData.title,
          description: resourceData.description,
          type: resourceData.type,
          url: resourceData.type === 'link' ? resourceData.url : fileUrl,
          file_type: fileType,
          file_size: fileSize,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource added successfully');
      setIsDialogOpen(false);
      setNewResource({
        title: '',
        description: '',
        type: 'document',
        url: '',
        file: null
      });
    },
    onError: (error: Error) => {
      console.error('Error adding resource:', error);
      toast.error(`Failed to add resource: ${error.message}`);
    }
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (resource: Resource) => {
      if (!user?.id) throw new Error('User not authenticated');

      // If it's a file, delete from storage first
      if (resource.type === 'document' && resource.url) {
        const filePath = resource.url.split('/resources/')[1];
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('resources')
            .remove([filePath]);

          if (storageError) {
            console.error('Storage deletion error:', storageError);
            throw storageError;
          }
        }
      }

      // Delete database record
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resource.id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting resource:', error);
      toast.error(`Failed to delete resource: ${error.message}`);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addResourceMutation.mutateAsync(newResource);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const handleDelete = (resource: Resource) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      deleteResourceMutation.mutate(resource);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, Word, Excel, PowerPoint, or text files.');
        return;
      }

      setNewResource(prev => ({
        ...prev,
        file,
        title: file.name.split('.')[0], // Set title to filename by default
        type: 'document'
      }));

      // Automatically open dialog for additional details
      setIsDialogOpen(true);
    }
  };

  const handleDownload = async (resource: Resource) => {
    if (!resource.url) {
      toast.error('No file available for download');
      return;
    }

    try {
      const filePath = resource.url.split('/resources/')[1];
      if (!filePath) {
        toast.error('Invalid file path');
        return;
      }

      const { data, error } = await supabase.storage
        .from('resources')
        .download(filePath);

      if (error) {
        throw error;
      }

      // Create a download link
      const blob = new Blob([data], { type: resource.file_type || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.title + '.' + filePath.split('.').pop();
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
        <div className="flex space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-5 w-5 mr-2" />
            Upload File
          </Button>
          <Button onClick={() => {
            setNewResource({
              title: '',
              description: '',
              type: 'link',
              url: '',
              file: null
            });
            setIsDialogOpen(true);
          }}>
            <Plus className="h-5 w-5 mr-2" />
            Add Link
          </Button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                className="pl-10"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Loading resources...</div>
          ) : (
            <div className="space-y-4">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    {resource.type === 'document' && <FileText className="h-5 w-5 text-blue-500 mr-3" />}
                    {resource.type === 'link' && <LinkIcon className="h-5 w-5 text-green-500 mr-3" />}
                    {resource.type === 'folder' && <FolderOpen className="h-5 w-5 text-yellow-500 mr-3" />}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{resource.title}</h3>
                      <p className="text-sm text-gray-500">{resource.description}</p>
                      {resource.url && (
                        <div className="mt-1">
                          {resource.type === 'link' ? (
                            <a 
                              href={resource.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-500"
                            >
                              View Resource
                            </a>
                          ) : (
                            <Button
                              variant="link"
                              size="sm"
                              className="text-indigo-600 hover:text-indigo-500 p-0"
                              onClick={() => handleDownload(resource)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      )}
                      {resource.file_size && (
                        <p className="text-xs text-gray-400 mt-1">
                          Size: {formatFileSize(resource.file_size)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(resource)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {filteredResources.length === 0 && (
                <p className="text-center text-gray-500">No resources found</p>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Resource</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                required
              />
            </div>
            {newResource.type === 'link' && (
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={newResource.url}
                  onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addResourceMutation.isPending}>
                {addResourceMutation.isPending ? 'Adding...' : 'Add Resource'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}