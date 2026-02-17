"use client";

import * as React from "react";
import { mockUsers } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { UsersClient } from "./components/client";
import { columns } from "./components/columns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddUserForm } from "./components/add-user-form";

export default function UsersPage() {
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);

  return (
    <div>
      <PageHeader title="Users">
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
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
