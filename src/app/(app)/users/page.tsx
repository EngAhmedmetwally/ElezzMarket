import { mockUsers } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { UsersClient } from "./components/client";
import { columns } from "./components/columns";

export default function UsersPage() {
  return (
    <div>
      <PageHeader title="Users" >
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </PageHeader>
      <UsersClient data={mockUsers} columns={columns} />
    </div>
  );
}
