/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/Components/Navbar/Navbar";
import Footer from "@/Components/Footer/Footer";
import { getProfile, updateProfile } from "@/lib/api";
import { UserCircle, Trash2 } from "lucide-react";
import Image from "next/image";

type User = {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Check if we have a token in localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/Login");
          return;
        }

        const response = await getProfile();
        setUser(response.data);
        setFormData({
          name: response.data.name,
        });
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        // Redirect to login if unauthorized
        if (
          error instanceof Error &&
          error.message.includes("authentication")
        ) {
          router.push("/Login");
        } else {
          setError("Failed to load profile data. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      // Check file type
      if (!selectedFile.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }

      setFile(selectedFile);
      setRemovePhoto(false);

      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleRemovePhoto = () => {
    setFile(null);
    setImagePreview(null);
    setRemovePhoto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (!formData.name.trim()) {
        setError("Name cannot be empty");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);

      if (file) {
        formDataToSend.append("profilePicture", file);
      }

      if (removePhoto) {
        formDataToSend.append("removeProfilePicture", "true");
      }

      const response = await updateProfile(formDataToSend);
      setUser(response.data);
      setSuccess("Profile updated successfully!");

      // Update user in localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const updatedUser = {
          ...userData,
          name: response.data.name,
          profilePicture: response.data.profilePicture,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      if (error instanceof Error) {
        setError(
          `Failed to update profile: ${error.message || "Please try again"}`
        );
      } else {
        setError("Failed to update profile. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 min-h-screen flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your profile...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-16 min-h-screen">
        <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-100 text-red-700 p-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-100 text-green-700 p-3 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-8 flex flex-col items-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-purple-200 mb-4">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Profile Preview"
                      className="object-cover w-full h-full"
                      width={128}
                      height={128}
                    />
                  ) : user?.profilePicture &&
                    user.profilePicture !== "default" &&
                    !removePhoto ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.profilePicture}`}
                      alt={user.name}
                      className="object-cover w-full h-full"
                      width={128}
                      height={128}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `/default-avatar.svg`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Image
                        src="/default-avatar.svg"
                        alt="Default Avatar"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <label className="cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {(user?.profilePicture || imagePreview) && !removePhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Remove Photo
                    </button>
                  )}
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Upload an image (max 5MB). Allowed formats: JPG, PNG, GIF.
                </p>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="name"
                  className="block mb-2 text-sm font-medium text-gray-800"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-800"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={user?.email || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed text-gray-900"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email address cannot be changed
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
