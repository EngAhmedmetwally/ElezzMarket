
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddUserForm } from "./components/add-user-form";
import { useLanguage } from "@/components/language-provider";
import { useCollection, useDatabase, useMemoFirebase } from "@/firebase";
import { ref } from "firebase/database";
import type { User, UserRole } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const { language } = useLanguage();
  const columns = getUserColumns(language);
  const database = useDatabase();
  const [version, setVersion] = React.useState(0); // To force re-render

  const usersQuery = useMemoFirebase(() => {
    if (!database) return null;
    return ref(database, 'users');
  }, [database, version]);

  const { data: usersData, isLoading } = useCollection<any>(usersQuery);

  const users: User[] = React.useMemo(() => {
    if (!usersData) {
      return [];
    }
    return usersData.map((userDoc: any): User => {
      const name = userDoc.fullName || userDoc.name || "Unknown User";
      const status: "نشط" | "معطل" = typeof userDoc.isActive === 'boolean' 
        ? (userDoc.isActive ? 'نشط' : 'معطل') 
        : (userDoc.status || 'معطل');
      const role: UserRole = userDoc.role || 'Moderator';
      const avatarUrl = userDoc.avatarUrl || `/avatars/0${(userDoc.id.charCodeAt(0) % 6) + 1}.png`;
      const createdAt = userDoc.createdAt ? new Date(userDoc.createdAt).toISOString() : new Date().toISOString();

      return {
        id: userDoc.id,
        name,
        email: userDoc.email || '',
        role,
        avatarUrl,
        status,
        createdAt,
        orderVisibility: userDoc.orderVisibility || 'own',
      };
    });
  }, [usersData]);

  const handleSuccess = () => {
    setIsAddUserOpen(false);
    setVersion(v => v + 1); // Trigger a refetch
  }

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'المستخدمون' : 'Users'}>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading}>
              <PlusCircle className="me-2 h-4 w-4" />
              {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <AddUserForm onSuccess={handleSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>
      {isLoading ? (
        <div className="space-y-4">
            <div className="flex items-center py-4">
                <Skeleton className="h-10 w-full max-w-sm" />
            </div>
            <div className="rounded-md border">
                <div className="p-4 space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        </div>
      ) : (
        <UsersClient data={users} columns={columns} />
      )}
    </div>
  );
}
