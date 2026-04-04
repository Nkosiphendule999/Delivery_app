import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";

export default function Welcome() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#020617", "#0F172A"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 🚀 APP NAME */}
        <View style={styles.header}>
          <Ionicons name="rocket" size={50} color="#00E5FF" />
          <ThemedText style={styles.title}>AlphaDash</ThemedText>
        </View>

        {/* 🎯 MISSION */}
        <View style={styles.card}>
          <Ionicons name="flag" size={24} color="#6C63FF" />
          <ThemedText style={styles.cardTitle}>Our Mission</ThemedText>
          <ThemedText style={styles.text}>
            To provide fast, safe, and reliable delivery services for everyone —
            especially in areas where location access is difficult or unsafe.
          </ThemedText>
        </View>

        {/* 🌍 GOAL */}
        <View style={styles.card}>
          <Ionicons name="globe" size={24} color="#00E5FF" />
          <ThemedText style={styles.cardTitle}>Our Goal</ThemedText>
          <ThemedText style={styles.text}>
            To bridge the gap between customers and drivers using smart
            location technology and real-time delivery systems.
          </ThemedText>
        </View>

        {/* ⚡ OBJECTIVES */}
        <View style={styles.card}>
          <Ionicons name="flash" size={24} color="#6C63FF" />
          <ThemedText style={styles.cardTitle}>Objectives</ThemedText>
          <ThemedText style={styles.text}>
            • Enable easy delivery requests{"\n"}
            • Improve safety with live location{"\n"}
            • Connect multiple drivers instantly{"\n"}
            • Provide real-time tracking and communication
          </ThemedText>
        </View>

        {/* 🔐 BUTTONS */}
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("/auth/login")}
        >
          <Ionicons name="log-in-outline" size={20} color="white" />
          <ThemedText style={styles.btnText}>Login</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => router.push("/auth/register")}
        >
          <Ionicons name="person-add-outline" size={20} color="white" />
          <ThemedText style={styles.btnText}>Register</ThemedText>
        </TouchableOpacity>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: 20,
    paddingTop: 60,
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    color: "white",
    fontWeight: "bold",
    marginTop: 10,
  },

  card: {
    backgroundColor: "#1E293B",
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
  },
  cardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 5,
  },
  text: {
    color: "#CBD5F5",
    fontSize: 14,
  },

  loginBtn: {
    flexDirection: "row",
    backgroundColor: "#6C63FF",
    padding: 15,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  registerBtn: {
    flexDirection: "row",
    backgroundColor: "#00E5FF",
    padding: 15,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  btnText: {
    color: "white",
    marginLeft: 10,
    fontWeight: "600",
  },
});