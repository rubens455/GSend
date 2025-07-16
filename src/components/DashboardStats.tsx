import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Send, CheckCircle, MousePointer, TrendingUp } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";

interface DashboardStats {
  totalContacts: number;
  messagesSent: number;
  deliveryRate: number;
  clickRate: number;
}

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-slate-500">
              <p>No data available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Contacts",
      value: formatNumber(stats.totalContacts),
      icon: Users,
      color: "emerald",
      trend: "+23% this month",
    },
    {
      title: "Messages Sent",
      value: formatNumber(stats.messagesSent),
      icon: Send,
      color: "cyan",
      trend: "+31% this month",
    },
    {
      title: "Delivery Rate",
      value: formatPercent(stats.deliveryRate),
      icon: CheckCircle,
      color: "green",
      trend: "Above average",
    },
    {
      title: "Click Rate",
      value: formatPercent(stats.clickRate),
      icon: MousePointer,
      color: "orange",
      trend: "+2.1% vs last month",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="shadow-sm border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                <p className={`text-${stat.color}-600 text-sm mt-2 flex items-center`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>{stat.trend}</span>
                </p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`text-${stat.color}-600 h-6 w-6`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
