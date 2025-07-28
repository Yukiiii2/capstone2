import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';

// Type Definitions
type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
};

type TestimonialCardProps = {
  name: string;
  role: string;
  content: string;
  rating: number;
};

type PricingCardProps = {
  title: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
};

// Reusable Components
const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <View className="bg-white/5 rounded-2xl p-6">
    <View className="w-12 h-12 bg-purple-500/20 rounded-xl items-center justify-center mb-4">
      <Ionicons name={icon as any} size={24} color="#a855f7" />
    </View>
    <Text className="text-white text-lg font-semibold mb-2">{title}</Text>
    <Text className="text-gray-400 text-sm">{description}</Text>
  </View>
);

const TestimonialCard = ({ name, role, content, rating }: TestimonialCardProps) => (
  <View className="bg-white/5 rounded-2xl p-6">
    <View className="flex-row items-center mb-4">
      <View className="w-12 h-12 bg-purple-500/20 rounded-full items-center justify-center mr-4">
        <Text className="text-white font-bold">{name.charAt(0)}</Text>
      </View>
      <View>
        <Text className="text-white font-semibold">{name}</Text>
        <Text className="text-gray-400 text-sm">{role}</Text>
      </View>
    </View>
    <Text className="text-gray-300 italic mb-4">"{content}"</Text>
    <View className="flex-row">
      {[...Array(5)].map((_, i) => (
        <Ionicons 
          key={i}
          name={i < rating ? 'star' : 'star-outline'}
          size={16}
          color="#fbbf24"
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  </View>
);

const PricingCard = ({ 
  title, 
  price, 
  period,
  features, 
  isPopular = false, 
  buttonText 
}: PricingCardProps) => (
  <View className={`bg-white/5 rounded-2xl p-6 relative ${isPopular ? 'border-2 border-purple-500' : ''}`}>
    {isPopular && (
      <View className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 px-4 py-1 rounded-full">
        <Text className="text-white text-xs font-medium">MOST POPULAR</Text>
      </View>
    )}
    <Text className="text-white text-xl font-bold mb-1">{title}</Text>
    <Text className="text-3xl font-bold text-white mb-1">
      {price}
      <Text className="text-base font-normal text-gray-400">/{period}</Text>
    </Text>
    <View className="space-y-3 my-6">
      {features.map((feature, index) => (
        <View key={index} className="flex-row items-start">
          <Ionicons name="checkmark-circle" size={20} color="#a855f7" style={{ marginTop: 2, marginRight: 8 }} />
          <Text className="text-gray-300 flex-1">{feature}</Text>
        </View>
      ))}
    </View>
    <TouchableOpacity 
      className={`py-3 px-6 rounded-lg ${isPopular ? 'bg-purple-500' : 'bg-white/10'} items-center`}
    >
      <Text className="font-medium text-white">{buttonText}</Text>
    </TouchableOpacity>
  </View>
);

export default function Landing() {
  // Data
  const features: FeatureCardProps[] = [
    {
      icon: 'book-outline',
      title: 'Reading Comprehension',
      description: 'Enhance your ability to understand and analyze complex texts.'
    },
    {
      icon: 'headset-outline',
      title: 'Listening Practice',
      description: 'Improve your listening skills with authentic audio materials.'
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Speaking Exercises',
      description: 'Practice speaking with AI-powered feedback and pronunciation analysis.'
    },
    {
      icon: 'create-outline',
      title: 'Writing Feedback',
      description: 'Get detailed feedback on your writing from language experts.'
    },
    {
      icon: 'globe-outline',
      title: 'Vocabulary Builder',
      description: 'Expand your vocabulary with smart flashcards and spaced repetition.'
    },
    {
      icon: 'stats-chart-outline',
      title: 'Progress Tracking',
      description: 'Monitor your improvement with detailed analytics and insights.'
    }
  ];

  const testimonials: TestimonialCardProps[] = [
    {
      name: 'Alex Johnson',
      role: 'Student',
      content: 'Fluentech has completely transformed my English learning journey. The interactive exercises and personalized feedback helped me become more confident in my speaking and writing.',
      rating: 5
    },
    {
      name: 'Maria Garcia',
      role: 'Professional',
      content: 'As a non-native speaker, I struggled with business English. Fluentech\'s targeted lessons and real-world scenarios were exactly what I needed to advance my career.',
      rating: 5
    }
  ];

  const pricingPlans: PricingCardProps[] = [
    {
      title: 'Free',
      price: '$0',
      period: 'month',
      features: [
        'Basic vocabulary exercises',
        'Limited grammar lessons',
        'Community support',
        'Basic progress tracking'
      ],
      buttonText: 'Get Started',
      isPopular: false
    },
    {
      title: 'Premium',
      price: '$19',
      period: 'month',
      features: [
        'Unlimited vocabulary exercises',
        'All grammar lessons',
        'AI-powered speaking practice',
        'Writing feedback from experts',
        'Advanced progress analytics',
        'Priority support'
      ],
      buttonText: 'Start Free Trial',
      isPopular: true
    }
  ];

  return (
    <View className="flex-1 bg-gray-900">
      {/* Gradient Background */}
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0F172A']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      
      {/* Decorative Circles */}
      <View className="absolute w-40 h-40 bg-purple-500/10 rounded-full -top-20 -left-20" />
      <View className="absolute w-24 h-24 bg-blue-500/10 rounded-full top-1/4 -right-12" />
      
      <ScrollView className="flex-1">
        <View className="px-6 py-8 max-w-md mx-auto w-full">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-12">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-purple-500/20 rounded-lg items-center justify-center mr-2">
                <Ionicons name="language" size={16} color="#a855f7" />
              </View>
              <Text className="text-white text-xl font-bold">Fluentech</Text>
            </View>
            <View className="flex-row space-x-3">
              <Link href="/login" asChild>
                <TouchableOpacity className="px-4 py-2">
                  <Text className="text-white">Log in</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/signup" asChild>
                <TouchableOpacity className="bg-purple-500 px-4 py-2 rounded-lg">
                  <Text className="text-white font-medium">Sign up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Hero Section */}
          <View className="mb-16">
            <Text className="text-3xl font-bold text-white mb-4">
              Master English with{' '}
              <Text className="text-purple-400">Interactive Learning</Text>
            </Text>
            <Text className="text-gray-400 text-lg mb-8">
              Join thousands of learners worldwide and achieve fluency with our AI-powered language platform.
            </Text>
            
            <View className="flex-row space-x-4 mb-8">
              <Link href="/signup" asChild>
                <TouchableOpacity className="bg-purple-500 px-6 py-3 rounded-lg flex-1 items-center">
                  <Text className="text-white font-medium">Start Learning Free</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/demo" asChild>
                <TouchableOpacity className="bg-white/10 px-6 py-3 rounded-lg flex-1 items-center">
                  <Text className="text-white font-medium">Watch Demo</Text>
                </TouchableOpacity>
              </Link>
            </View>
            
            <View className="flex-row items-center">
              <View className="flex-row -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <View 
                    key={i}
                    className="w-8 h-8 rounded-full bg-purple-500 border-2 border-gray-900"
                    style={{ zIndex: 5 - i }}
                  />
                ))}
              </View>
              <Text className="text-gray-400 text-sm ml-3">
                <Text className="text-white font-medium">10,000+</Text> active learners
              </Text>
            </View>
          </View>

          {/* Dashboard Preview */}
          <View className="bg-white/5 rounded-2xl p-4 mb-16">
            <View className="h-48 bg-gray-800/50 rounded-lg mb-4 items-center justify-center">
              <Ionicons name="phone-portrait-outline" size={48} color="#6b7280" />
              <Text className="text-gray-500 mt-2">Dashboard Preview</Text>
            </View>
          </View>

          {/* Features Section */}
          <View className="mb-16">
            <Text className="text-2xl font-bold text-white mb-2">Everything You Need to Excel</Text>
            <Text className="text-gray-400 mb-8">Our comprehensive platform helps you master English through various interactive methods.</Text>
            
            <View className="space-y-4">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </View>
          </View>

          {/* Testimonials */}
          <View className="mb-16">
            <Text className="text-2xl font-bold text-white mb-2">What Our Learners Say</Text>
            <Text className="text-gray-400 mb-8">Join thousands of satisfied users who have improved their English with Fluentech.</Text>
            
            <View className="space-y-4">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </View>
          </View>

          {/* Pricing */}
          <View className="mb-16">
            <Text className="text-2xl font-bold text-white mb-2">Simple, Transparent Pricing</Text>
            <Text className="text-gray-400 mb-8">Choose the plan that fits your learning goals and budget.</Text>
            
            <View className="space-y-6">
              {pricingPlans.map((plan, index) => (
                <PricingCard key={index} {...plan} />
              ))}
            </View>
          </View>

          {/* CTA Section */}
          <View className="bg-white/5 rounded-2xl p-6 mb-8">
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-purple-500/20 rounded-2xl items-center justify-center mb-4">
                <Ionicons name="rocket-outline" size={32} color="#a855f7" />
              </View>
              <Text className="text-white text-xl font-bold mb-2">Ready to get started?</Text>
              <Text className="text-gray-400 text-center mb-6">Join Fluentech today and start your journey to English fluency.</Text>
              <Link href="/signup" asChild>
                <TouchableOpacity className="bg-purple-500 px-8 py-3 rounded-lg">
                  <Text className="text-white font-medium">Start Learning Now</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Footer */}
          <View className="pt-8 border-t border-white/10">
            <View className="flex-row justify-between items-center mb-8">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-purple-500/20 rounded-lg items-center justify-center mr-2">
                  <Ionicons name="language" size={16} color="#a855f7" />
                </View>
                <Text className="text-white font-bold">Fluentech</Text>
              </View>
              <View className="flex-row space-x-4">
                <TouchableOpacity>
                  <Ionicons name="logo-twitter" size={20} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="logo-facebook" size={20} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="logo-instagram" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View className="flex-row flex-wrap justify-between mb-8">
              <View className="w-1/2 mb-6">
                <Text className="text-white font-medium mb-3">Product</Text>
                <View className="space-y-2">
                  <Text className="text-gray-400">Features</Text>
                  <Text className="text-gray-400">Pricing</Text>
                  <Text className="text-gray-400">Testimonials</Text>
                </View>
              </View>
              <View className="w-1/2 mb-6">
                <Text className="text-white font-medium mb-3">Company</Text>
                <View className="space-y-2">
                  <Text className="text-gray-400">About Us</Text>
                  <Text className="text-gray-400">Careers</Text>
                  <Text className="text-gray-400">Contact</Text>
                </View>
              </View>
              <View className="w-1/2">
                <Text className="text-white font-medium mb-3">Resources</Text>
                <View className="space-y-2">
                  <Text className="text-gray-400">Blog</Text>
                  <Text className="text-gray-400">Help Center</Text>
                  <Text className="text-gray-400">Tutorials</Text>
                </View>
              </View>
              <View className="w-1/2">
                <Text className="text-white font-medium mb-3">Legal</Text>
                <View className="space-y-2">
                  <Text className="text-gray-400">Privacy Policy</Text>
                  <Text className="text-gray-400">Terms of Service</Text>
                  <Text className="text-gray-400">Cookie Policy</Text>
                </View>
              </View>
            </View>
            
            <View className="pt-6 border-t border-white/10">
              <Text className="text-gray-500 text-sm text-center">
                © {new Date().getFullYear()} Fluentech. All rights reserved.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
