# 🌱 AgriGov Mobile

AgriGov Mobile is a cross-platform mobile application built with **React Native (Expo)** that helps users access agricultural services بسهولة وفعالية.
It connects seamlessly to a **Django REST API backend** for authentication, data management, and real-time interactions.

---

## ✨ Features

* 🔐 Secure authentication (Login / Register)
* 📱 Clean, responsive, and user-friendly UI
* 🌐 Seamless integration with Django REST API
* ⚡ Fast development using Expo
* 🔄 Real-time data sync with backend
* 🌍 Ready for multi-language support (EN / AR)

---

## 🛠️ Tech Stack

* **Frontend:** React Native (Expo)
* **Backend:** Django + Django REST Framework
* **Networking:** Axios / Fetch API

---

## 📸 App Preview (optional)

> Add screenshots here later for better presentation 🚀

---

## 📦 Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/BenhamadaKhalil/agrigov-mobile.git
cd agrigov-mobile
```

---

### 2️⃣ Install dependencies

```bash
npm install
```

or

```bash
yarn install
```

---

## ▶️ Running the App

### Start Expo

```bash
npx expo start
```

This will open Expo DevTools in your browser.

---

## 📱 Run on a Physical Device

### ✅ Using Expo Go (Recommended)

1. Install Expo Go:

   * Android → [https://play.google.com/store/apps/details?id=host.exp.exponent](https://play.google.com/store/apps/details?id=host.exp.exponent)
   * iOS → [https://apps.apple.com/app/expo-go/id982107779](https://apps.apple.com/app/expo-go/id982107779)

2. Ensure your phone and computer are on the **same Wi-Fi network**

3. Scan the QR code:

   * Android → via Expo Go
   * iOS → via Camera app

---

## ⚠️ Backend Connection (Important)

If you're running Django locally, **DO NOT use**:

```js
http://127.0.0.1:8000
```

Instead, use your machine’s local IP:

```js
http://192.168.x.x:8000
```

### 🔍 Find your IP:

```bash
ipconfig     # Windows
ifconfig     # Mac/Linux
```

---

## 💻 Run on Emulator

### Android

* Install Android Studio
* Launch emulator
* Press `a` in Expo terminal

### iOS (Mac only)

* Install Xcode
* Press `i` in Expo terminal

---

## 🔗 Backend Setup (Django)

Make sure your backend is running:

```bash
python manage.py runserver 0.0.0.0:8000
```

---

## 📁 Project Structure

```
/components      # Reusable UI components
/screens         # App screens
/services        # API calls (Axios)
/assets          # Images & static files
App.js           # Entry point
```

---

## 🧪 Troubleshooting

**❌ Cannot connect to backend**
→ Check IP address & same Wi-Fi network

**❌ Expo not loading**

```bash
npx expo start --clear
```

**❌ Network error**
→ Disable firewall or allow port `8000`

---

## 🚀 Future Improvements

* 🌾 Advanced agricultural services
* 📊 Dashboard & analytics
* 🔔 Push notifications
* 🌍 Full multi-language support
* 🤖 AI-powered recommendations

---

## 👨‍💻 Author

**Khalil Benhamada**
React Native & Django Developer

🔗 GitHub: [https://github.com/BenhamadaKhalil](https://github.com/BenhamadaKhalil)

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub — it helps a lot!
