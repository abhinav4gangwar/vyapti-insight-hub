import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Investigation {
  uuid: string;
  title: string;
  country: string;
  status: string;
  url: string;
  product?: string;
}

export default function InvestigationCard({ investigation }: { investigation: Investigation }) {
  const isOngoing = investigation.status === "Ongoing";

  return (
    <a href={`/dgtr-db/${investigation.uuid}`} className="block">
      <Card className="h-full hover:shadow-lg transition-all border border-gray-200 hover:border-blue-500">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-3">
            <h3 className="font-semibold text-sm leading-tight line-clamp-3 text-gray-900">
              {investigation.title}
            </h3>
            <Badge 
              variant={isOngoing ? "default" : "destructive"}
              className={isOngoing ? "bg-green-600" : "bg-red-600"}
            >
              {investigation.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-gray-600 space-y-1 pt-2">
          <p className="font-medium text-gray-800 line-clamp-2">
            {investigation.country || "Multiple Countries"}
          </p>
          {investigation.product && (
            <p className="line-clamp-2">{investigation.product}</p>
          )}
          <p>Anti-dumping Investigation</p>
        </CardContent>
      </Card>
    </a>
  );
}