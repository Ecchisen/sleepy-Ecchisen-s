"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';

const CreateTeam: React.FC = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError('You must be logged in to create a team.');
      return;
    }
    if (!teamName.trim() || !projectTitle.trim()) {
      showError('Team Name and Project Title cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('teams')
      .insert({
        team_name: teamName,
        project_title: projectTitle,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      showError('Failed to create team. Please try again.');
    } else {
      showSuccess('Team created successfully!');
      navigate('/dashboard'); // Redirect to dashboard after creating team
    }
    setIsSubmitting(false);
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create New Team</CardTitle>
          <CardDescription>Set up your team and its main project.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., Innovators"
                required
              />
            </div>
            <div>
              <Label htmlFor="projectTitle">Project Title</Label>
              <Input
                id="projectTitle"
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g., AI-Powered Chatbot"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTeam;