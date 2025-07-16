"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, BarChart3, Shield, Calendar, Zap, CheckCircle, Eye, Database } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b relative">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">GSend</span>
        </div>
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
          <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
          <a href="#compliance" className="text-gray-600 hover:text-gray-900">Compliance</a>
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md hover:from-emerald-600 hover:to-blue-600 transition-colors border-0">Get Started</Button>
          </Link>
        </nav>
        {/* Hamburger Icon for Mobile */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Open menu"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-40 flex justify-end md:hidden">
            <div ref={menuRef} className="w-64 bg-white h-full shadow-lg p-6 flex flex-col space-y-6 animate-slide-in-right">
              <button
                className="self-end mb-4 text-gray-500 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <a href="#features" className="text-gray-700 text-lg font-medium hover:text-emerald-600" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#pricing" className="text-gray-700 text-lg font-medium hover:text-emerald-600" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#compliance" className="text-gray-700 text-lg font-medium hover:text-emerald-600" onClick={() => setMobileMenuOpen(false)}>Compliance</a>
              <Link href="/dashboard" className="text-gray-700 text-lg font-medium hover:text-emerald-600" onClick={() => setMobileMenuOpen(false)}>
                Sign in
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md hover:from-emerald-600 hover:to-blue-600 transition-colors border-0">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16 text-center max-w-6xl mx-auto">
        <div className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm mb-8 font-semibold">
          <CheckCircle className="w-4 h-4 mr-2" />
          TCPA Compliant • Built for Scale • Trusted by 10,000+ Businesses
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
          SMS Marketing<br />
          <span className="text-emerald-gradient">You Can Trust.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto font-normal">
          Drive revenue with confidence using our compliant SMS platform.<br />
          Reach customers instantly with personalized messages that convert 6x<br />
          better than email.
        </p>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="text-center">
            <div className="text-4xl font-extrabold text-blue-600 mb-2">98.5%</div>
            <div className="text-gray-600 font-medium">Average delivery rate</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-blue-600 mb-2">45%</div>
            <div className="text-gray-600 font-medium">Higher open rates than email</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-blue-600 mb-2">6x</div>
            <div className="text-gray-600 font-medium">Better ROI than traditional marketing</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-blue-600 mb-2">90s</div>
            <div className="text-gray-600 font-medium">Average response time</div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/signup">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md hover:from-emerald-600 hover:to-blue-600 transition-colors border-0 rounded-lg px-6 py-3 font-semibold">
              Start Free Trial
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="flex items-center px-6 py-3 rounded-lg font-semibold">
            See Live Demo
            <Eye className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Dashboard Preview */}
        <div className="relative max-w-5xl mx-auto mb-16">
          {/* Corner Dots */}
          <div className="absolute top-6 left-6 w-6 h-6 bg-[#aaf0e6] rounded-full opacity-80"></div>
          <div className="absolute bottom-8 left-16 w-3 h-3 bg-[#aaf0e6] rounded-full opacity-60"></div>
          <div className="absolute top-10 right-12 w-4 h-4 bg-[#aee6fa] rounded-full opacity-60"></div>
          <div className="absolute bottom-8 right-8 w-6 h-6 bg-[#aee6fa] rounded-full opacity-80"></div>
          <div className="relative flex flex-col items-center justify-center rounded-[2.5rem] p-20 bg-gradient-to-br from-[#d2f6e7] via-[#eaf6f3] to-[#c6e6f5] shadow-lg">
            <div className="flex flex-col items-center mb-8">
              <div className="w-32 h-32 rounded-2xl flex items-center justify-center shadow-2xl" style={{ transform: 'rotate(-15deg)', background: 'linear-gradient(135deg, #2ecba4 0%, #3b82f6 100%)', boxShadow: '0 12px 40px 0 rgba(46,203,164,0.18), 0 2px 12px 0 rgba(59,130,246,0.12)' }}>
                <MessageSquare className="w-16 h-16 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">SMS Campaign Dashboard</h3>
            <p className="text-gray-500 text-lg text-center">Send, track, and optimize with confidence</p>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-8">
            INTEGRATES WITH YOUR FAVORITE TOOLS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 opacity-60">
            <div className="text-center">
              <div className="text-gray-400 font-medium">Shopify Plus</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-medium">BigCommerce</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-medium">WooCommerce</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-medium">Magento</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-medium">Klaviyo</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-medium">Mailchimp</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-medium">HubSpot</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-medium">Salesforce</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-medium">Zendesk</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 font-medium">Intercom</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need for SMS success
            </h2>
            <p className="text-xl text-gray-600">
              From compliance to conversion, we've built the tools you need to grow<br />
              your business through SMS
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-2xl shadow-md p-8 text-left transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200 group-hover:from-emerald-500 group-hover:to-emerald-700">
                <Users className="w-6 h-6 text-white transition-colors duration-200" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Contact Management</h3>
              <p className="text-gray-600 text-sm">
                Upload CSV files, create segments, and manage opt-ins with intelligent automation.
              </p>
            </div>

            <div className="group bg-white rounded-2xl shadow-md p-8 text-left transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200 group-hover:from-blue-500 group-hover:to-blue-700">
                <MessageSquare className="w-6 h-6 text-white transition-colors duration-200" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized SMS Campaigns</h3>
              <p className="text-gray-600 text-sm">
                Send targeted messages with merge tags and dynamic content that converts
              </p>
            </div>

            <div className="group bg-white rounded-2xl shadow-md p-8 text-left transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200 group-hover:from-emerald-500 group-hover:to-emerald-700">
                <Calendar className="w-6 h-6 text-white transition-colors duration-200" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
              <p className="text-gray-600 text-sm">
                Time-zone aware delivery with optimal send time recommendations
              </p>
            </div>

            <div className="group bg-white rounded-2xl shadow-md p-8 text-left transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200 group-hover:from-blue-500 group-hover:to-blue-700">
                <BarChart3 className="w-6 h-6 text-white transition-colors duration-200" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Analytics</h3>
              <p className="text-gray-600 text-sm">
                Track delivery rates, clicks, and ROI with actionable insights
              </p>
            </div>

            <div className="group bg-white rounded-2xl shadow-md p-8 text-left transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200 group-hover:from-emerald-500 group-hover:to-emerald-700">
                <Shield className="w-6 h-6 text-white transition-colors duration-200" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">TCPA Compliance Built-in</h3>
              <p className="text-gray-600 text-sm">
                Automated consent management and opt-out handling for peace of mind
              </p>
            </div>

            <div className="group bg-white rounded-2xl shadow-md p-8 text-left transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200 group-hover:from-blue-500 group-hover:to-blue-700">
                <Zap className="w-6 h-6 text-white transition-colors duration-200" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Shopify Integration</h3>
              <p className="text-gray-600 text-sm">
                Seamlessly sync customers and trigger automated SMS workflows
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section id="compliance" className="px-6 py-16 bg-[#eaf6f3]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for compliance, designed for growth
            </h2>
            <p className="text-xl text-gray-600">
              Sleep soundly knowing your SMS campaigns are fully compliant with<br />
              TCPA, CAN-SPAM, and GDPR regulations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-2xl shadow-md transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200 group-hover:from-emerald-500 group-hover:to-emerald-700">
                <Shield className="w-6 h-6 text-white transition-colors duration-200" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">TCPA Compliant</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Automatic consent tracking
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Double opt-in workflows
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  STOP keyword handling
                </li>
              </ul>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-md transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200 group-hover:from-blue-500 group-hover:to-blue-700">
                <Database className="w-6 h-6 text-white transition-colors duration-200" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Protection</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  GDPR compliant data handling
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Encrypted data storage
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Right to be forgotten
                </li>
              </ul>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-md transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200 group-hover:from-emerald-500 group-hover:to-emerald-700">
                <BarChart3 className="w-6 h-6 text-white transition-colors duration-200" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Audit Ready</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Complete audit trails
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Compliance reporting
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Legal documentation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 bg-gradient-to-r from-emerald-800 via-emerald-700 to-blue-900 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Ready to grow with SMS?</h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Join thousands of businesses driving revenue through compliant,<br />
            effective SMS marketing
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-emerald-900 font-semibold px-6 py-3 border border-white shadow-none hover:bg-gray-100 transition-colors text-base">
                Start Free Trial
              </Button>
            </Link>
            <Button size="lg" className="bg-transparent text-white border border-white font-semibold px-6 py-3 shadow-none hover:bg-white/20 hover:text-black transition-colors text-base">
              Talk to Sales
            </Button>
          </div>
          <p className="text-xs md:text-sm opacity-80 mt-2">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">GSend</span>
          </div>
          <p className="text-sm text-gray-500">© 2025 GSend. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}