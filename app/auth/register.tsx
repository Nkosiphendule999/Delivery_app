import { useState } from "react";
import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { supabase } from "@/SupaBase/supabase_file";
import { useRouter } from "expo-router";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"customer" | "driver">("customer");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePhone = (phoneNum: string) => {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;
    if (!phoneNum.trim()) return true;
    return phoneRegex.test(phoneNum) && phoneNum.replace(/\D/g, '').length >= 8;
  };

  const register = async () => {
    if (!name.trim()) {
      return Alert.alert("Error", "Please enter your full name");
    }
    if (name.trim().length < 2) {
      return Alert.alert("Error", "Name must be at least 2 characters");
    }
    if (!email.trim()) {
      return Alert.alert("Error", "Please enter your email address");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return Alert.alert("Error", "Please enter a valid email address");
    }
    if (phone.trim() && !validatePhone(phone)) {
      return Alert.alert("Error", "Please enter a valid phone number");
    }
    if (!password) {
      return Alert.alert("Error", "Please enter a password");
    }
    if (password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }
    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setLoading(false);
        return Alert.alert("Registration Failed", authError.message);
      }

      if (!authData.user?.id) {
        setLoading(false);
        return Alert.alert("Error", "Failed to create user account");
      }

      const { error: insertError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          role: role,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.error("User insert error:", insertError);
        setLoading(false);
        return Alert.alert(
          "Registration Partial",
          `Your account was created but profile setup encountered an issue.\n\nError: ${insertError.message}`
        );
      }

      setLoading(false);
      
      // Show success message then navigate to login
      Alert.alert(
        "🎉 Registration Successful!",
        `Welcome to SwiftDash, ${name.split(" ")[0]}!\n\nYou are now registered as a ${role === "customer" ? "Customer" : "Driver"}.\nPlease log in to continue.`,
        [
          {
            text: "Go to Login",
            onPress: () => router.replace("/auth/login"),
          },
        ]
      );
      
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Registration error:", err);
      setLoading(false);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.logoEmoji}>📦🚚</Text>
            <Text style={styles.title}>AlphaDash</Text>
            <Text style={styles.subtitle}>Create Your Account</Text>
            <View style={styles.divider} />
          </View>

          {/* Role Selection Cards */}
          <Text style={styles.sectionLabel}>I want to join as a</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleCard, role === "customer" && styles.roleCardActive]}
              onPress={() => setRole("customer")}
              activeOpacity={0.8}
            >
              <Text style={styles.roleEmoji}>🛍️</Text>
              <Text style={[styles.roleText, role === "customer" && styles.roleTextActive]}>
                Customer
              </Text>
              <Text style={styles.roleDesc}>Order deliveries</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, role === "driver" && styles.roleCardActive]}
              onPress={() => setRole("driver")}
              activeOpacity={0.8}
            >
              <Text style={styles.roleEmoji}>🚚</Text>
              <Text style={[styles.roleText, role === "driver" && styles.roleTextActive]}>
                Driver
              </Text>
              <Text style={styles.roleDesc}>Deliver packages</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Full Name <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.inputIconContainer}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="John Doe"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.inputIconContainer}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="your@email.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Phone Number <Text style={styles.optionalText}>(Optional)</Text></Text>
              <View style={styles.inputIconContainer}>
                <Text style={styles.inputIcon}>📱</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="+1 234 567 8900"
                  placeholderTextColor="#94a3b8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={styles.hintText}>Enter with country code for best experience</Text>
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.inputIconContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Create a password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hintText}>Minimum 6 characters</Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Confirm Password <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.inputIconContainer}>
                <Text style={styles.inputIcon}>✓</Text>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? "👁️" : "👁️‍🗨️"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Service Info */}
            <View style={styles.serviceNote}>
              <Text style={styles.noteIcon}>🚀</Text>
              <Text style={styles.noteText}>
                {role === "customer"
                  ? "Real-time tracking, express delivery, and 24/7 support. Register now to start ordering!"
                  : "Flexible hours, bonus per delivery, and driver protection. Join our delivery fleet today!"}
              </Text>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={register}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>
                  {role === "customer" ? "Create Customer Account →" : "Become a Driver →"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginHint}>
              <Text style={styles.hintPlain}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>⚡ AlphaDash • Fast & Reliable Delivery Service</Text>
            <Text style={styles.footerSubtext}>By registering, you agree to our Terms of Service</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#ea580c",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#475569",
    fontWeight: "500",
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: "#fed7aa",
    borderRadius: 10,
    marginTop: 14,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
    marginTop: 8,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 28,
  },
  roleCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  roleCardActive: {
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  roleEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
  },
  roleTextActive: {
    color: "#ea580c",
  },
  roleDesc: {
    fontSize: 12,
    color: "#64748b",
  },
  form: {
    marginTop: 8,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginLeft: 4,
  },
  requiredStar: {
    color: "#ef4444",
    fontSize: 14,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#94a3b8",
  },
  inputIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 8,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
    color: "#f97316",
  },
  textInput: {
    fontSize: 16,
    color: "#0f172a",
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    paddingRight: 8,
    flex: 1,
  },
  eyeButton: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 18,
    color: "#94a3b8",
  },
  hintText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 6,
    marginLeft: 12,
  },
  serviceNote: {
    flexDirection: "row",
    backgroundColor: "#fef9e8",
    borderRadius: 18,
    padding: 14,
    marginVertical: 12,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#f97316",
  },
  noteIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "#7c2d12",
    lineHeight: 18,
    fontWeight: "500",
  },
  registerButton: {
    backgroundColor: "#f97316",
    borderRadius: 44,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  registerButtonDisabled: {
    backgroundColor: "#fdba74",
    shadowOpacity: 0.1,
  },
  registerButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  loginHint: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  hintPlain: {
    fontSize: 14,
    color: "#475569",
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f97316",
  },
  footer: {
    marginTop: 20,
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eef2f6",
  },
  footerText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  footerSubtext: {
    fontSize: 10,
    color: "#cbd5e1",
    marginTop: 4,
  },
});