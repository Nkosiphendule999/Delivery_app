import { useState, useRef, useEffect } from "react";
import {
  View,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  Dimensions,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { supabase } from "@/SupaBase/supabase_file";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      return Alert.alert("Error", "Please enter your email address");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return Alert.alert("Error", "Please enter a valid email address");
    }
    if (!password) {
      return Alert.alert("Error", "Please enter your password");
    }

    setLoading(true);
    try {
      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        setLoading(false);
        return Alert.alert("Login Failed", "Invalid email or password");
      }

      if (!authData.user?.id) {
        setLoading(false);
        return Alert.alert("Error", "User not found");
      }

      // Step 2: Fetch user role from database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, name")
        .eq("id", authData.user.id)
        .single();

      if (userError || !userData) {
        setLoading(false);
        return Alert.alert("Error", "Failed to fetch user information");
      }

      setLoading(false);

      // Step 3: Redirect based on role
      if (userData.role === "customer") {
        router.replace("/customer/home"); // or just "/home" depending on your route structure
      } else if (userData.role === "driver") {
        router.replace("/driver/dashboard");
      } else {
        Alert.alert("Error", "Invalid user role");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.contentWrapper,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Header Section */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoEmoji}>🚀</Text>
                </View>
                <Text style={styles.title}>AlphaDash</Text>
                <Text style={styles.subtitle}>Welcome Back!</Text>
                <View style={styles.divider} />
                <Text style={styles.tagline}>Sign in to continue</Text>
              </View>

              {/* Login Form */}
              <View style={styles.form}>
                {/* Email Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View
                    style={[
                      styles.inputIconContainer,
                      focusedInput === "email" && styles.inputFocused,
                    ]}
                  >
                    <Text style={styles.inputIcon}>📧</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="your@email.com"
                      placeholderTextColor="#aaa"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput(null)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View
                    style={[
                      styles.inputIconContainer,
                      focusedInput === "password" && styles.inputFocused,
                    ]}
                  >
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      style={[styles.textInput, { flex: 1 }]}
                      placeholder="Enter your password"
                      placeholderTextColor="#aaa"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Text style={styles.eyeIcon}>
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => Alert.alert("Reset Password", "Password reset link will be sent to your email")}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#f093fb", "#f5576c"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.loginButtonText}>Sign In →</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Sign Up Link */}
                <View style={styles.signupHint}>
                  <Text style={styles.hintPlain}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => router.push("/auth/register")}>
                    <Text style={styles.signupLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>⚡ Fast & Reliable Delivery Service</Text>
                <Text style={styles.footerSubtext}>Secure login • 24/7 Support</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 40 : 50,
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  logoEmoji: {
    fontSize: 55,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "600",
    marginBottom: 8,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 2,
    marginVertical: 12,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.5,
  },
  form: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 30,
    padding: 24,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
  },
  inputFocused: {
    borderColor: "#f093fb",
    borderWidth: 2,
    backgroundColor: "#fff",
    shadowColor: "#f093fb",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
    color: "#f5576c",
  },
  textInput: {
    fontSize: 16,
    color: "#333",
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
    paddingRight: 8,
    flex: 1,
  },
  eyeButton: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 18,
    color: "#999",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: "#f5576c",
    fontWeight: "600",
  },
  loginButton: {
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#f5576c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  signupHint: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  hintPlain: {
    fontSize: 14,
    color: "#666",
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f5576c",
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  footerSubtext: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    marginTop: 6,
  },
});