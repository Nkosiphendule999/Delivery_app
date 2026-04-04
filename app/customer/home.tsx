import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Animated, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useRef, useEffect } from "react";

const { width, height } = Dimensions.get("window");

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState("Valued Customer");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Welcome Header */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeEmoji}>🚀</Text>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userName}!</Text>
              <View style={styles.divider} />
              <Text style={styles.tagline}>Your trusted delivery partner</Text>
            </View>

            {/* Trust & Security Banner */}
            <LinearGradient
              colors={["#ffeaa7", "#fdcb6e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.trustBanner}
            >
              <View style={styles.trustHeader}>
                <Text style={styles.trustIcon}>🔒</Text>
                <Text style={styles.trustTitle}>100% Secure & Reliable</Text>
              </View>
              <Text style={styles.trustMessage}>
                Your packages are fully insured • 24/7 customer support
              </Text>
              <View style={styles.trustBadges}>
                <View style={styles.badge}>
                  <Text style={styles.badgeIcon}>✓</Text>
                  <Text style={styles.badgeText}>Encrypted Payment</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeIcon}>✓</Text>
                  <Text style={styles.badgeText}>Verified Drivers</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeIcon}>✓</Text>
                  <Text style={styles.badgeText}>Money-back Guarantee</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>10K+</Text>
                <Text style={styles.statLabel}>Happy Customers</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>99.9%</Text>
                <Text style={styles.statLabel}>On-Time Delivery</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>24/7</Text>
                <Text style={styles.statLabel}>Support Available</Text>
              </View>
            </View>

            {/* Main Action Button */}
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() => router.push("/customer/request")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#f093fb", "#f5576c"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonIcon}>📦</Text>
                <Text style={styles.buttonText}>Request a Delivery</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Features Grid */}
            <View style={styles.featuresContainer}>
              <Text style={styles.sectionTitle}>Why Choose AlphaDash?</Text>
              <View style={styles.featuresGrid}>
                <View style={styles.featureCard}>
                  <Text style={styles.featureIcon}>⚡</Text>
                  <Text style={styles.featureTitle}>Lightning Fast</Text>
                  <Text style={styles.featureDesc}>Express delivery in under 30 mins</Text>
                </View>
              
                <View style={styles.featureCard}>
                  <Text style={styles.featureIcon}>💎</Text>
                  <Text style={styles.featureTitle}>Premium Support</Text>
                  <Text style={styles.featureDesc}>24/7 customer service hotline</Text>
                </View>
                <View style={styles.featureCard}>
                  <Text style={styles.featureIcon}>🔐</Text>
                  <Text style={styles.featureTitle}>Safe & Secure</Text>
                  <Text style={styles.featureDesc}>Fully insured deliveries</Text>
                </View>
              </View>
            </View>

            {/* Testimonial */}
            <View style={styles.testimonial}>
              <Text style={styles.quoteIcon}>“</Text>
              <Text style={styles.testimonialText}>
                AlphaDash has transformed how I send packages. Fast, reliable, and their customer service is outstanding!
              </Text>
              <Text style={styles.testimonialAuthor}>— Sihlabathi Khephekhephe</Text>
              <Text style={styles.testimonialRole}>Verified Customer</Text>
              <View style={styles.stars}>
                <Text style={styles.star}>★</Text>
                <Text style={styles.star}>★</Text>
                <Text style={styles.star}>★</Text>
                <Text style={styles.star}>★</Text>
                <Text style={styles.star}>★</Text>
              </View>
            </View>

            {/* Trust Footer */}
            <View style={styles.footer}>
              <View style={styles.footerBadges}>
                <Text style={styles.footerBadge}>SSL Secure</Text>
                <Text style={styles.footerBadgeDot}>•</Text>
                <Text style={styles.footerBadge}>GDPR Compliant</Text>
                <Text style={styles.footerBadgeDot}>•</Text>
                <Text style={styles.footerBadge}>PCI Certified</Text>
              </View>
              <Text style={styles.footerText}>
                ⚡ Over 1 million deliveries completed with 99.9% satisfaction rate
              </Text>
              <Text style={styles.footerSubtext}>
                Your trust is our priority • All drivers are background-checked
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 30,
    paddingBottom: 30,
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  welcomeEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  userName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginTop: 5,
  },
  divider: {
    width: 80,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 2,
    marginVertical: 15,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
  },
  trustBanner: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  trustHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  trustIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  trustTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#d63031",
  },
  trustMessage: {
    fontSize: 13,
    color: "#e17055",
    marginBottom: 12,
    lineHeight: 18,
  },
  trustBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeIcon: {
    fontSize: 12,
    color: "#00b894",
    marginRight: 5,
    fontWeight: "bold",
  },
  badgeText: {
    fontSize: 11,
    color: "#2d3436",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  requestButton: {
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 30,
    shadowColor: "#f5576c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  buttonArrow: {
    fontSize: 20,
    color: "#fff",
    marginLeft: 12,
    fontWeight: "600",
  },
  featuresContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 18,
    textAlign: "center",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 5,
  },
  featureDesc: {
    fontSize: 11,
    color: "#636e72",
    textAlign: "center",
  },
  testimonial: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  quoteIcon: {
    fontSize: 50,
    color: "#f5576c",
    marginBottom: 10,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  testimonialText: {
    fontSize: 15,
    color: "#2d3436",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: "italic",
  },
  testimonialAuthor: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f5576c",
    marginBottom: 3,
  },
  testimonialRole: {
    fontSize: 11,
    color: "#b2bec3",
    marginBottom: 8,
  },
  stars: {
    flexDirection: "row",
    gap: 4,
  },
  star: {
    fontSize: 18,
    color: "#fdcb6e",
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  footerBadges: {
    flexDirection: "row",
    marginBottom: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  footerBadge: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  footerBadgeDot: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginHorizontal: 6,
  },
  footerText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 6,
  },
  footerSubtext: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
});