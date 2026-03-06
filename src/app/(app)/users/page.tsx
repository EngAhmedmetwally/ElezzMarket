
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { UsersClient } from "./components/client";
import { getUserColumns } from "./components/columns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddUserForm } from "./components/add-user-form";
import { useLanguage } from "@/components/language-provider";
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";

export default function UsersPage() {
  const { language } = useLanguage();
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);

  const { data: users, isLoading } = useRealtimeCachedCollection<User>('users');

  const handleSuccess = () => {
    setIsAddUserOpen(false);
    setEditingUser(null);
  }
  
  const columns = getUserColumns(language, setEditingUser);

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'المستخدمون' : 'Users'}>
        <Button onClick={() => setIsAddUserOpen(true)} disabled={isLoading}>
          <PlusCircle className="me-2 h-4 w-4" />
          {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <UsersClient 
          data={users || []} 
          columns={columns} 
          onUpdate={() => {}} 
          onEdit={setEditingUser}
        />
      )}

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AddUserForm onSuccess={handleSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل المستخدم' : 'Edit User'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {editingUser && <AddUserForm userToEdit={editingUser} onSuccess={handleSuccess} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
