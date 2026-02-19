
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
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";

export default function UsersPage() {
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const { language } = useLanguage();

  const handleSuccess = () => {
    setIsAddUserOpen(false);
  }
  
  const columns = getUserColumns(language, handleSuccess);

  const { data: users, isLoading } = useRealtimeCachedCollection<User>('users');

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
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
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
        <UsersClient data={users || []} columns={columns} onUpdate={handleSuccess} />
      )}
    </div>
  );
}
