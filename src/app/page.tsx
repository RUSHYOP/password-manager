'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Sidebar, Header } from '@/components/layout';
import { GroupList, GroupForm } from '@/components/groups';
import { PasswordList, PasswordForm } from '@/components/passwords';
import { usePasswordStore } from '@/store/password-store';
import { useKeyboardShortcuts } from '@/hooks';

export default function Home() {
  const { groups, selectedGroupId, theme, setTheme, importData, exportData } = usePasswordStore();
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme
  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme, mounted]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrlKey: true,
      action: () => setShowPasswordForm(true),
      description: 'New Password',
    },
    {
      key: 'g',
      ctrlKey: true,
      action: () => setShowGroupForm(true),
      description: 'New Group',
    },
    {
      key: 'f',
      ctrlKey: true,
      action: () => {
        const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus Search',
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      description: 'Toggle Theme',
    },
    {
      key: 'Escape',
      action: () => {
        setShowGroupForm(false);
        setShowPasswordForm(false);
      },
      description: 'Close Dialog',
    },
  ]);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securevault-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.groups && data.passwords) {
          importData(data);
          toast.success('Data imported successfully');
        } else {
          toast.error('Invalid file format');
        }
      } catch {
        toast.error('Failed to parse file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleNewPassword = () => {
    if (groups.length === 0) {
      toast.error('Please create a group first');
      setShowGroupForm(true);
      return;
    }
    setShowPasswordForm(true);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-72 h-screen glass border-r border-white/10" />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-10 glass border-b border-white/10 px-6 py-4 h-20" />
          <div className="flex-1 overflow-y-auto p-6" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Sidebar */}
      <Sidebar
        onNewGroup={() => setShowGroupForm(true)}
        onNewPassword={handleNewPassword}
        onImport={handleImport}
        onExport={handleExport}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={selectedGroup ? selectedGroup.name : 'All Passwords'}
          subtitle={
            selectedGroup
              ? `Manage passwords in ${selectedGroup.name}`
              : 'View and manage all your passwords'
          }
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {selectedGroupId ? (
            <PasswordList onNewPassword={handleNewPassword} />
          ) : (
            <div className="space-y-8">
              {/* Groups Overview */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Your Groups</h2>
                <GroupList onNewGroup={() => setShowGroupForm(true)} />
              </section>

              {/* All Passwords */}
              {groups.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Recent Passwords</h2>
                  <PasswordList onNewPassword={handleNewPassword} />
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <GroupForm open={showGroupForm} onOpenChange={setShowGroupForm} />
      <PasswordForm
        open={showPasswordForm}
        onOpenChange={setShowPasswordForm}
        defaultGroupId={selectedGroupId}
      />
    </div>
  );
}
