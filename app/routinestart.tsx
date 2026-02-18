import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCustomAlert } from "../src/hooks/useCustomAlert";
import CustomAlert, { AlertButton } from "./components/CustomAlert";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/context/theme";
import { FacebookIcon, InstagramIcon, YoutubeIcon, LinkIcon, TikTokIcon } from "./components/TabIcons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "../src/lib/supabase";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { useAuth } from "../src/context/auth";
import { api } from "../src/services/api";

type SocialLinkType =
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "web";

interface SocialLink {
  id?: string;
  url: string;
}

interface ProfileData {
  username: string;
  full_name: string;
  bio: string;
  avatar_url?: string | null;
  social_links: SocialLink[];
}

// Add this function to determine social link type from URL
const getSocialTypeFromUrl = (url: string): SocialLinkType => {
  const domain = url.toLowerCase();
  if (domain.includes("facebook.com")) return "facebook";
  if (domain.includes("instagram.com")) return "instagram";
  if (domain.includes("tiktok.com")) return "tiktok";
  if (domain.includes("twitter.com")) return "twitter";
  if (domain.includes("linkedin.com")) return "linkedin";
  if (domain.includes("youtube.com") || domain.includes("youtu.be"))
    return "youtube";
  return "web";
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { isDarkMode, selectedPalette } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { user, triggerProfileRefresh } = useAuth();
  const [imageVersion, setImageVersion] = useState<number>(Date.now());
  const [profileData, setProfileData] = useState<ProfileData>({
    username: "",
    full_name: "",
    bio: "",
    social_links: [],
  });

  // Ref to track new social link inputs for auto-focus
  const socialInputRefs = useRef<Array<TextInput | null>>([]);
  const { alertProps, showAlert, hideAlert } = useCustomAlert();

  const closeAlert = hideAlert;

  const getSocialIcon = (url: string) => {
    const type = getSocialTypeFromUrl(url);
    const size = 24;
    // Use proper brand colors or theme colors
    switch (type) {
      case "facebook":
        return <FacebookIcon size={size} color="#1877F2" />;
      case "instagram":
        return <InstagramIcon size={size} color="#E4405F" />;
      case "tiktok":
        return <TikTokIcon size={size} color={isDarkMode ? "#FFFFFF" : "#000000"} />;
      case "youtube":
        return <YoutubeIcon size={size} color="#FF0000" />;
      case "twitter": // X / Twitter
        return <Ionicons name="logo-twitter" size={size} color="#1DA1F2" />;
      case "linkedin":
        return <Ionicons name="logo-linkedin" size={size} color="#0A66C2" />;
      default:
        // Default link icon using theme color
        return <LinkIcon size={size} color={selectedPalette.primary} />;
    }
  };

  const colors = {
    background: isDarkMode
      ? selectedPalette.dark.background
      : selectedPalette.light.background,
    surface: isDarkMode
      ? selectedPalette.dark.surface
      : selectedPalette.light.surface,
    surfaceSecondary: isDarkMode
      ? `${selectedPalette.primary}15` // 15 is hex for 8% opacity
      : `${selectedPalette.primary}10`, // 10 is hex for 6% opacity
    text: isDarkMode ? selectedPalette.dark.text : selectedPalette.light.text,
    textSecondary: isDarkMode
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.6)",
    border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    cardBackground: isDarkMode ? "#1E1E1E" : "#F8F9FA",
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Update image version when profileData.avatar_url changes
  useEffect(() => {
    setImageVersion(Date.now());
  }, [profileData.avatar_url]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await api.getProfile();

      console.log(
        "Profile data fetched successfully. Avatar URL:",
        response.profile.avatar_url
      );

      setImageVersion(Date.now());

      setProfileData({
        username: response.profile.username || "",
        full_name: response.profile.full_name || "",
        bio: response.profile.bio || "",
        avatar_url: response.profile.avatar_url,
        social_links: response.social_links || [],
      });
    } catch (error) {
      console.error("Error in fetchProfileData:", error);
      showAlert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log("Saving profile...");

      // Basic validation
      const validLinks = profileData.social_links.filter(link => link.url.trim().length > 0);

      await api.updateProfile({
        username: profileData.username,
        full_name: profileData.full_name,
        bio: profileData.bio,
        social_links: validLinks
      });

      triggerProfileRefresh();

      showAlert("Success", "Profile updated successfully", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error) {
      console.error("Error saving profile:", error);
      showAlert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const uploadImageToStorage = async (uri: string): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const publicUrl = await api.uploadAvatar(uri);
      return publicUrl;
    } catch (error) {
      console.error("Error in uploadImageToStorage:", error);
      showAlert(
        "Upload Error",
        "An error occurred while uploading the image."
      );
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const cleanupOldProfilePhoto = async (newPhotoUrl?: string) => {
    try {
      if (!profileData.avatar_url || profileData.avatar_url === newPhotoUrl) {
        return;
      }
      const oldAvatarUrl = profileData.avatar_url;
      if (oldAvatarUrl.includes("avatars/")) {
        const fileName = oldAvatarUrl.split("avatars/").pop();
        if (fileName) {
          console.log("Attempting to remove old profile photo:", fileName);
          await api.deleteAvatar(fileName, false);
          console.log("Successfully removed old profile photo file");
        }
      }
    } catch (error) {
      console.error("Error in cleanupOldProfilePhoto:", error);
    }
  };

  const pickImage = async () => {
    if (uploadingImage) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // Capture high quality, compress after
    });

    if (!result.canceled) {
      try {
        const originalUri = result.assets[0].uri;
        const newImageVersion = Date.now();
        setImageVersion(newImageVersion);

        // Client-side compression: resize to 512x512, JPEG 0.8
        const manipulatedResult = await ImageManipulator.manipulateAsync(
          originalUri,
          [{ resize: { width: 512, height: 512 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        const compressedUri = manipulatedResult.uri;
        console.log("Image compressed to 512x512:", compressedUri);

        setProfileData((prev) => ({ ...prev, avatar_url: compressedUri }));
        const publicUrl = await uploadImageToStorage(compressedUri);
        if (publicUrl) {
          console.log("Image uploaded successfully to:", publicUrl);
          setProfileData((prev) => ({ ...prev, avatar_url: publicUrl }));
          setImageVersion(Date.now());
        } else {
          console.log("Upload failed, reverting to previous avatar");
          try {
            const profile = await api.getProfile();
            if (profile.profile.avatar_url) {
              setProfileData((prev) => ({
                ...prev,
                avatar_url: profile.profile.avatar_url,
              }));
              setImageVersion(Date.now());
            }
          } catch (e) { console.error("Error reverting avatar:", e); }
        }
      } catch (error) {
        console.error("Error picking/compressing image:", error);
        showAlert("Error", "Failed to process the selected image.");
      }
    }
  }

  const removeProfilePhoto = () => {
    showAlert(
      "Remove Photo",
      "Are you sure you want to remove your profile photo?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              if (profileData.avatar_url) {
                await cleanupOldProfilePhoto();
              }
              setProfileData((prev) => ({ ...prev, avatar_url: null }));
              setImageVersion(Date.now());
              triggerProfileRefresh();
              console.log("Profile photo removed successfully");
            } catch (error) {
              console.error("Error removing profile photo:", error);
              showAlert("Error", "Failed to remove profile photo.");
            }
          },
        },
      ]
    );
  };

  const updateSocialLink = (index: number, url: string) => {
    const newLinks = [...profileData.social_links];
    newLinks[index] = { ...newLinks[index], url };
    setProfileData((prev) => ({ ...prev, social_links: newLinks }));
  };

  const addSocialLink = () => {
    if (profileData.social_links.length >= 5) {
      showAlert("Maximum Links", "You can only add up to 5 social links.");
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setProfileData((prev) => ({
      ...prev,
      social_links: [...prev.social_links, { url: "" }],
    }));

    // Focus the new input after render
    setTimeout(() => {
      const lastIndex = profileData.social_links.length; // Length is the index of the NEW item
      if (socialInputRefs.current[lastIndex]) {
        socialInputRefs.current[lastIndex]?.focus();
      }
    }, 100);
  };

  const removeSocialLink = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setProfileData((prev) => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={selectedPalette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']} // Don't safely inset bottom here to allow KB view to work fully
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Edit Profile
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[
            styles.saveButton,
            {
              backgroundColor: selectedPalette.primary,
              opacity: saving ? 0.7 : 1,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Profile Photo Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.photoCenterContainer}>
              <TouchableOpacity
                onPress={pickImage}
                style={styles.photoContainer}
                disabled={uploadingImage}
              >
                <View
                  style={[
                    styles.profilePhoto,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                >
                  {profileData.avatar_url ? (
                    <>
                      <Image
                        key={`edit-profile-image-${imageVersion}`}
                        source={{
                          uri: profileData.avatar_url.includes("?")
                            ? `${profileData.avatar_url}&t=${imageVersion}`
                            : `${profileData.avatar_url}?t=${imageVersion}`,
                          cache: "reload",
                        }}
                        style={styles.photo}
                      />
                      {uploadingImage && (
                        <View style={styles.uploadingOverlay}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        </View>
                      )}
                    </>
                  ) : (
                    <Ionicons
                      name="camera"
                      size={32}
                      color={colors.textSecondary}
                    />
                  )}
                </View>
                <Text style={[styles.changePhotoText, { color: selectedPalette.primary }]}>
                  {uploadingImage ? "Uploading..." : "Change Photo"}
                </Text>
              </TouchableOpacity>

              {profileData.avatar_url && (
                <TouchableOpacity
                  onPress={removeProfilePhoto}
                  style={styles.removeTextButton}
                >
                  <Text style={[styles.removePhotoText, { color: '#EF4444' }]}>
                    Remove Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Info Section */}
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Info</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={profileData.username}
                onChangeText={(text) =>
                  setProfileData((prev) => ({
                    ...prev,
                    username: text.toLowerCase(),
                  }))
                }
                placeholder="Enter username"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={profileData.full_name}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, full_name: text }))
                }
                placeholder="Enter full name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Bio</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={profileData.bio}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, bio: text }))
                }
                placeholder="Write something about yourself"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={112}
              />
              <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
                {profileData.bio.length}/112
              </Text>
            </View>
          </View>

          {/* Social Links Section */}
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Social Links</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Add links to your social profiles.
            </Text>

            <View style={styles.socialList}>
              {profileData.social_links.map((link, index) => (
                <View key={index} style={[styles.socialLinkRow, { backgroundColor: colors.surface }]}>
                  <View style={styles.iconContainer}>
                    {getSocialIcon(link.url)}
                  </View>
                  <TextInput
                    ref={(el: TextInput | null) => { socialInputRefs.current[index] = el; }}
                    style={[
                      styles.socialUrlInput,
                      {
                        color: colors.text,
                      },
                    ]}
                    value={link.url}
                    onChangeText={(text) => updateSocialLink(index, text)}
                    placeholder="https://"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  <TouchableOpacity
                    onPress={() => removeSocialLink(index)}
                    style={styles.removeLinkButton}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {profileData.social_links.length < 5 && (
              <TouchableOpacity
                onPress={addSocialLink}
                style={[
                  styles.addLinkButton,
                  { borderColor: selectedPalette.primary, backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Ionicons name="add-circle" size={20} color={selectedPalette.primary} />
                <Text style={[styles.addLinkText, { color: selectedPalette.primary }]}>
                  Add Social Link
                </Text>
              </TouchableOpacity>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert {...alertProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Outfit-Bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: "Outfit-Regular",
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    fontFamily: "Outfit-Regular",
  },
  characterCount: {
    fontSize: 12,
    fontFamily: "Outfit-Regular",
    textAlign: "right",
    marginTop: 6,
  },
  photoCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoContainer: {
    alignItems: "center",
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: 'hidden',
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  removeTextButton: {
    marginTop: 12,
    padding: 4,
  },
  removePhotoText: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
  },
  socialList: {
    gap: 12,
    marginBottom: 16,
  },
  socialLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconContainer: {
    marginRight: 10,
  },
  socialUrlInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    fontFamily: "Outfit-Regular",
  },
  removeLinkButton: {
    padding: 8,
  },
  addLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  addLinkText: {
    fontSize: 15,
    fontFamily: "Outfit-Medium",
  },
  photoOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  removePhotoText: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
  },
});
