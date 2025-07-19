"use server";

import { requireAuth } from "@/lib/auth";
import { databaseServer } from "@/lib/database";
import { updateProfileSchema, type UpdateProfileFormData } from "@/lib/validations";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/constants";
import { revalidatePath } from "next/cache";

// Server action for updating user profile
export async function updateProfileAction(formData: FormData) {
  try {
    // Ensure user is authenticated
    const user = await requireAuth();

    const data: UpdateProfileFormData = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      avatarUrl: formData.get("avatarUrl") as string,
    };

    // Validate form data
    const validatedData = updateProfileSchema.parse(data);
    
    // Update profile in database
    const updatedProfile = await databaseServer.updateProfile(user.id, {
      full_name: validatedData.fullName,
      email: validatedData.email,
      avatar_url: validatedData.avatarUrl,
    });

    if (!updatedProfile) {
      return {
        error: "Failed to update profile",
        success: false,
      };
    }

    // Revalidate the profile page
    revalidatePath("/profile");

    return {
      success: true,
      message: SUCCESS_MESSAGES.PROFILE.UPDATE,
      data: updatedProfile,
    };
  } catch (error: any) {
    return {
      error: error.errors?.[0]?.message || ERROR_MESSAGES.GENERIC,
      success: false,
    };
  }
}

// Server action for getting user profile
export async function getUserProfileAction() {
  try {
    // Ensure user is authenticated
    const user = await requireAuth();

    // Get profile from database
    const profile = await databaseServer.getProfile(user.id);

    if (!profile) {
      // Create profile if it doesn't exist
      const newProfile = await databaseServer.createProfile(user);
      return {
        success: true,
        data: newProfile,
      };
    }

    return {
      success: true,
      data: profile,
    };
  } catch (error: any) {
    return {
      error: ERROR_MESSAGES.GENERIC,
      success: false,
    };
  }
}

// Server action for deleting user account
export async function deleteAccountAction() {
  try {
    // Ensure user is authenticated
    const user = await requireAuth();

    // Delete profile from database
    const deleted = await databaseServer.deleteProfile(user.id);

    if (!deleted) {
      return {
        error: "Failed to delete account",
        success: false,
      };
    }

    return {
      success: true,
      message: "Account deleted successfully",
    };
  } catch (error: any) {
    return {
      error: ERROR_MESSAGES.GENERIC,
      success: false,
    };
  }
}
