import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" />
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Detailed reports and analytics will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
