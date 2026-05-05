// screens/HelpSupportScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// ─── types ────────────────────────────────────────────────────────────────────

interface FAQ {
  q: string;
  a: string;
}

interface ContactOption {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  sub: string;
  onPress: () => void;
  iconBg: string;
}

// ─── data ─────────────────────────────────────────────────────────────────────

const FAQS: FAQ[] = [
  {
    q: "How do I list a new product?",
    a: "Go to Inventory → tap Add Product → fill in details → Publish. Your listing goes live after a brief review.",
  },
  {
    q: "When do I receive payments?",
    a: "Payments are released 24h after confirmed delivery. Funds appear in your linked bank account within 1–3 business days.",
  },
  {
    q: "How is my price verified?",
    a: "Prices are checked against the daily official market index. Listings more than 20% above market are flagged for review.",
  },
  {
    q: "Can I change my role?",
    a: "Role changes require re-verification. Contact support with your new business documents and we'll process within 5 business days.",
  },
  {
    q: "How do I track my shipment?",
    a: "Open the Logistics tab, find your order, and tap 'Track'. Real-time GPS updates are shown when the transporter has activated tracking.",
  },
];

const RESOURCES = [
  { icon: "menu-book" as const,  label: "User Guide",       sub: "Full documentation",  iconBg: "#f0faf0" },
  { icon: "gavel"    as const,   label: "Terms & Privacy",  sub: "Legal information",   iconBg: "#fff8f0" },
  { icon: "bug-report" as const, label: "Report a Bug",     sub: "Help us improve",     iconBg: "#f0f4ff" },
  { icon: "info"     as const,   label: "About AgriConnect",sub: "Version 2.4.1",        iconBg: "#f3f4f6" },
];

// ─── sub-components ───────────────────────────────────────────────────────────

const FAQItem = ({ faq }: { faq: FAQ }) => {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => setOpen((o) => !o)}
      activeOpacity={0.8}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{faq.q}</Text>
        <MaterialIcons
          name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={20}
          color="#9ca3af"
        />
      </View>
      {open && <Text style={styles.faqA}>{faq.a}</Text>}
    </TouchableOpacity>
  );
};

// ─── main screen ─────────────────────────────────────────────────────────────

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");

  const filteredFAQs = FAQS.filter(
    (f) =>
      search.length === 0 ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  const contactOptions: ContactOption[] = [
    {
      icon: "chat-bubble-outline",
      label: "Live Chat",
      sub: "Avg 2 min response",
      iconBg: "#f0faf0",
      onPress: () => {},
    },
    {
      icon: "mail-outline",
      label: "Email",
      sub: "benhamadamohamedse@",
      iconBg: "#f0f8ff",
      onPress: () => Linking.openURL("mailto:benhamadamohamedse@gmail.com"),
    },
    {
      icon: "phone" as any,
      label: "Call",
      sub: "0561397092",
      iconBg: "#fff8f0",
      onPress: () => Linking.openURL("tel:+213561397092"),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={20} color="#1a2e1a" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Help & Support</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* SEARCH */}
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help articles…"
            placeholderTextColor="#c4c4c4"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <MaterialIcons name="close" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* CONTACT */}
        {search.length === 0 && (
          <>
            <Text style={styles.sectionHead}>Contact Us</Text>
            <View style={styles.contactGrid}>
              {contactOptions.map((c) => (
                <TouchableOpacity key={c.label} style={styles.contactCard} onPress={c.onPress} activeOpacity={0.8}>
                  <View style={[styles.contactIcon, { backgroundColor: c.iconBg }]}>
                    <MaterialIcons name={c.icon} size={20} color="#555" />
                  </View>
                  <Text style={styles.contactLabel}>{c.label}</Text>
                  <Text style={styles.contactSub}>{c.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* FAQs */}
        <Text style={styles.sectionHead}>
          {search.length > 0 ? `Results for "${search}"` : "Frequently Asked Questions"}
        </Text>

        {filteredFAQs.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={32} color="#d1d5db" />
            <Text style={styles.emptyText}>No results found</Text>
            <Text style={styles.emptySub}>Try different keywords or contact support</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {filteredFAQs.map((faq, i) => (
              <View key={i} style={i < filteredFAQs.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6" }}>
                <FAQItem faq={faq} />
              </View>
            ))}
          </View>
        )}

        {/* RESOURCES */}
        {search.length === 0 && (
          <>
            <Text style={styles.sectionHead}>Resources</Text>
            <View style={styles.card}>
              {RESOURCES.map((r, i) => (
                <TouchableOpacity
                  key={r.label}
                  style={[styles.resourceRow, i === RESOURCES.length - 1 && { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.resourceIcon, { backgroundColor: r.iconBg }]}>
                    <MaterialIcons name={r.icon} size={18} color="#555" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resourceLabel}>{r.label}</Text>
                    <Text style={styles.resourceSub}>{r.sub}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* FOOTER */}
        <Text style={styles.footer}>AgriConnect v2.4.1 · © 2024 AgriConnect Inc.</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f8f5" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    alignItems: "center",
    justifyContent: "center",
  },

  pageTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.3,
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1a2e1a",
    padding: 0,
  },

  sectionHead: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },

  contactGrid: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },

  contactCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    padding: 14,
    alignItems: "center",
    gap: 6,
  },

  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  contactLabel: { fontSize: 12, fontWeight: "700", color: "#1a2e1a" },
  contactSub: { fontSize: 10, color: "#9ca3af", textAlign: "center" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    overflow: "hidden",
  },

  faqItem: { padding: 14 },

  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  faqQ: { flex: 1, fontSize: 13, fontWeight: "700", color: "#1a2e1a" },
  faqA: { fontSize: 12, color: "#6b7280", marginTop: 8, lineHeight: 18 },

  resourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },

  resourceIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  resourceLabel: { fontSize: 13, fontWeight: "700", color: "#1a2e1a" },
  resourceSub: { fontSize: 11, color: "#9ca3af", marginTop: 2 },

  emptyState: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 6,
  },

  emptyText: { fontSize: 14, fontWeight: "700", color: "#9ca3af" },
  emptySub: { fontSize: 12, color: "#c4c4c4" },

  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "#c4c4c4",
    marginTop: 20,
    marginHorizontal: 16,
  },
});