"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, PlusCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import TeamCard from '@/components/TeamCard'; // Import the new TeamCard component
import { Link } from 'react-router-dom';

interface Team {
  id: string;
  team_name: string;
  project_title: string;
  created_by: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      if (user) {
        setIsLoadingTeams(true);
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .eq('created_by', user.id);

        if (error) {
          console.error('Error fetching teams:', error);
          showError('Failed to load your teams.');
          setTeams([]);
        } else {
          setTeams(data || []);
        }
        setIsLoadingTeams(false);
      }
    };

    if (!isSessionLoading) {
      fetchTeams();
    }
  }, [user, isSessionLoading]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
      showError('Failed to log out.');
    } else {
      showSuccess('You have been logged out.');
    }
  };

  if (isSessionLoading || isLoadingTeams) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-4xl mt-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-3xl font-bold">Your Teams</CardTitle>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <CardDescription className="mb-4">
            Manage your project teams here.
          </CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.length > 0 ? (
              teams.map((team) => <TeamCard key={team.id} team={team} />)
            ) : (
              <p className="col-span-full text-center text-muted-foreground">
                You haven't created any teams yet.
              </p>
            )}
            <Card className="flex flex-col items-center justify-center p-6 border-2 border-dashed hover:border-primary transition-colors duration-200">
              <Link to="/create-team" className="flex flex-col items-center justify-center text-center text-primary hover:text-primary-foreground">
                <PlusCircle className="h-10 w-10 mb-2" />
                <span className="text-lg font-semibold">Create New Team</span>
              </Link>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;