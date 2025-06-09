import Link from 'next/link';
import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { Badge } from '@repo/ui/components/base/badge';
import { Users, Zap, Target, Clock, ArrowRight, Star } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 bg-indigo-100 text-indigo-800">
              ✨ Agile Planning Made Fun
            </Badge>
            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                AgileHub
              </span>
        </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your sprint planning with our interactive planning poker tool. 
              Make estimation engaging, collaborative, and surprisingly enjoyable for your entire agile team.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-4">
                <Link href="/register" className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                <Link href="/login" className="flex items-center gap-2">
                  Sign In
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>Free to use</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Team collaboration</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Real-time voting</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Teams Love Fun Scrum
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to run smooth, engaging sprint planning sessions
          </p>
        </div>

                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
           <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/70 backdrop-blur p-6">
             <CardHeader className="pb-4">
               <div className="flex items-center gap-4 mb-3">
                 <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                   <Users className="h-6 w-6 text-indigo-600" />
                 </div>
                 <CardTitle className="text-xl">Team Collaboration</CardTitle>
               </div>
             </CardHeader>
             <CardContent className="pt-0">
               <CardDescription className="text-base">
                 Bring your entire team together for synchronized planning sessions. 
                 Everyone votes simultaneously for true consensus building.
               </CardDescription>
             </CardContent>
           </Card>

           <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/70 backdrop-blur p-6">
             <CardHeader className="pb-4">
               <div className="flex items-center gap-4 mb-3">
                 <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                   <Zap className="h-6 w-6 text-green-600" />
                 </div>
                 <CardTitle className="text-xl">Real-time Voting</CardTitle>
               </div>
             </CardHeader>
             <CardContent className="pt-0">
               <CardDescription className="text-base">
                 Watch votes appear instantly as team members make their estimates. 
                 No more waiting around or awkward delays.
               </CardDescription>
             </CardContent>
           </Card>

           <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/70 backdrop-blur p-6">
             <CardHeader className="pb-4">
               <div className="flex items-center gap-4 mb-3">
                 <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                   <Target className="h-6 w-6 text-purple-600" />
                 </div>
                 <CardTitle className="text-xl">Smart Estimation</CardTitle>
               </div>
             </CardHeader>
             <CardContent className="pt-0">
               <CardDescription className="text-base">
                 Use Fibonacci sequence, T-shirt sizes, or custom scales. 
                 Flexible options for every team's preferred estimation method.
               </CardDescription>
             </CardContent>
           </Card>

           <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/70 backdrop-blur p-6">
             <CardHeader className="pb-4">
               <div className="flex items-center gap-4 mb-3">
                 <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                   <Clock className="h-6 w-6 text-orange-600" />
                 </div>
                 <CardTitle className="text-xl">Quick Sessions</CardTitle>
               </div>
             </CardHeader>
             <CardContent className="pt-0">
               <CardDescription className="text-base">
                 Start planning in seconds. No complex setup or lengthy onboarding. 
                 Just create a room and invite your team.
               </CardDescription>
             </CardContent>
           </Card>

           <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/70 backdrop-blur p-6">
             <CardHeader className="pb-4">
               <div className="flex items-center gap-4 mb-3">
                 <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                   <Star className="h-6 w-6 text-blue-600" />
                 </div>
                 <CardTitle className="text-xl">Story Management</CardTitle>
               </div>
             </CardHeader>
             <CardContent className="pt-0">
               <CardDescription className="text-base">
                 Add, edit, and organize user stories during your session. 
                 Keep everything in one place for maximum efficiency.
               </CardDescription>
             </CardContent>
           </Card>

           <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/70 backdrop-blur p-6">
             <CardHeader className="pb-4">
               <div className="flex items-center gap-4 mb-3">
                 <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                   <Users className="h-6 w-6 text-pink-600" />
                 </div>
                 <CardTitle className="text-xl">Role-based Access</CardTitle>
               </div>
             </CardHeader>
             <CardContent className="pt-0">
               <CardDescription className="text-base">
                 Scrum masters get additional controls while team members focus on voting. 
                 Perfect permissions for every role.
               </CardDescription>
             </CardContent>
           </Card>
         </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Sprint Planning?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join teams who've made estimation fun and efficient with Fun Scrum
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              <Link href="/register" className="flex items-center gap-2">
                Start Planning Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 bg-transparent border-white text-white hover:bg-white hover:text-indigo-600">
              <Link href="/planning" className="flex items-center gap-2">
                Try Demo Session
          </Link>
            </Button>
          </div>

          <div className="border-t border-indigo-400 pt-8">
            <p className="text-indigo-200 text-sm">
              Need admin access?{' '}
              <Link href="http://localhost:3001/admin" className="text-white hover:underline font-medium">
                Visit Admin Portal
          </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 Fun Scrum. Making agile planning enjoyable, one sprint at a time.
          </p>
        </div>
      </footer>
    </main>
  )
} 