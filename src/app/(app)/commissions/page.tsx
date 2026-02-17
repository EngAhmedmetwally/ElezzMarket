import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CommissionsPage() {
  return (
    <div>
      <PageHeader title="Commissions" />
      <Card>
        <CardHeader>
          <CardTitle>Commission System Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This section is under development. You will be able to manage commission rules and view monthly summaries here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
