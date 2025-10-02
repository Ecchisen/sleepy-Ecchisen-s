"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, FolderGit2 } from 'lucide-react';

interface TeamCardProps {
  team: {
    id: string;
    team_name: string;
    project_title: string;
    created_at: string;
  };
}

const TeamCard: React.FC<TeamCardProps> = ({ team }) => {
  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {team.team_name}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <FolderGit2 className="h-4 w-4 text-muted-foreground" />
          {team.project_title}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Created: {new Date(team.created_at).toLocaleDateString()}
        </span>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/teams/${team.id}`}>View Team</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default TeamCard;