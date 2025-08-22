// app/index.tsx
import "expo-router/entry";
import { useEffect, useRef } from "react";
import { View, Text, Image, Animated, Easing, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Type definitions for component props
interface NeuralNodeProps {
  index: number;
  size: number;
  left: number;
  top: number;
  color?: string;
}

interface NeuralConnectionProps {
  index: number;
  width: number;
  height: number;
  left: number;
  top: number;
  rotate: number;
  color?: string;
}

interface FloatingParticleProps {
  size: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  color?: string;
}

export default function Index() {
  const router = useRouter();
  
  // Animation values - properly set up with initial values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const glowIntensity = useRef(new Animated.Value(0)).current;
  const backgroundMove = useRef(new Animated.Value(0)).current;
  const rippleEffect = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  
  // Neural network connection animation
  const neuralNodes = useRef(Array(16).fill(0).map(() => new Animated.Value(0))).current;
  const neuralConnections = useRef(Array(12).fill(0).map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Start all animations
    Animated.parallel([
      // Background movement
      Animated.timing(backgroundMove, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      }),
      
      // Main animation sequence
      Animated.sequence([
        // Initial logo appearance with glow (0.8s)
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.back(1.4)),
            useNativeDriver: true,
          }),
          Animated.timing(glowIntensity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
        
        // Logo rotation and neural activation (0.6s)
        Animated.parallel([
          Animated.timing(logoRotate, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.stagger(40, neuralNodes.map(node => 
            Animated.timing(node, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            })
          )),
        ]),
        
        // Text reveal with connections (0.8s)
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(subtitleOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.stagger(60, neuralConnections.map(connection => 
            Animated.timing(connection, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            })
          )),
        ]),
        
        // Ripple effect and final touch (0.5s)
        Animated.parallel([
          Animated.timing(rippleEffect, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        
        // Final pause before navigation (2s)
        Animated.delay(2000),
      ]),
    ]).start(() => {
      // Navigate after the full animation completes
      router.replace("/landing-page");
    });
  }, []);

  // Neural network node component
  const NeuralNode = ({ index, size, left, top, color = '#8A5CFF' }: NeuralNodeProps) => {
    return (
      <Animated.View
        className="absolute"
        style={{
          left,
          top,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: neuralNodes[index],
          transform: [
            {
              scale: neuralNodes[index].interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1.3, 1]
              })
            }
          ],
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 4,
          elevation: 4,
        }}
      />
    );
  };

  // Neural connection component - FIXED
  const NeuralConnection = ({ index, width: connWidth, height: connHeight, left, top, rotate, color = '#8A5CFF' }: NeuralConnectionProps) => {
    return (
      <Animated.View
        className="absolute"
        style={{
          left,
          top,
          width: connWidth,
          height: connHeight,
          backgroundColor: color,
          opacity: neuralConnections[index],
          transform: [
            { rotate: `${rotate}deg` },
            {
              scaleX: neuralConnections[index] // Fixed: removed incorrect interpolate
            }
          ],
          borderRadius: 1,
        }}
      />
    );
  };

  // Floating particle component
  const FloatingParticle = ({ size, left, top, delay, duration, color = '#8A5CFF' }: FloatingParticleProps) => {
    const animValue = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, delay);
    }, []);

    return (
      <Animated.View
        className="absolute"
        style={{
          left,
          top,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 0.9]
          }),
          transform: [
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -25]
              })
            }
          ],
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 3,
          elevation: 3,
        }}
      />
    );
  };

  // Background gradient movement
  const animatedBackground = {
    transform: [
      {
        translateX: backgroundMove.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -width/3]
        })
      },
      {
        translateY: backgroundMove.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -height/4]
        })
      }
    ]
  };

  return (
    <View className="flex-1 bg-gray-950 overflow-hidden">
      {/* Animated background with deeper gradient */}
      <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
        <Animated.View className="w-[150%] h-[150%]" style={animatedBackground}>
          <LinearGradient
            colors={["#0F172A", "#1E293B", "#0F172A"]}
            className="w-full h-full"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      </View>

      {/* Multi-layered glow effects */}
      <Animated.View 
        className="absolute w-80 h-80 rounded-full bg-purple-500"
        style={{ 
          top: '50%',
          left: '50%',
          marginLeft: -160,
          marginTop: -160,
          opacity: glowIntensity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.4]
          }),
          transform: [
            {
              scale: glowIntensity.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1.8]
              })
            }
          ]
        }}
      />
      <Animated.View 
        className="absolute w-96 h-96 rounded-full bg-blue-500"
        style={{ 
          top: '50%',
          left: '50%',
          marginLeft: -192,
          marginTop: -192,
          opacity: glowIntensity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.2]
          }),
          transform: [
            {
              scale: glowIntensity.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 2.2]
              })
            }
          ]
        }}
      />

      {/* Enhanced neural network connections */}
      <NeuralConnection index={0} width={120} height={3} left={width/2 - 140} top={height/2 - 70} rotate={25} color="#6366F1" />
      <NeuralConnection index={1} width={100} height={3} left={width/2 + 50} top={height/2 - 50} rotate={-20} color="#8B5CF6" />
      <NeuralConnection index={2} width={140} height={3} left={width/2 - 70} top={height/2 + 90} rotate={15} color="#EC4899" />
      <NeuralConnection index={3} width={110} height={3} left={width/2 + 30} top={height/2 + 80} rotate={-10} color="#3B82F6" />

      {/* Enhanced neural network nodes with different colors */}
      <NeuralNode index={0} size={10} left={width/2 - 140} top={height/2 - 70} color="#6366F1" />
      <NeuralNode index={1} size={8} left={width/2 + 50} top={height/2 - 50} color="#8B5CF6" />
      <NeuralNode index={2} size={12} left={width/2 - 70} top={height/2 + 90} color="#EC4899" />
      <NeuralNode index={3} size={9} left={width/2 + 30} top={height/2 + 80} color="#3B82F6" />

      {/* More floating particles with varied colors */}
      <FloatingParticle size={5} left={width * 0.15} top={height * 0.25} delay={100} duration={1800} color="#8B5CF6" />
      <FloatingParticle size={7} left={width * 0.75} top={height * 0.35} delay={300} duration={2200} color="#EC4899" />
      <FloatingParticle size={4} left={width * 0.25} top={height * 0.75} delay={500} duration={1600} color="#3B82F6" />
      <FloatingParticle size={6} left={width * 0.85} top={height * 0.65} delay={200} duration={2000} color="#6366F1" />
      <FloatingParticle size={3} left={width * 0.4} top={height * 0.2} delay={400} duration={2400} color="#8B5CF6" />
      <FloatingParticle size={5} left={width * 0.6} top={height * 0.8} delay={600} duration={1900} color="#EC4899" />

      {/* Main content with enhanced blur effect */}
      <BlurView intensity={25} tint="dark" className="flex-1 justify-center items-center p-5">
        {/* Logo with advanced animation */}
        <Animated.View 
          className="items-center justify-center mb-6 z-10"
          style={{ 
            transform: [
              { 
                scale: logoScale
              },
              {
                rotate: logoRotate.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '720deg']
                })
              }
            ],
            shadowColor: '#8A5CFF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: glowIntensity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.8]
            }),
            shadowRadius: glowIntensity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 40]
            }),
          }}
        >
          <Image
            source={require("../assets/Speaksy.png")}
            className="w-44 h-44"
            resizeMode="contain"
          />
          
          {/* Multi-layered ripple effects */}
          <Animated.View 
            className="absolute w-56 h-56 rounded-full border-2 border-purple-500"
            style={{
              opacity: rippleEffect.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 0]
              }),
              transform: [
                {
                  scale: rippleEffect.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2]
                  })
                }
              ]
            }}
          />
          <Animated.View 
            className="absolute w-60 h-60 rounded-full border border-indigo-500"
            style={{
              opacity: rippleEffect.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 0]
              }),
              transform: [
                {
                  scale: rippleEffect.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2.3]
                  })
                }
              ]
            }}
          />
        </Animated.View>
        
        {/* Enhanced text animations */}
        <View className="w-full items-center">
          <Animated.View 
            className="z-10 mb-2"
            style={{ 
              opacity: textOpacity,
              transform: [
                {
                  translateY: textOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }
              ],
            }}
          >
            <Text className="text-white text-4xl font-black text-center tracking-tight">
              VOCLARIA <Text className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 to-blue-500 bg-clip-text">ANG</Text>
            </Text>
          </Animated.View>
        </View>

        <Animated.View 
          className="z-10 mb-6 items-center"
          style={{ 
            opacity: subtitleOpacity,
            transform: [
              {
                translateY: subtitleOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }
            ],
          }}
        >
          <Text className="text-purple-200 text-xl font-semibold tracking-wide text-center mb-1">
            AI-Powered Speaking & Reading Assistant
          </Text>
          <Text className="text-blue-200 text-sm font-medium tracking-wide text-center">
            Build Confidence • Reduce Anxiety • Master Communication
          </Text>
        </Animated.View>
        
        {/* Enhanced loading indicator */}
        <View className="flex-row justify-center mt-4">
          <Animated.View 
            className="flex-row"
            style={{
              opacity: subtitleOpacity,
              transform: [
                {
                  scale: subtitleOpacity.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.3, 1]
                  })
                }
              ],
            }}
          >
            <Animated.View 
              className="w-3 h-3 rounded-full mx-1 bg-purple-500"
              style={{
                opacity: subtitleOpacity.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1, 1]
                })
              }}
            />
            <Animated.View 
              className="w-3 h-3 rounded-full mx-1 bg-blue-500"
              style={{
                opacity: subtitleOpacity.interpolate({
                  inputRange: [0, 0.5, 0.75, 1],
                  outputRange: [0, 0, 1, 1]
                })
              }}
            />
            <Animated.View 
              className="w-3 h-3 rounded-full mx-1 bg-pink-500"
              style={{
                opacity: subtitleOpacity.interpolate({
                  inputRange: [0, 0.75, 1],
                  outputRange: [0, 0, 1]
                })
              }}
            />
          </Animated.View>
        </View>

        {/* Enhanced footer with more engaging text */}
        <Animated.View 
          className="absolute bottom-12 items-center"
          style={{ 
            opacity: subtitleOpacity,
          }}
        >
          <Text className="text-gray-400 text-sm font-medium mb-1">
            Powered by Advanced Neural Intelligence
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark" size={12} color="#10B981" />
            <Text className="text-emerald-500 text-xs font-medium ml-1">
              Student‑Focused Learning: Secure • Free • and Personalized
            </Text>
          </View>
        </Animated.View>
      </BlurView>
    </View>
  );
}