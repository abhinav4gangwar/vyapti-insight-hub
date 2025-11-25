import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ChangeType, Investigation } from "./types";

const changeTypeConfig: Record<ChangeType, { label: string; gradient: string }> = {
  NEW_INVESTIGATION: { label: "New Investigation", gradient: "from-blue-600 to-cyan-600" },
  STATUS_CONCLUDED: { label: "Newly Concluded", gradient: "from-red-600 to-rose-600" },
  UPDATED: { label: "Updated", gradient: "from-amber-600 to-orange-500" },
  OTHER: { label: "Changed", gradient: "from-purple-600 to-indigo-600" },
};

export default function InvestigationCard({ investigation, triggerType, detectedAt }: {
  investigation: Investigation;
  triggerType?: ChangeType;
  detectedAt?: string;
}) {
  const isOngoing = investigation.status === "Ongoing";

  return (
    <Link to={`/dgtr-db/${investigation.slug}`} className="block">
      <Card className="h-full hover:shadow-lg transition-all border border-gray-200 hover:border-blue-500">
        {triggerType && (
          <div className={`bg-gradient-to-r ${changeTypeConfig[triggerType].gradient} text-white text-xs font-bold px-4 py-1.5 text-center`}>
            {changeTypeConfig[triggerType].label}
            {detectedAt && ` • ${new Date(detectedAt).toLocaleDateString()}`}
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-3">
            <h3 className="font-semibold text-sm leading-tight line-clamp-3 text-gray-900">
              {investigation.title}
            </h3>
            <Badge variant={isOngoing ? "default" : "destructive"}
                   className={isOngoing ? "bg-green-600" : "bg-red-600"}>
              {investigation.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-gray-600 space-y-1 pt-2">
          <p className="font-medium text-gray-800 line-clamp-2">
            {investigation.country || "Multiple Countries"}
          </p>
          <p>Anti-dumping Investigation</p>
        </CardContent>
      </Card>
    </Link>
  );
}