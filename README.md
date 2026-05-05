# 🔍 LostAF — Lost & Found Platform

**LostAF** is a community-driven lost and found web application built with React and Firebase. Users can report lost or found items, browse reports, send claims, chat with report owners, and track the status of their items — all in one place.

---

## ✨ Features

- 🔐 **Authentication** — Email/password sign-up & login with email verification
- 📋 **Report System** — Post lost or found item reports with images, location, and descriptions
- 🔎 **Search & Filter** — Browse and filter reports by category, status, location, and more
- 💬 **Real-time Chat** — In-app messaging between claimants and report owners
- 🙋 **Claims Management** — Submit and manage claims on found items
- ✅ **Report Resolution** — Mark reports as resolved once the item is returned
- 👤 **User Profiles** — Edit profile, view your reports and claim history
- 📤 **Image Uploads** — Cloudinary-powered image upload for item photos
- 📧 **Email Notifications** — Automated email alerts via EmailJS for claims and messages
- 🔗 **Share Reports** — Copy shareable links to any item report

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7 |
| Backend / DB | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Cloudinary |
| Email | EmailJS |
| Styling | Vanilla CSS |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/RitamDutta54/LostAF.git
cd LostAF

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

You will also need to configure Firebase. Update `src/firebase.js` with your own Firebase project credentials.

### Running the App

```bash
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
src/
├── components/
│   ├── BottomNav.jsx       # Mobile bottom navigation bar
│   ├── FloatingIcons.jsx   # Floating action icons
│   └── ProtectedRoute.jsx  # Auth-guarded routes
├── pages/
│   ├── Landing.jsx         # Landing / welcome page
│   ├── Login.jsx           # Login page
│   ├── SignUp.jsx          # Sign-up page
│   ├── VerifyEmail.jsx     # Email verification gate
│   ├── Home.jsx            # Main feed of reports
│   ├── Search.jsx          # Search & filter reports
│   ├── Report.jsx          # Create a new report
│   ├── ReportDetail.jsx    # View report details & claim
│   ├── Messages.jsx        # Inbox / conversations list
│   ├── ChatThread.jsx      # Individual chat thread
│   └── Profile.jsx         # User profile & settings
├── App.jsx                 # Root component & routing
├── firebase.js             # Firebase configuration
├── styles.css              # Global styles
└── theme.js                # Theme tokens & constants
```

---

## 📸 Screenshots

> Coming soon.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
