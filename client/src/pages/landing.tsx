import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Edit, Download } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/register";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <span className="text-lg font-medium text-gray-900">Album</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Button onClick={handleLogin} size="sm">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-light text-gray-900 mb-6 leading-tight">
            Create Beautiful
            <br />
            Photo Albums
          </h1>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Professional album creation with intuitive drag-and-drop editing. 
            Perfect for photographers and creative professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={handleLogin}>
              Start Creating
            </Button>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Simple. Powerful. Professional.
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="h-5 w-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Upload</h3>
              <p className="text-gray-600 leading-relaxed">
                Drag and drop your photos with support for all major formats
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Edit className="h-5 w-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Edit</h3>
              <p className="text-gray-600 leading-relaxed">
                Professional layouts with intuitive photo organization
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="h-5 w-5 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Export</h3>
              <p className="text-gray-600 leading-relaxed">
                High-quality exports in multiple formats and resolutions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-gray-600">
              Start free and upgrade as you grow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* FREE Plan */}
            <Card className="border border-gray-200">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-medium">Free</CardTitle>
                <div className="text-2xl font-light text-gray-900 mt-2">$0</div>
                <p className="text-sm text-gray-600">per month</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                  1 Album
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                  72 DPI export
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                  1GB storage
                </div>
                <Button className="w-full mt-6" variant="outline" onClick={handleLogin}>
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* PRO Plan */}
            <Card className="border-2 border-gray-900 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Popular
                </div>
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-medium">Pro</CardTitle>
                <div className="text-2xl font-light text-gray-900 mt-2">$9</div>
                <p className="text-sm text-gray-600">per month</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mr-3"></div>
                  10 Albums
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mr-3"></div>
                  150 DPI export
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mr-3"></div>
                  10GB storage
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mr-3"></div>
                  No watermark
                </div>
                <Button className="w-full mt-6" onClick={handleLogin}>
                  Start Pro
                </Button>
              </CardContent>
            </Card>

            {/* PREMIUM Plan */}
            <Card className="border border-gray-200">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-medium">Premium</CardTitle>
                <div className="text-2xl font-light text-gray-900 mt-2">$19</div>
                <p className="text-sm text-gray-600">per month</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                  Unlimited Albums
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                  300 DPI export
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                  100GB storage
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                  Priority support
                </div>
                <Button className="w-full mt-6" variant="outline" onClick={handleLogin}>
                  Start Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-600">
            © 2024 Album. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
