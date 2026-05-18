<div align="center">

# 🌱 AgriGov Mobile

**Cross-platform mobile app for Algeria's agricultural services — built with React Native (Expo) & Django REST API.**

[![React Native](https://img.shields.io/badge/React_Native-Expo-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![Django](https://img.shields.io/badge/Backend-Django_REST-092E20?style=flat-square&logo=django)](https://www.django-rest-framework.org/)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-lightgrey?style=flat-square&logo=android)](https://reactnative.dev/)
[![Author](https://img.shields.io/badge/Author-BenhamadaKhalil-green?style=flat-square&logo=github)](https://github.com/BenhamadaKhalil)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Installation](#-installation) · [Running the App](#-running-the-app) · [Backend Setup](#-backend-setup-django) · [Project Structure](#-project-structure) · [Troubleshooting](#-troubleshooting)

</div>

---

## 📖 Overview

AgriGov Mobile is the companion mobile application to the [AGRIGOV-MARKET](https://github.com/BenhamadaKhalil/agrigov-market) platform. It gives Algerian farmers, buyers and stakeholders on-the-go access to agricultural services directly from their smartphones — with a clean UI, real-time data sync, and support for both Arabic and English.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Secure login and registration |
| 🌐 **API Integration** | Seamless connection to Django REST backend |
| 🔄 **Real-time Sync** | Live data updates from the backend |
| 🌍 **Multi-language** | Arabic & English support (EN / AR) |
| 📱 **Responsive UI** | Clean, cross-platform interface for Android & iOS |
| ⚡ **Expo Powered** | Fast builds and over-the-air updates |

---

## 📸 App Preview

> Screenshots coming soon — contributions welcome!

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Mobile Framework** | React Native (Expo) |
| **Language** | JavaScript / TypeScript |
| **API Client** | Axios |
| **Backend** | Django + Django REST Framework |
| **Auth** | JWT via Django REST Framework SimpleJWT |

---

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/BenhamadaKhalil/agrigov-mobile.git
cd agrigov-mobile
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure the backend URL

Open your API config file (e.g. `services/api.js`) and set your local machine's IP address:

```js
// ❌ Do NOT use localhost — it won't work on a physical device
const BASE_URL = 'http://127.0.0.1:8000';

// ✅ Use your machine's local network IP instead
const BASE_URL = 'http://192.168.x.x:8000';
```

> **Find your IP:**
> ```bash
> ipconfig    # Windows
> ifconfig    # macOS / Linux
> ```

---

## ▶️ Running the App

### Start Expo dev server

```bash
npx expo start
```

This opens Expo DevTools in your browser with a QR code.

### Run on a physical device — Expo Go (recommended)

1. Install **Expo Go** on your phone:
   - Android → [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS → [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Make sure your phone and computer are on the **same Wi-Fi network**

3. Scan the QR code:
   - Android → scan from inside the Expo Go app
   - iOS → scan with the default Camera app

### Run on an emulator

| Platform | Steps |
|---|---|
| **Android** | Install [Android Studio](https://developer.android.com/studio), launch a virtual device, then press `a` in the Expo terminal |
| **iOS** *(Mac only)* | Install [Xcode](https://developer.apple.com/xcode/), then press `i` in the Expo terminal |

---

## 🔗 Backend Setup (Django)

Make sure the Django server is reachable from your device by binding to all interfaces:

```bash
cd server/Agrigov
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
python manage.py runserver 0.0.0.0:8000
```

> Your API will be available at `http://192.168.x.x:8000` on your local network.

---

## 📁 Project Structure

```
agrigov-mobile/
├── assets/              # Images, fonts and static files
├── components/          # Reusable UI components
├── screens/             # App screens (Home, Login, Register, ...)
├── services/            # Axios API client and request helpers
├── navigation/          # React Navigation stack & tab config
├── App.js               # Application entry point
└── app.json             # Expo configuration
```

---

## 🧪 Troubleshooting

**Cannot connect to backend**
- Verify you're using your machine's local IP, not `localhost` or `127.0.0.1`
- Confirm both devices are on the same Wi-Fi network
- Allow port `8000` through your firewall

**Expo not loading / stuck**
```bash
npx expo start --clear
```

**Metro bundler error**
```bash
npx expo start --reset-cache
```

**Android emulator network error**
- Use `http://10.0.2.2:8000` instead of your local IP when running on an Android emulator

---

## 🗺 Roadmap

- [ ] Advanced agricultural service pages
- [ ] Farmer & buyer dashboards
- [ ] Push notifications (Expo Notifications)
- [ ] Full Arabic RTL layout
- [ ] Offline mode with local caching
- [ ] AI-powered crop recommendations
- [ ] Payment integration (CIB / Dahabia)

---

## 👨‍💻 Author

**Khalil Benhamada** — React Native & Django Developer

[![GitHub](https://img.shields.io/badge/GitHub-BenhamadaKhalil-181717?style=flat-square&logo=github)](https://github.com/BenhamadaKhalil)

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome! Feel free to open an [issue](../../issues) or submit a pull request.

1. Fork the repository
2. Create your branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Part of the <a href="https://github.com/BenhamadaKhalil/agrigov-market">AGRIGOV-MARKET</a> ecosystem · Built with ❤️ for Algerian agriculture 🇩🇿</sub>
</div>