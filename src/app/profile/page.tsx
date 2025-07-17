
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Calendar, TrendingUp, Gamepad2, Percent, Edit, Fingerprint } from "lucide-react";

// In a real app, this data would come from the logged-in user's session
const initialUserProfile = {
  name: "Alex Doe",
  playerId: "PLYR-8D7F6E5C",
  email: "alex.doe@example.com",
  avatarUrl: "https://placehold.co/100x100.png",
  joinDate: new Date().toISOString().split('T')[0],
  stats: {
    totalEarnings: 0,
    gamesPlayed: 0,
    winRate: 0,
  },
};

export default function ProfilePage() {
    const [userProfile, setUserProfile] = useState(initialUserProfile);

    const formattedJoinDate = new Date(userProfile.joinDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center items-center">
            <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
              <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} data-ai-hint="profile avatar" />
              <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
            </Avatar>
          <CardTitle className="text-3xl font-bold text-primary">{userProfile.name}</CardTitle>
          <CardDescription>Your personal account and game statistics.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            
            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2"><User className="w-5 h-5 text-accent"/> Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Fingerprint className="w-5 h-5 text-muted-foreground"/>
                        <div>
                            <p className="text-muted-foreground">Player ID</p>
                            <p className="font-medium">{userProfile.playerId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Mail className="w-5 h-5 text-muted-foreground"/>
                        <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="font-medium">{userProfile.email}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="w-5 h-5 text-muted-foreground"/>
                        <div>
                            <p className="text-muted-foreground">Joined On</p>
                            <p className="font-medium">{formattedJoinDate}</p>
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                 <h3 className="font-semibold text-lg flex items-center gap-2"><Gamepad2 className="w-5 h-5 text-accent"/> Game Statistics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <TrendingUp className="w-6 h-6 mx-auto text-primary mb-2"/>
                        <p className="text-2xl font-bold">₹{userProfile.stats.totalEarnings}</p>
                        <p className="text-sm text-muted-foreground">Total Earnings</p>
                    </div>
                     <div className="p-4 bg-muted/50 rounded-lg">
                        <Gamepad2 className="w-6 h-6 mx-auto text-primary mb-2"/>
                        <p className="text-2xl font-bold">{userProfile.stats.gamesPlayed}</p>
                        <p className="text-sm text-muted-foreground">Games Played</p>
                    </div>
                     <div className="p-4 bg-muted/50 rounded-lg">
                        <Percent className="w-6 h-6 mx-auto text-primary mb-2"/>
                        <p className="text-2xl font-bold">{userProfile.stats.winRate}%</p>
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                    </div>
                </div>
            </div>
            
            <div className="pt-4 flex justify-end">
                <Button variant="outline">
                    <Edit className="mr-2"/>
                    Edit Profile
                </Button>
            </div>

        </CardContent>
      </Card>
    </div>
  );
}
