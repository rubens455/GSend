import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, Send, Clock, Tags, Heart } from "lucide-react";
import { formatDateTime, getStatusColor } from "@/lib/utils";
import type { Campaign } from "@shared/schema";

export default function CampaignList() {
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-6 w-20 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentCampaigns = campaigns?.slice(0, 5) || [];

  const getIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return Clock;
      case 'sent':
      case 'delivered':
        return Send;
      default:
        return Tags;
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Campaigns</CardTitle>
          <a href="/campaigns" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
            View all
          </a>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {recentCampaigns.length === 0 ? (
          <div className="text-center py-8">
            <Send className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">No campaigns yet</p>
            <p className="text-sm text-slate-400">Create your first campaign to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentCampaigns.map((campaign) => {
              const IconComponent = getIcon(campaign.status);
              return (
                <div key={campaign.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{campaign.name}</h4>
                      <p className="text-sm text-slate-500">
                        {campaign.status === 'scheduled' && campaign.scheduledAt
                          ? `Scheduled for ${formatDateTime(campaign.scheduledAt)}`
                          : `Sent to ${campaign.contactsCount || 0} contacts`}
                        {campaign.sentAt && ` • ${formatDateTime(campaign.sentAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                    {campaign.deliveredCount !== undefined && (
                      <p className="text-sm text-slate-500 mt-1">
                        {((campaign.deliveredCount / (campaign.sentCount || 1)) * 100).toFixed(1)}% delivery
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
