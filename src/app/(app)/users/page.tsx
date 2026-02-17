"use client";

import * as React from "react";
import { mockUsers } from "@/lib/data";
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

export default function UsersPage() {
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const { language } = useLanguage();
  const columns = getUserColumns(language);

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'المستخدمون' : 'Users'}>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="me-2 h-4 w-4" />
              {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <AddUserForm onSuccess={() => setIsAddUserOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <UsersClient data={mockUsers} columns={columns} />
    </div>
  );
}
