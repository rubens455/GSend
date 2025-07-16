"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Upload, FileText, Shield } from "lucide-react";
import DashboardStats from "@/components/DashboardStats";
import CampaignList from "@/components/CampaignList";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
            <p className="text-slate-600 mt-1">Monitor your SMS marketing performance</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search campaigns, contacts..."
                className="pl-10 pr-4 py-2 w-64"
              />
            </div>
            {/* New Campaign Button */}
            <Link href="/campaigns?new=1">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow px-6 py-2 rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <DashboardStats />

        {/* Recent Campaigns & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Campaigns */}
          <CampaignList />

          {/* Quick Actions */}
          <Card>
            <CardHeader className="border-b border-slate-200">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Upload Contacts */}
              <Link href="/contacts">
                <Button
                  variant="outline"
                  className="w-full flex items-center space-x-3 p-4 h-auto border-2 border-dashed border-slate-300 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Upload className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Upload Contacts</p>
                    <p className="text-sm text-slate-500">Import CSV or sync from Shopify</p>
                  </div>
                </Button>
              </Link>

              {/* Create Template */}
              <Link href="/templates">
                <Button
                  variant="outline"
                  className="w-full flex items-center space-x-3 p-4 h-auto border-2 border-dashed border-slate-300 hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Create Template</p>
                    <p className="text-sm text-slate-500">Build reusable SMS templates</p>
                  </div>
                </Button>
              </Link>

              {/* Compliance Check */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-amber-600 mt-1" />
                  <div>
                    <p className="font-medium text-amber-800">Compliance Status</p>
                    <p className="text-sm text-amber-700 mt-1">
                      All contacts require double opt-in confirmation
                    </p>
                    <Link href="/contacts">
                      <Button variant="link" className="text-amber-800 hover:text-amber-900 p-0 h-auto mt-2">
                        Review →
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <Card>
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center justify-between">
              <CardTitle>Message Performance (Last 30 Days)</CardTitle>
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
            {/* Chart Placeholder */}
            <div className="h-64 bg-gradient-to-t from-emerald-50 to-transparent rounded-lg relative overflow-hidden">
              {/* Mock Chart */}
              <div className="absolute inset-0 flex items-end justify-between px-8 pb-4">
                {[60, 80, 45, 90, 70, 95, 85].map((height, index) => (
                  <div
                    key={index}
                    className="w-8 bg-emerald-400 rounded-t transition-all duration-300 hover:bg-emerald-500"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              
              {/* Chart Legend */}
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
            
            {/* Chart Labels */}
            <div className="flex items-center justify-between mt-4 px-8 text-sm text-slate-500">
              <span>Nov 1</span>
              <span>Nov 8</span>
              <span>Nov 15</span>
              <span>Nov 22</span>
              <span>Nov 29</span>
              <span>Dec 6</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
