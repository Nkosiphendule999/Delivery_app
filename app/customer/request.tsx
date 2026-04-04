import { supabase } from "@/SupaBase/supabase_file";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";

const { width, height } = Dimensions.get("window");

export default function Request() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupTime, setPickupTime] = useState<"now" | "later">("now");
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("Medium Box");
  const [selectedWeight, setSelectedWeight] = useState<string>("1-5kg");
  const [selectedOption, setSelectedOption] = useState<string>("standard");
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

  const getOptionPrice = () => {
    switch (selectedOption) {
      case "express": return "100";
      case "standard": return "50";
      case "scheduled": return "149.99";
      default: return "50";
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-ZA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const create = async () => {
    if (!pickupAddress.trim()) {
      Alert.alert("Error", "Please enter a pickup address");
      return;
    }

    if (pickupTime === "later" && !selectedDateTime) {
      Alert.alert("Error", "Please select a pickup time");
      return;
    }

    setLoading(true);
    
    try {
      const user = (await supabase.auth.getUser()).data.user;

      if (!user) {
        Alert.alert("Error", "Please login again");
        router.replace("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("delivery_requests")
        .insert([
          {
            customer_id: user?.id,
            pickup_address: pickupAddress.trim(),
            pickup_lat: 0,
            pickup_lng: 0,
            status: "pending",
            package_type: selectedPackage,
            weight: selectedWeight,
            delivery_option: selectedOption,
            delivery_fee: getOptionPrice(),
            pickup_time: pickupTime,
            scheduled_time: pickupTime === "later" ? selectedDateTime.toISOString() : null,
            tracking_status: "request_received",
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Navigate directly to tracking page
      router.push({ pathname: "/customer/tracking", params: { id: data.id } });
      
    } catch (error: any) {
      console.error("Delivery request error:", error);
      Alert.alert("Error", error.message || "Failed to create delivery request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setSelectedDateTime(selectedDate);
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
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Request Delivery</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Main Card */}
            <View style={styles.mainCard}>
              <Text style={styles.cardEmoji}>📦</Text>
              <Text style={styles.cardTitle}>New Delivery Request</Text>
              <Text style={styles.cardSubtitle}>
                Enter your pickup details
              </Text>
            </View>

            {/* Address Input Section */}
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressIcon}>📍</Text>
                <Text style={styles.addressTitle}>Pickup Address</Text>
              </View>
              
              <TextInput
                style={styles.addressInput}
                placeholder="Enter street address, landmark, or area"
                placeholderTextColor="#999"
                value={pickupAddress}
                onChangeText={setPickupAddress}
                multiline
              />
            </View>

            {/* Pickup Time Selection */}
            <View style={styles.timeCard}>
              <Text style={styles.timeTitle}>⏰ Pickup Time</Text>
              <View style={styles.timeOptions}>
                <TouchableOpacity
                  style={[styles.timeOption, pickupTime === "now" && styles.timeOptionActive]}
                  onPress={() => setPickupTime("now")}
                >
                  <Text style={[styles.timeOptionText, pickupTime === "now" && styles.timeOptionTextActive]}>
                    Pickup Now
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.timeOption, pickupTime === "later" && styles.timeOptionActive]}
                  onPress={() => setPickupTime("later")}
                >
                  <Text style={[styles.timeOptionText, pickupTime === "later" && styles.timeOptionTextActive]}>
                    Schedule Later
                  </Text>
                </TouchableOpacity>
              </View>

              {pickupTime === "later" && (
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateTimeIcon}>📅</Text>
                  <Text style={styles.dateTimeText}>
                    {formatDateTime(selectedDateTime)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Delivery Options */}
            <View style={styles.optionsContainer}>
              <Text style={styles.optionsTitle}>Delivery Options</Text>
              <View style={styles.optionsGrid}>
                <TouchableOpacity 
                  style={[styles.optionCard, selectedOption === "express" && styles.optionCardActive]}
                  onPress={() => setSelectedOption("express")}
                >
                  <Text style={styles.optionIcon}>⚡</Text>
                  <Text style={[styles.optionName, selectedOption === "express" && styles.optionNameActive]}>Express</Text>
                  <Text style={styles.optionPrice}>R100</Text>
                  <Text style={styles.optionTime}>20-30 min</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.optionCard, selectedOption === "standard" && styles.optionCardActive]}
                  onPress={() => setSelectedOption("standard")}
                >
                  <Text style={styles.optionIcon}>🚚</Text>
                  <Text style={[styles.optionName, selectedOption === "standard" && styles.optionNameActive]}>Standard</Text>
                  <Text style={styles.optionPrice}>R50</Text>
                  <Text style={styles.optionTime}>45-60 min</Text>
                  {selectedOption === "standard" && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Recommended</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.optionCard, selectedOption === "scheduled" && styles.optionCardActive]}
                  onPress={() => setSelectedOption("scheduled")}
                >
                  <Text style={styles.optionIcon}>🌙</Text>
                  <Text style={[styles.optionName, selectedOption === "scheduled" && styles.optionNameActive]}>Scheduled</Text>
                  <Text style={styles.optionPrice}>R149.99</Text>
                  <Text style={styles.optionTime}>Pick a time</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Package Details */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Package Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Package Type</Text>
                <View style={styles.packageTypes}>
                  {["Small Box", "Medium Box", "Large Box", "Envelope"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.packageTag, selectedPackage === type && styles.packageTagActive]}
                      onPress={() => setSelectedPackage(type)}
                    >
                      <Text style={[styles.packageTagText, selectedPackage === type && styles.packageTagTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Weight</Text>
                <View style={styles.weightSelector}>
                  {["<1kg", "1-5kg", "5-10kg", "10kg+"].map((weight) => (
                    <TouchableOpacity
                      key={weight}
                      style={[styles.weightOption, selectedWeight === weight && styles.weightOptionActive]}
                      onPress={() => setSelectedWeight(weight)}
                    >
                      <Text style={[styles.weightText, selectedWeight === weight && styles.weightTextActive]}>
                        {weight}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Price Summary */}
            <View style={styles.priceCard}>
              <Text style={styles.priceTitle}>Price Summary</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery Fee</Text>
                <Text style={styles.priceValue}>R{getOptionPrice()}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Service Fee</Text>
                <Text style={styles.priceValue}>R20</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  R{getOptionPrice() === "50" ? "70" : 
                     getOptionPrice() === "100" ? "120" : "169.99"}
                </Text>
              </View>
            </View>

            {/* Trust Message */}
            <LinearGradient
              colors={["#ffeaa7", "#fdcb6e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.trustBanner}
            >
              <Text style={styles.trustIcon}>🔒</Text>
              <View style={styles.trustContent}>
                <Text style={styles.trustTitle}>Safe & Secure Delivery</Text>
                <Text style={styles.trustMessage}>
                  Your package is fully insured. Real-time tracking available.
                </Text>
              </View>
            </LinearGradient>

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={create}
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
                  <>
                    <Text style={styles.buttonIcon}>🚀</Text>
                    <Text style={styles.buttonText}>Create Delivery Request</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer Note */}
            <View style={styles.footerNote}>
              <Text style={styles.footerText}>
                By creating a request, you agree to our Terms of Service
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>

      {/* DateTime Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedDateTime}
          mode="datetime"
          display="default"
          onChange={onTimeChange}
          minimumDate={new Date()}
        />
      )}
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
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  mainCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 25,
    padding: 25,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardEmoji: {
    fontSize: 50,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2d3436",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#636e72",
    textAlign: "center",
  },
  addressCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  addressIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
  },
  addressInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minHeight: 80,
    textAlignVertical: "top",
  },
  timeCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 15,
  },
  timeOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 15,
  },
  timeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  timeOptionActive: {
    backgroundColor: "#f5576c",
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
  },
  timeOptionTextActive: {
    color: "#fff",
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateTimeIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  dateTimeText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  optionCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    position: "relative",
  },
  optionCardActive: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#f5576c",
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  optionName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  optionNameActive: {
    color: "#f5576c",
  },
  optionPrice: {
    fontSize: 11,
    color: "#00b894",
    fontWeight: "700",
    marginBottom: 2,
  },
  optionTime: {
    fontSize: 10,
    color: "#b2bec3",
  },
  recommendedBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#f5576c",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recommendedText: {
    fontSize: 8,
    color: "#fff",
    fontWeight: "700",
  },
  detailsCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 15,
  },
  detailRow: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#636e72",
    marginBottom: 10,
  },
  packageTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  packageTag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  packageTagActive: {
    backgroundColor: "#f5576c",
  },
  packageTagText: {
    fontSize: 13,
    color: "#2d3436",
  },
  packageTagTextActive: {
    color: "#fff",
  },
  weightSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  weightOption: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  weightOptionActive: {
    backgroundColor: "#f5576c",
  },
  weightText: {
    fontSize: 13,
    color: "#2d3436",
  },
  weightTextActive: {
    color: "#fff",
  },
  priceCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  priceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    color: "#636e72",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f5576c",
  },
  trustBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
  },
  trustIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  trustContent: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#d63031",
    marginBottom: 4,
  },
  trustMessage: {
    fontSize: 11,
    color: "#e17055",
  },
  createButton: {
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 15,
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
    paddingVertical: 16,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 10,
    color: "#fff",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  footerNote: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
});