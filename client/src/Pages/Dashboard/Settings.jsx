import { useState, useEffect } from "react";
import { 
  Save, 
  User, 
  Lock, 
  Bell, 
  Building, 
  Globe, 
  Mail, 
  Shield 
} from "lucide-react";
import { useUser } from "../../UserContext";
import apiService from "../../services/api";

function Settings() {
  const { user, setUser } = useUser();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });

  const [hotelData, setHotelData] = useState({
    name: "",
    address: "",
    contactEmail: "",
    phone: "",
    currency: "USD ($)",
    timezone: "America/New_York",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    newBookings: true,
    cancellations: true,
    weeklyReports: false,
  });

  useEffect(() => {
    fetchHotelSettings();
    fetchUserNotifications();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({ 
        username: user.username || "",
        email: user.email || "",
      });
      if (user.notificationPrefs) {
        setNotifications({
          emailAlerts: user.notificationPrefs.emailAlerts !== undefined ? user.notificationPrefs.emailAlerts : true,
          newBookings: user.notificationPrefs.newBookings !== undefined ? user.notificationPrefs.newBookings : true,
          cancellations: user.notificationPrefs.cancellations !== undefined ? user.notificationPrefs.cancellations : true,
          weeklyReports: user.notificationPrefs.weeklyReports !== undefined ? user.notificationPrefs.weeklyReports : false,
        });
      }
    }
  }, [user]);

  const fetchUserNotifications = async () => {
    try {
      if (user?.id) {
        const userData = await apiService.getUser(user.id);
        if (userData && userData.notificationPrefs) {
          setNotifications({
            emailAlerts: userData.notificationPrefs.emailAlerts !== undefined ? userData.notificationPrefs.emailAlerts : true,
            newBookings: userData.notificationPrefs.newBookings !== undefined ? userData.notificationPrefs.newBookings : true,
            cancellations: userData.notificationPrefs.cancellations !== undefined ? userData.notificationPrefs.cancellations : true,
            weeklyReports: userData.notificationPrefs.weeklyReports !== undefined ? userData.notificationPrefs.weeklyReports : false,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch notification preferences:", err);
    }
  };

  const fetchHotelSettings = async () => {
    try {
      const settings = await apiService.getHotelSettings();
      if (settings) {
        setHotelData({
          name: settings.name || "",
          address: settings.address || "",
          contactEmail: settings.contactEmail || "",
          phone: settings.phone || "",
          currency: settings.currency || "USD ($)",
          timezone: settings.timezone || "America/New_York",
        });
      }
    } catch (err) {
      console.error("Failed to fetch hotel settings:", err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (activeTab === "profile") {
        // Update username and email
        const response = await apiService.updateUser(user.id, { 
          username: profileData.username,
          email: profileData.email || null,
        });
        
        // Update user context and localStorage with new data
        if (response && response.user) {
          const newUserData = {
            id: user.id,
            username: response.user.username,
            email: response.user.email,
            role: user.role, // Keep existing role
            notificationPrefs: response.user.notificationPrefs || user.notificationPrefs,
          };
          setUser(newUserData);
          localStorage.setItem("user", JSON.stringify(newUserData));
          // Also update profileData state to reflect saved values
          setProfileData({
            username: response.user.username,
            email: response.user.email || "",
          });
        } else {
          // Fallback: update with what we sent if response structure is different
          const newUserData = {
            ...user,
            username: profileData.username,
            email: profileData.email || null,
          };
          setUser(newUserData);
          localStorage.setItem("user", JSON.stringify(newUserData));
        }
        
        setSuccessMsg("Profile updated successfully!");
      } else if (activeTab === "hotel") {
        // Update hotel settings
        await apiService.updateHotelSettings(hotelData);
        setSuccessMsg("Hotel settings saved successfully!");
      } else if (activeTab === "security") {
        // Change password
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
          setErrorMsg("Please fill in all password fields");
          setLoading(false);
          return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setErrorMsg("New passwords do not match");
          setLoading(false);
          return;
        }
        if (passwordData.newPassword.length < 6) {
          setErrorMsg("New password must be at least 6 characters");
          setLoading(false);
          return;
        }
        if (passwordData.currentPassword === passwordData.newPassword) {
          setErrorMsg("New password must be different from current password");
          setLoading(false);
          return;
        }
        
        try {
          const response = await apiService.changePassword(
            user.id,
            passwordData.currentPassword,
            passwordData.newPassword
          );
          
          if (response && response.message) {
            setSuccessMsg("Password changed successfully! Please login again with your new password.");
            setPasswordData({
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
          } else {
            setSuccessMsg("Password changed successfully!");
            setPasswordData({
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
          }
        } catch (err) {
          // Handle specific error messages from the API
          const errorMessage = err?.response?.data?.error || err?.message || "Failed to change password. Please check your current password.";
          setErrorMsg(errorMessage);
          setLoading(false);
          return;
        }
      } else if (activeTab === "notifications") {
        // Save notification preferences to backend
        const response = await apiService.updateUser(user.id, {
          notificationPrefs: notifications,
        });
        
        // Update user context with new notification preferences
        if (response && response.user) {
          const newUserData = {
            ...user,
            notificationPrefs: response.user.notificationPrefs || notifications,
          };
          setUser(newUserData);
          localStorage.setItem("user", JSON.stringify(newUserData));
        } else {
          // Fallback: update with what we sent
          const newUserData = {
            ...user,
            notificationPrefs: notifications,
          };
          setUser(newUserData);
          localStorage.setItem("user", JSON.stringify(newUserData));
        }
        
        setSuccessMsg("Notification preferences saved successfully!");
      }

      setTimeout(() => {
        setSuccessMsg("");
        setLoading(false);
      }, 3000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to save settings");
      setLoading(false);
      setTimeout(() => setErrorMsg(""), 5000);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User size={18} /> },
    { id: "hotel", label: "Hotel Info", icon: <Building size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "security", label: "Security", icon: <Shield size={18} /> },
  ];

  return (
    <div className="p-4 sm:p-10 min-h-screen bg-slate-950 text-slate-100">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold mb-2 text-white">Settings</h2>
        <p className="text-slate-400">
          Manage your account settings and hotel preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-colors ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white border-l-4 border-indigo-300"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white border-l-4 border-transparent"
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-6 sm:p-8">
            
            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                {errorMsg}
              </div>
            )}

            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <User className="text-indigo-400" size={24} />
                  Profile Information
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        placeholder="admin@example.com"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hotel Settings */}
            {activeTab === "hotel" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Building className="text-indigo-400" size={24} />
                  Hotel Details
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Hotel Name
                    </label>
                    <input
                      type="text"
                      value={hotelData.name}
                      onChange={(e) => setHotelData({...hotelData, name: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Address
                    </label>
                    <textarea
                      value={hotelData.address}
                      onChange={(e) => setHotelData({...hotelData, address: e.target.value})}
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={hotelData.contactEmail}
                        onChange={(e) => setHotelData({...hotelData, contactEmail: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={hotelData.phone}
                        onChange={(e) => setHotelData({...hotelData, phone: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Currency
                      </label>
                      <select
                        value={hotelData.currency}
                        onChange={(e) => setHotelData({...hotelData, currency: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      >
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                        <option>JPY (¥)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Timezone
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 text-slate-500" size={18} />
                        <select
                          value={hotelData.timezone}
                          onChange={(e) => setHotelData({...hotelData, timezone: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        >
                          <option>America/New_York</option>
                          <option>Europe/London</option>
                          <option>Europe/Belgrade</option>
                          <option>Asia/Tokyo</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Bell className="text-indigo-400" size={24} />
                  Notifications Preferences
                </h3>
                
                <div className="space-y-4">
                  {[
                    { key: "emailAlerts", label: "Email Alerts", desc: "Receive important system alerts via email" },
                    { key: "newBookings", label: "New Booking Notifications", desc: "Get notified when a new booking is made" },
                    { key: "cancellations", label: "Cancellation Alerts", desc: "Get notified when a booking is cancelled" },
                    { key: "weeklyReports", label: "Weekly Reports", desc: "Receive a weekly summary of hotel performance" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-800">
                      <div>
                        <h4 className="text-white font-medium">{item.label}</h4>
                        <p className="text-slate-400 text-sm">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notifications[item.key]} 
                          onChange={() => setNotifications({...notifications, [item.key]: !notifications[item.key]})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Shield className="text-indigo-400" size={24} />
                  Security
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-medium mb-4">Change Password</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          placeholder="Enter current password"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          placeholder="Enter new password (min 6 characters)"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          placeholder="Confirm new password"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end gap-3">
              <button className="px-6 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors font-medium shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
