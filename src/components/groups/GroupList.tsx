'use client';

import { useState } from 'react';
import { FolderOpen, Plus, AlertTriangle } from 'lucide-react';
import { GroupCard } from './GroupCard';
import { GroupForm } from './GroupForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePasswordStore } from '@/store/password-store';
import type { Group } from '@/types';

interface GroupListProps {
  onNewGroup: () => void;
}

export function GroupList({ onNewGroup }: GroupListProps) {
  const { groups, deleteGroup } = usePasswordStore();
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleEdit = (group: Group) => {
    setEditGroup(group);
    setShowEditDialog(true);
  };

  const handleDelete = (groupId: string) => {
    setDeleteGroupId(groupId);
  };

  const confirmDelete = () => {
    if (deleteGroupId) {
      deleteGroup(deleteGroupId);
      setDeleteGroupId(null);
    }
  };

  const groupToDelete = groups.find(g => g.id === deleteGroupId);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="p-6 rounded-full bg-white/5 mb-6">
          <FolderOpen className="w-16 h-16 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No groups yet</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Groups help you organize your passwords. Create your first group to get started.
        </p>
        <Button
          onClick={onNewGroup}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Group
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onEdit={() => handleEdit(group)}
            onDelete={() => handleDelete(group.id)}
          />
        ))}
        
        {/* Add New Group Card */}
        <button
          onClick={onNewGroup}
          className="glass-card p-5 border-dashed border-2 border-white/10 hover:border-purple-500/30 flex flex-col items-center justify-center min-h-[160px] transition-all group"
        >
          <div className="p-3 rounded-xl bg-white/5 group-hover:bg-purple-500/20 transition-colors mb-3">
            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-purple-400 transition-colors" />
          </div>
          <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">
            Add New Group
          </span>
        </button>
      </div>

      {/* Edit Dialog */}
      <GroupForm
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        editGroup={editGroup}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteGroupId} onOpenChange={(open) => !open && setDeleteGroupId(null)}>
        <DialogContent className="glass border-white/10 sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <DialogTitle>Delete Group</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{groupToDelete?.name}</strong>? 
              This will also delete all passwords in this group. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteGroupId(null)}
              className="glass-subtle border-white/10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
