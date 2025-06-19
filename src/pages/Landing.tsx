import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Award, Star, ArrowRight, Play } from 'lucide-react';

const Landing: React.FC = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Comprehensive Courses',
      description: 'Access a wide range of courses designed by industry experts to help you master new skills.'
    },
    {
      icon: Users,
      title: 'Expert Instructors',
      description: 'Learn from experienced professionals who bring real-world knowledge to every lesson.'
    },
    {
      icon: Award,
      title: 'Certificates',
      description: 'Earn recognized certificates upon course completion to showcase your achievements.'
    },
    {
      icon: Star,
      title: 'Quality Content',
      description: 'High-quality video content, interactive exercises, and comprehensive course materials.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Developer',
      content: 'The courses here transformed my career. The instructors are amazing and the content is top-notch.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Product Manager',
      content: 'I love the flexibility and quality of the courses. Perfect for busy professionals like me.',
      rating: 5
    },
    {
      name: 'Emily Davis',
      role: 'Designer',
      content: 'The practical approach and real-world projects helped me land my dream job.',
      rating: 5
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Students' },
    { number: '500+', label: 'Courses' },
    { number: '50+', label: 'Instructors' },
    { number: '95%', label: 'Success Rate' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-primary-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">EduSaaS</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Learn Skills That
                <span className="text-primary-600"> Matter</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of learners who are advancing their careers with our expert-led courses. 
                Start your journey today and unlock your potential.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  Start Learning Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="aspect-video bg-gray-100 rounded-lg mb-6 flex items-center justify-center">
                  <Play className="w-16 h-16 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Featured Course: Web Development Masterclass
                </h3>
                <p className="text-gray-600 mb-4">
                  Learn modern web development from scratch with hands-on projects.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">(4.9)</span>
                  </div>
                  <span className="text-2xl font-bold text-primary-600">$99</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose EduSaaS?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide everything you need to succeed in your learning journey with cutting-edge technology and expert guidance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-primary-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Students Say
            </h2>
            <p className="text-xl text-gray-600">
              Don't just take our word for it - hear from our successful students.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already advancing their careers with our courses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/courses"
              className="border border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <BookOpen className="w-8 h-8 text-primary-400 mr-2" />
                <span className="text-2xl font-bold">EduSaaS</span>
              </div>
              <p className="text-gray-400">
                Empowering learners worldwide with quality education and expert instruction.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/courses" className="hover:text-white">Courses</Link></li>
                <li><Link to="/instructors" className="hover:text-white">Instructors</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link to="/about" className="hover:text-white">About</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/community" className="hover:text-white">Community</Link></li>
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 EduSaaS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;