'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Settings, User, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  
  const sections = [
    {
      id: 'profile',
      label: 'Profile Information',
      icon: User,
      description: 'Update your photo, name, and bio.'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Manage your email and push notifications.'
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      description: 'Update your password and security settings.'
    }
  ];

  return (
    <div className="w-full max-w-4xl px-6 py-8">
      <div className="mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8 text-accent" />
          Settings
        </h1>
        <p className="text-muted mt-2">Manage your account preferences.</p>
      </div>

      <div className="grid gap-6">
        {sections.map((section) => (
          <div key={section.id} className="p-6 border border-border rounded-xl hover:border-accent/50 transition-colors cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                <section.icon className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1 group-hover:text-accent transition-colors">{section.label}</h3>
                <p className="text-muted">{section.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted">
             Signed in as <span className="font-medium text-foreground">{user?.email}</span>
          </p>
      </div>
    </div>
  );
}
