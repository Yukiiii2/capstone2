// app/index.tsx
import "expo-router/entry";
import { useEffect, useRef, useState } from "react";
import { View, Text, Image, Animated, Easing, Dimensions, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Colors } from "react-native/Libraries/NewAppScreen";

const { width, height } = Dimensions.get('window');

// Type definitions for component props
interface FloatingElementProps {
  size: number;
  startX: number;
  startY: number;
  delay: number;
  duration: number;
  color?: string;
}

interface HexagonGridProps {
  rows: number;
  cols: number;
  size: number;
}

interface AnimatedWordProps {
  text: string;
  delay: number;
  style?: any;
}

export default function Index() {
  const router = useRouter();
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const backgroundZoom = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const neuralPulse = useRef(new Animated.Value(0)).current;
  const hexagonReveal = useRef(new Animated.Value(0)).current;
  const floatingOrbs = useRef(Array(8).fill(0).map(() => new Animated.Value(0))).current;
  const auraEffect = useRef(new Animated.Value(0)).current;
  const logoShine = useRef(new Animated.Value(0)).current;
  const hologramEffect = useRef(new Animated.Value(0)).current;
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    // Start all animations
    Animated.sequence([
      // Initial zoom in with fade and aura (0.8s)
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1.3,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundZoom, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(hexagonReveal, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(auraEffect, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
      
      // Logo shine effect and hologram (0.6s)
      Animated.parallel([
        Animated.timing(logoShine, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(hologramEffect, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      
      // Slight zoom out and particle burst (0.5s)
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.stagger(80, floatingOrbs.map(orb => 
          Animated.timing(orb, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        )),
      ]),
      
      // Logo rotation and floating (0.6s)
      Animated.parallel([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(neuralPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
      
      // Text reveal (0.7s)
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // Subtitles and footer (0.6s)
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // Final pause before navigation (3s total display time)
      Animated.delay(2000),
    ]).start(() => {
      // Navigate after the full animation completes
  router.replace("/Auth/Login/landing-page");
    });
  }, []);

  // Particle burst component
  const ParticleBurst = () => {
    const particles = useRef(
      Array(24).fill(0).map(() => ({
        angle: Math.random() * Math.PI * 2,
        distance: 70 + Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 500 + Math.random() * 300,
        delay: Math.random() * 200,
        color: `rgba(255, 255, 255, ${0.4 + Math.random() * 0.4})`,
      }))
    ).current;

    return (
      <>
        {particles.map((particle, i) => {
          const translateX = particleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.cos(particle.angle) * particle.distance]
          });
          
          const translateY = particleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.sin(particle.angle) * particle.distance]
          });
          
          const opacity = particleAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.9, 0]
          });
          
          const scale = particleAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 1.3, 0.6]
          });
          
          const rotate = particleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${Math.random() * 360}deg`]
          });
          
          return (
            <Animated.View
              key={i}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                left: width/2 - particle.size/2,
                top: height/2 - particle.size/2,
                backgroundColor: particle.color,
                opacity,
                transform: [{ translateX }, { translateY }, { scale }, { rotate }],
              }}
            />
          );
        })}
      </>
    );
  };

  // Neural pulse effect
  const NeuralPulseEffect = ({ size, delay, color = '#8B5CF6' }: { size: number; delay: number; color?: string }) => {
    const pulseScale = useRef(new Animated.Value(0)).current;
    const pulseOpacity = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(pulseOpacity, {
              toValue: 0.6,
              duration: 750,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0,
              duration: 750,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }, delay);
    }, []);

    return (
      <Animated.View
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          left: width/2 - size/2,
          top: height/2 - size/2,
          backgroundColor: color,
          opacity: pulseOpacity,
          transform: [{ scale: pulseScale }],
        }}
      />
    );
  };

  // Floating orb component
  const FloatingOrb = ({ index, size, startX, startY, color = 'rgba(255, 255, 255, 0.5)' }: { index: number; size: number; startX: number; startY: number; color?: string }) => {
    const orbitAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      setTimeout(() => {
        // Orbital animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(orbitAnim, {
              toValue: 1,
              duration: 4000 + Math.random() * 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(orbitAnim, {
              toValue: 0,
              duration: 4000 + Math.random() * 3000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
        
        // Pulsing animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1500 + Math.random() * 1000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0,
              duration: 1500 + Math.random() * 1000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, index * 300);
    }, []);

    const orbitX = orbitAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, Math.cos(index * 0.8) * 40]
    });
    
    const orbitY = orbitAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, Math.sin(index * 0.8) * 40]
    });
    
    const opacity = floatingOrbs[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.8]
    });
    
    const scale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1.2]
    });

    return (
      <Animated.View
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          left: startX,
          top: startY,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          opacity,
          transform: [{ translateX: orbitX }, { translateY: orbitY }, { scale }],
          shadowColor: 'rgba(255, 255, 255, 0.5)',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        }}
      />
    );
  };

  // Hexagon grid background - Dark version
  const HexagonGrid = ({ rows, cols, size }: HexagonGridProps) => {
    const hexagons = [];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * size * 1.75;
        const y = row * size * 1.5 + (col % 2) * size * 0.75;
        
        if (x < width + size && y < height + size) {
          const colorIndex = (row + col) % 3;
          const colors = ['#334155', '#475569', '#1E293B'];
          
          hexagons.push(
            <Animated.View
              key={`${row}-${col}`}
              className="absolute"
              style={{
                width: size * 2,
                height: size * 2,
                left: x,
                top: y,
                opacity: hexagonReveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.15]
                }),
                backgroundColor: colors[colorIndex],
                transform: [
                  { rotate: '30deg' },
                  {
                    scale: hexagonReveal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1]
                    })
                  }
                ]
              }}
            />
          );
        }
      }
    }
    
    return <>{hexagons}</>;
  };

  // Animated word component for text effects - Fixed textShadowRadius issue
  const AnimatedWord = ({ text, delay, style }: AnimatedWordProps) => {
    const charAnimations = useRef(
      text.split('').map(() => new Animated.Value(0))
    ).current;
    
    useEffect(() => {
      setTimeout(() => {
        Animated.stagger(40, charAnimations.map((charAnim, i) => 
          Animated.sequence([
            Animated.delay(i * 20),
            Animated.timing(charAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        )).start();
      }, delay);
    }, []);

    return (
      <View className="flex-row justify-center">
        {text.split('').map((char, i) => (
          <Animated.View
            key={i}
            style={{
              opacity: charAnimations[i],
              transform: [
                {
                  translateY: charAnimations[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                },
                {
                  scale: charAnimations[i].interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1.2, 1]
                  })
                }
              ],
            }}
          >
            <Text
              className="text-white"
              style={[
                style,
                {
                  textShadowColor: 'rgba(139, 92, 246, 0.7)',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 10,
                }
              ]}
            >
              {char}
            </Text>
          </Animated.View>
        ))}
      </View>
    );
  };

  // Logo Aura Effect
  const LogoAura = () => {
    return (
      <Animated.View
        className="absolute rounded-full"
        style={{
          width: 250,
          height: 250,
          left: width/2 - 125,
          top: height/2 - 125,
          opacity: auraEffect.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.4]
          }),
          transform: [
            {
              scale: auraEffect.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1.5]
              })
            }
          ],
          backgroundColor: '#8B5CF6',
        }}
      />
    );
  };

  // Logo Shine Effect
  const LogoShine = () => {
    const rotateAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }, []);

    return (
      <Animated.View
        className="absolute"
        style={{
          width: 200,
          height: 200,
          left: width/2 - 100,
          top: height/2 - 100,
          opacity: logoShine.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.7, 0]
          }),
          transform: [
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              })
            }
          ],
        }}
      >
        <Svg width="200" height="200" viewBox="0 0 200 200">
          <Circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="10"
            strokeDasharray="283 100"
          />
          <Defs>
            <SvgLinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#8B5CF6" />
              <Stop offset="50%" stopColor="#3B82F6" />
              <Stop offset="100%" stopColor="#0EA5E9" />
            </SvgLinearGradient>
          </Defs>
        </Svg>
      </Animated.View>
    );
  };

  // Hologram Effect for Logo
  const HologramEffect = () => {
    return (
      <Animated.View
        className="absolute"
        style={{
          width: 180,
          height: 180,
          left: width/2 - 90,
          top: height/2 - 90,
          opacity: hologramEffect.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.3, 0]
          }),
          transform: [
            {
              scale: hologramEffect.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.1, 1.2]
              })
            }
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderRadius: 40,
        }}
      />
    );
  };

  // Background gradient animation
  const animatedBackground = {
    transform: [
      {
        scale: backgroundZoom.interpolate({
          inputRange: [0, 1],
          outputRange: [1.3, 1]
        })
      }
    ]
  };

  return (
    <View className="flex-1 bg-gray-950 overflow-hidden justify-center items-center">
      {/* Animated background */}
      <Animated.View 
        className="absolute w-full h-full"
        style={animatedBackground}
      >
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A", "#1E293B"]}
          className="w-full h-full"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Hexagon grid - Dark version */}
        <HexagonGrid rows={12} cols={12} size={40} />
        
        {/* Subtle moving particles in background - Dark version */}
        <View className="absolute w-full h-full">
          {Array.from({ length: 60 }).map((_, i) => (
            <Animated.View
              key={i}
              className="absolute rounded-full"
              style={{
                width: 1 + Math.random() * 4,
                height: 1 + Math.random() * 4,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: '#3B82F6',
                opacity: Math.random() * 0.1 + 0.03,
                transform: [
                  {
                    translateX: backgroundZoom.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.random() * 30 - 15]
                    })
                  },
                  {
                    translateY: backgroundZoom.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.random() * 30 - 15]
                    })
                  }
                ]
              }}
            />
          ))}
        </View>
      </Animated.View>

      {/* Neural pulse effects */}
      <NeuralPulseEffect size={220} delay={100} color="#8B5CF6" />
      <NeuralPulseEffect size={320} delay={300} color="#3B82F6" />
      <NeuralPulseEffect size={420} delay={500} color="#0EA5E9" />
      <NeuralPulseEffect size={520} delay={700} color="#10B981" />

      {/* Logo effects */}
      <LogoAura />
      <LogoShine />
      <HologramEffect />

      {/* Floating orbs */}
      <FloatingOrb index={0} size={20} startX={width * 0.2} startY={height * 0.3} />
      <FloatingOrb index={1} size={16} startX={width * 0.8} startY={height * 0.4} />
      <FloatingOrb index={2} size={22} startX={width * 0.3} startY={height * 0.7} />
      <FloatingOrb index={3} size={18} startX={width * 0.7} startY={height * 0.2} />
      <FloatingOrb index={4} size={20} startX={width * 0.6} startY={height * 0.6} />
      <FloatingOrb index={5} size={14} startX={width * 0.15} startY={height * 0.5} />
      <FloatingOrb index={6} size={18} startX={width * 0.85} startY={height * 0.7} />
      <FloatingOrb index={7} size={16} startX={width * 0.4} startY={height * 0.2} />

      {/* Particle burst */}
      <ParticleBurst />

      {/* Main content - Removed BlurView for better performance */}
      <View className="flex-1 justify-center items-center p-5 w-full">
        {/* Logo with advanced animation */}
        <Animated.View 
          className="items-center justify-center mb-8 z-10"
          style={{ 
            opacity: logoOpacity,
            transform: [
              { scale: logoScale },
              {
                rotate: logoRotate.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              },
              {
                translateY: logoTranslateY.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -15]
                })
              }
            ],
            shadowColor: '#8A5CFF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 25,
          }}
        >
          
          {/* Logo */}
          <Image
            source={require("../assets/Speaksy.png")}
            className="w-40 h-40 z-10"
            resizeMode="contain"
            style={{
              top: 20,
              shadowColor: '#fff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
            }}
          />
        </Animated.View>
        
        {/* Main title with character animation */}
        <Animated.View 
          className="z-10 mb-6"
          style={{ 
            opacity: textOpacity,
          }}
        >
          <AnimatedWord 
            text="VOCLARIA" 
            delay={2000}
            style={{ fontSize: 50, fontWeight: '900', textAlign: 'center', marginBottom: 4, bottom: 40 }}
          />
        </Animated.View>

        {/* Subtitle */}
        <Animated.View 
          className="z-10 mb-8 items-center"
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
          <Text className="text-purple-200 text-xl bottom-14 font-semibold tracking-wide text-center mb-1">
            AI-Powered Speaking
          </Text>
          <Text className="text-purple-200 text-xl bottom-14 font-semibold tracking-wide text-center">
            & Reading Assistant
          </Text>
        </Animated.View>
        
        {/* White transparent loading indicator */}
        <View className="flex-row justify-center mb-10">
          {[0, 1, 2].map((i) => (
            <Animated.View 
              key={i}
              className="w-3 h-3 rounded-full mx-2 bottom-14 border-2 border-white/50"
              style={{
                opacity: subtitleOpacity.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.8, 0.8]
                }),
                transform: [
                  {
                    scale: subtitleOpacity.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1.3, 1]
                    })
                  },
                  {
                    translateY: subtitleOpacity.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, -10, 0]
                    })
                  }
                ]
              }}
            />
          ))}
        </View>

        {/* Footer text */}
        <Animated.View 
          className="items-center absolute bottom-12"
          style={{ 
            opacity: footerOpacity,
          }}
        >
          <Text className="text-blue-200 text-xs font-medium tracking-wide text-center mb-3">
            Build Confidence • Reduce Anxiety • Master Communication
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark" size={12} color="#10B981" />
            <Text className="text-blue-200 text-xs font-medium ml-1">
              Student‑Focused Learning: Secure • Free • Personalized
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Connection lines animation */}
      <View className="absolute w-full h-full pointer-events-none">
        {[
          { start: [width * 0.2, height * 0.3], end: [width * 0.5, height * 0.4], color: '#8B5CF6' },
          { start: [width * 0.8, height * 0.4], end: [width * 0.5, height * 0.45], color: '#3B82F6' },
          { start: [width * 0.3, height * 0.7], end: [width * 0.5, height * 0.5], color: '#0EA5E9' },
          { start: [width * 0.7, height * 0.2], end: [width * 0.5, height * 0.4], color: '#10B981' },
          { start: [width * 0.15, height * 0.5], end: [width * 0.5, height * 0.45], color: '#6366F1' },
          { start: [width * 0.85, height * 0.7], end: [width * 0.5, height * 0.5], color: '#A855F7' },
          { start: [width * 0.4, height * 0.2], end: [width * 0.5, height * 0.4], color: '#3B82F6' },
        ].map((line, i) => {
          const length = Math.sqrt(
            Math.pow(line.end[0] - line.start[0], 2) + 
            Math.pow(line.end[1] - line.start[1], 2)
          );
          const angle = Math.atan2(
            line.end[1] - line.start[1], 
            line.end[0] - line.start[0]
          ) * 180 / Math.PI;
          
          return (
            <Animated.View
              key={i}
              className="absolute"
              style={{
                width: length,
                height: 2,
                left: line.start[0],
                top: line.start[1],
                backgroundColor: line.color,
                opacity: neuralPulse.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.8, 0.4]
                }),
                transform: [
                  { rotate: `${angle}deg` },
                  {
                    scaleX: neuralPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1]
                    })
                  }
                ],
                shadowColor: line.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.7,
                shadowRadius: 3,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}