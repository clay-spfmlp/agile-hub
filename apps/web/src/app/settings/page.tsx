'use client';

import { useAuth } from '@repo/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { Button } from '@repo/ui/components/base/button';
import { Badge } from '@repo/ui/components/base/badge';
import { 
  Settings, 
  User, 
  Bell,
  Shield,
  Palette,
  Globe
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Role-based redirect logic
      switch (user.role) {
        case 'SCRUM_MASTER':
        case 'ADMIN':
          // Stay on this page
          break;
        case 'USER':
        default:
          router.push('/planning');
          break;
      }
    } else if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Settings className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'SCRUM_MASTER' && user.role !== 'ADMIN')) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const settingsCards = [
    {
      icon: User,
      title: "Profile Settings",
      description: "Update your personal information and account details",
      color: "blue",
      comingSoon: false
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configure when and how you receive notifications",
      color: "green",
      comingSoon: true
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Manage your password and privacy settings",
      color: "purple",
      comingSoon: true
    },
    {
      icon: Palette,
      title: "Appearance",
      description: "Customize the look and feel of your workspace",
      color: "pink",
      comingSoon: true
    },
    {
      icon: Globe,
      title: "Language & Region",
      description: "Set your preferred language and regional settings",
      color: "orange",
      comingSoon: true
    },
    {
      icon: Settings,
      title: "Planning Defaults",
      description: "Configure default settings for planning sessions",
      color: "indigo",
      comingSoon: true
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      pink: "bg-pink-100 text-pink-600",
      orange: "bg-orange-100 text-orange-600",
      indigo: "bg-indigo-100 text-indigo-600"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600 text-lg mt-2">
          Manage your account preferences and application settings
        </p>
      </div>

      {/* User Info Card */}
      <Card className="border-0 shadow-lg bg-white/70 backdrop-blur mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-xl font-semibold text-blue-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-xl">{user.name}</span>
              <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-700">
                {user.role === 'SCRUM_MASTER' ? 'Scrum Master' : user.role}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription className="ml-15">
            {user.email}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.title} 
              className={`border-0 shadow-lg bg-white/70 backdrop-blur hover:shadow-xl transition-all cursor-pointer ${
                card.comingSoon ? 'opacity-75' : ''
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(card.color)}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {card.title}
                      {card.comingSoon && (
                        <Badge variant="outline" className="text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-base mb-4">
                  {card.description}
                </CardDescription>
                <Button 
                  variant={card.comingSoon ? "outline" : "default"} 
                  size="sm" 
                  className={!card.comingSoon ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" : ""}
                  disabled={card.comingSoon}
                >
                  {card.comingSoon ? 'Coming Soon' : 'Configure'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white mt-8">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
          <p className="text-blue-100 mb-6 text-lg">
            Check out our documentation or contact support for assistance with your settings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary">
              View Documentation
            </Button>
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 