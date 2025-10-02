"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Github, Link as LinkIcon, UserPlus, Trash2, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Team {
  id: string;
  team_name: string;
  project_title: string;
  created_by: string;
  created_at: string;
}

interface Project {
  id: string;
  team_id: string;
  abstract: string;
  github_link: string | null;
  live_link: string | null;
  tech_stack: string[] | null;
  screenshots: string[] | null;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

const TeamDetails: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [liveLink, setLiveLink] = useState('');

  const isTeamAdmin = user && members.some(m => m.user_id === user.id && m.role === 'admin');

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!teamId) {
        showError('Team ID is missing.');
        navigate('/dashboard');
        return;
      }

      setIsLoading(true);
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError || !teamData) {
        console.error('Error fetching team:', teamError);
        showError('Failed to load team details.');
        navigate('/dashboard');
        setIsLoading(false);
        return;
      }
      setTeam(teamData);

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('team_id', teamId)
        .single();

      if (projectError || !projectData) {
        console.error('Error fetching project:', projectError);
        showError('Failed to load project details.');
        // Don't navigate away, but indicate no project
        setProject(null);
        setGithubLink('');
        setLiveLink('');
      } else {
        setProject(projectData);
        setGithubLink(projectData.github_link || '');
        setLiveLink(projectData.live_link || '');
      }

      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles (first_name, last_name, avatar_url)
        `)
        .eq('team_id', teamId);

      if (membersError) {
        console.error('Error fetching team members:', membersError);
        showError('Failed to load team members.');
        setMembers([]);
      } else {
        setMembers(membersData || []);
      }

      setIsLoading(false);
    };

    if (!isSessionLoading) {
      fetchTeamDetails();
    }
  }, [teamId, isSessionLoading, navigate]);

  const handleUpdateProjectLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) {
      showError('No project found to update.');
      return;
    }

    setIsUpdatingProject(true);
    const { error } = await supabase
      .from('projects')
      .update({
        github_link: githubLink.trim() === '' ? null : githubLink,
        live_link: liveLink.trim() === '' ? null : liveLink,
      })
      .eq('id', project.id);

    if (error) {
      console.error('Error updating project links:', error);
      showError('Failed to update project links.');
    } else {
      showSuccess('Project links updated successfully!');
      setProject(prev => prev ? { ...prev, github_link: githubLink, live_link: liveLink } : null);
    }
    setIsUpdatingProject(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      showError('Please enter an email address.');
      return;
    }
    if (!teamId) {
      showError('Team ID is missing.');
      return;
    }

    setIsAddingMember(true);
    try {
      // Call Edge Function to resolve email to user ID
      const response = await fetch(`https://lnxumaokcwtconyvgtbb.supabase.co/functions/v1/resolve-user-by-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ email: newMemberEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resolve user email.');
      }

      const { userId } = await response.json();

      // Check if user is already a member
      if (members.some(m => m.user_id === userId)) {
        showError('This user is already a member of the team.');
        setIsAddingMember(false);
        return;
      }

      // Add member to team_members table
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: 'member',
        });

      if (error) {
        console.error('Error adding team member:', error);
        showError('Failed to add team member. Make sure the user exists and you have admin rights.');
      } else {
        showSuccess('Team member added successfully!');
        setNewMemberEmail('');
        // Re-fetch members to update the list
        const { data: updatedMembers, error: fetchError } = await supabase
          .from('team_members')
          .select(`
            *,
            profiles (first_name, last_name, avatar_url)
          `)
          .eq('team_id', teamId);
        if (!fetchError) {
          setMembers(updatedMembers || []);
        }
      }
    } catch (error: any) {
      console.error('Error in add member process:', error.message);
      showError(error.message);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!teamId || !user) {
      showError('Authentication or team ID missing.');
      return;
    }

    // Prevent removing self if you are the only admin
    const adminMembers = members.filter(m => m.role === 'admin');
    if (memberId === user.id && adminMembers.length === 1 && adminMembers[0].user_id === user.id) {
      showError('You cannot remove yourself if you are the only admin of the team.');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', memberId);

    if (error) {
      console.error('Error removing member:', error);
      showError('Failed to remove member. You might not have the necessary permissions.');
    } else {
      showSuccess('Member removed successfully!');
      setMembers(members.filter(m => m.user_id !== memberId));
    }
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Team Not Found</CardTitle>
            <CardDescription>The team you are looking for does not exist or you do not have access.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-4xl mt-8 space-y-6">
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{team.team_name}</CardTitle>
            <CardDescription>Project: {team.project_title}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Created: {new Date(team.created_at).toLocaleDateString()}</p>
          </CardContent>
        </Card>

        {project && (
          <Card>
            <CardHeader>
              <CardTitle>Project Links</CardTitle>
              <CardDescription>Update your project's GitHub and live demo links.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProjectLinks} className="space-y-4">
                <div>
                  <Label htmlFor="githubLink">GitHub Repository</Label>
                  <Input
                    id="githubLink"
                    type="url"
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                    placeholder="https://github.com/your-team/your-project"
                    disabled={!isTeamAdmin}
                  />
                </div>
                <div>
                  <Label htmlFor="liveLink">Live Demo URL</Label>
                  <Input
                    id="liveLink"
                    type="url"
                    value={liveLink}
                    onChange={(e) => setLiveLink(e.target.value)}
                    placeholder="https://your-project.vercel.app"
                    disabled={!isTeamAdmin}
                  />
                </div>
                {isTeamAdmin && (
                  <Button type="submit" disabled={isUpdatingProject}>
                    {isUpdatingProject ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Links'
                    )}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage who is part of your team.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.length > 0 ? (
                members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profiles?.avatar_url || undefined} />
                        <AvatarFallback>{member.profiles?.first_name?.charAt(0) || member.profiles?.last_name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.profiles?.first_name} {member.profiles?.last_name}
                          {member.user_id === user?.id && ' (You)'}
                        </p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    {isTeamAdmin && member.user_id !== user?.id && ( // Admins can't remove themselves directly here
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={isAddingMember} // Disable during other member operations
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No members yet. Add some below!</p>
              )}
            </div>

            {isTeamAdmin && (
              <form onSubmit={handleAddMember} className="mt-6 space-y-2">
                <Label htmlFor="newMemberEmail">Add New Member by Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="newMemberEmail"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="member@example.com"
                    required
                    className="flex-grow"
                  />
                  <Button type="submit" disabled={isAddingMember}>
                    {isAddingMember ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    <span className="sr-only">Add Member</span>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamDetails;