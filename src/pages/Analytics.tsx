"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Send, 
  Users, 
  CheckCircle, 
  MousePointer,
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { formatNumber, formatPercent, formatDate } from "@/lib/utils";
import type { Campaign, Contact } from "@shared/schema";

interface AnalyticsData {
  totalContacts: number;
  messagesSent: number;
  deliveryRate: number;
  clickRate: number;
}

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Calculate additional metrics
  const totalCampaigns = campaigns?.length || 0;
  const completedCampaigns = campaigns?.filter(c => c.status === 'sent').length || 0;
  const scheduledCampaigns = campaigns?.filter(c => c.status === 'scheduled').length || 0;
  
  const optedInContacts = contacts?.filter(c => c.isOptedIn).length || 0;
  const unsubscribedContacts = contacts?.filter(c => c.isUnsubscribed).length || 0;
  
  const totalClicks = campaigns?.reduce((sum, c) => sum + (c.clickCount || 0), 0) || 0;
  const totalUnsubscribes = campaigns?.reduce((sum, c) => sum + (c.unsubscribeCount || 0), 0) || 0;

  const topPerformingCampaigns = campaigns
    ?.filter(c => c.status === 'sent' && c.sentCount && c.sentCount > 0)
    .sort((a, b) => {
      const aRate = ((a.deliveredCount || 0) / (a.sentCount || 1)) * 100;
      const bRate = ((b.deliveredCount || 0) / (b.sentCount || 1)) * 100;
      return bRate - aRate;
    })
    .slice(0, 5) || [];

  return (
    <div>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
            <p className="text-slate-600 mt-1">Track your SMS marketing performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Messages Sent"
                value={formatNumber(stats?.messagesSent || 0)}
                icon={Send}
                color="emerald"
                trend="+12% vs last month"
                isLoading={statsLoading}
              />
              <MetricCard
                title="Delivery Rate"
                value={formatPercent(stats?.deliveryRate || 0)}
                icon={CheckCircle}
                color="green"
                trend="Above industry avg"
                isLoading={statsLoading}
              />
              <MetricCard
                title="Click-Through Rate"
                value={formatPercent(stats?.clickRate || 0)}
                icon={MousePointer}
                color="cyan"
                trend="+2.1% vs last month"
                isLoading={statsLoading}
              />
              <MetricCard
                title="Active Contacts"
                value={formatNumber(optedInContacts)}
                icon={Users}
                color="blue"
                trend={`${formatNumber(stats?.totalContacts || 0)} total`}
                isLoading={statsLoading}
              />
            </div>

            {/* Performance Chart */}
            <Card>
              <CardHeader className="border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <CardTitle>Message Performance Trends</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      7d
                    </Button>
                    <Button variant="outline" size="sm">30d</Button>
                    <Button variant="outline" size="sm">90d</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64 bg-gradient-to-t from-emerald-50 to-transparent rounded-lg relative overflow-hidden">
                  {/* Mock Chart - replace with actual chart library */}
                  <div className="absolute inset-0 flex items-end justify-between px-8 pb-4">
                    {[65, 78, 52, 84, 71, 89, 76].map((height, index) => (
                      <div
                        key={index}
                        className="w-8 bg-emerald-400 rounded-t transition-all duration-300 hover:bg-emerald-500"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                  
                  <div className="absolute top-4 right-4 flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                      <span className="text-sm text-slate-600">Messages Sent</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-cyan-400 rounded-full" />
                      <span className="text-sm text-slate-600">Delivered</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Total Campaigns</span>
                    <span className="font-semibold">{totalCampaigns}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Completed</span>
                    <span className="font-semibold text-green-600">{completedCampaigns}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Scheduled</span>
                    <span className="font-semibold text-yellow-600">{scheduledCampaigns}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Success Rate</span>
                    <span className="font-semibold">
                      {totalCampaigns > 0 ? ((completedCampaigns / totalCampaigns) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Total Clicks</span>
                    <span className="font-semibold">{formatNumber(totalClicks)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Unsubscribes</span>
                    <span className="font-semibold text-red-600">{formatNumber(totalUnsubscribes)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Opt-in Rate</span>
                    <span className="font-semibold">
                      {stats?.totalContacts ? ((optedInContacts / stats.totalContacts) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Unsubscribe Rate</span>
                    <span className="font-semibold">
                      {stats?.messagesSent ? ((totalUnsubscribes / stats.messagesSent) * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <Skeleton className="h-4 w-48 mb-2" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : topPerformingCampaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">No completed campaigns yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topPerformingCampaigns.map((campaign) => {
                      const deliveryRate = campaign.sentCount 
                        ? ((campaign.deliveredCount || 0) / campaign.sentCount) * 100 
                        : 0;
                      
                      return (
                        <div key={campaign.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900">{campaign.name}</h4>
                            <p className="text-sm text-slate-500">
                              Sent to {formatNumber(campaign.contactsCount || 0)} contacts • {formatDate(campaign.sentAt!)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{deliveryRate.toFixed(1)}%</p>
                            <p className="text-sm text-slate-500">delivery rate</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-slate-600">Opted In</span>
                    </div>
                    <span className="font-semibold">{formatNumber(optedInContacts)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span className="text-slate-600">Pending</span>
                    </div>
                    <span className="font-semibold">
                      {formatNumber((stats?.totalContacts || 0) - optedInContacts - unsubscribedContacts)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-slate-600">Unsubscribed</span>
                    </div>
                    <span className="font-semibold">{formatNumber(unsubscribedContacts)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Growth Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      +{formatNumber(Math.floor((stats?.totalContacts || 0) * 0.15))}
                    </p>
                    <p className="text-sm text-slate-500">New contacts this month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900">
                      {stats?.totalContacts ? ((optedInContacts / stats.totalContacts) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-sm text-slate-500">Opt-in conversion rate</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Manual Upload</span>
                    <span className="font-semibold">
                      {contacts?.filter(c => c.optInSource === 'csv_upload').length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Shopify Sync</span>
                    <span className="font-semibold">
                      {contacts?.filter(c => c.optInSource === 'shopify_sync').length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Double Opt-in</span>
                    <span className="font-semibold">
                      {contacts?.filter(c => c.optInSource === 'double_opt_in').length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Click Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-3xl font-bold text-cyan-600">{formatNumber(totalClicks)}</p>
                    <p className="text-slate-500 mt-2">Total clicks across all campaigns</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Average: {campaigns && campaigns.length > 0 
                        ? (totalClicks / campaigns.filter(c => c.status === 'sent').length).toFixed(1)
                        : 0} clicks per campaign
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Unsubscribe Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-3xl font-bold text-red-600">{formatNumber(totalUnsubscribes)}</p>
                    <p className="text-slate-500 mt-2">Total unsubscribes</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Rate: {stats?.messagesSent 
                        ? ((totalUnsubscribes / stats.messagesSent) * 100).toFixed(3)
                        : 0}% of sent messages
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  trend: string;
  isLoading: boolean;
}

function MetricCard({ title, value, icon: Icon, color, trend, isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-600 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            <p className={`text-${color}-600 text-sm mt-2 flex items-center`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>{trend}</span>
            </p>
          </div>
          <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
            <Icon className={`text-${color}-600 h-6 w-6`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
