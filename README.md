# Healthcare Assistant Web Application

A comprehensive healthcare web application that provides various medical assistance features to help users manage their health and get quick medical insights.

## 🌟 Features

- **Disease Prediction**: AI-powered disease prediction based on symptoms
- **Symptom Checker**: Interactive symptom assessment tool
- **Health Chat**: Real-time chat interface for medical queries powered by Gemini AI
- **Medication Management**: Track and manage your medications
- **User Authentication**: Secure login and registration system
- **CAPTCHA Security**: Enhanced security with CAPTCHA verification
- **Responsive Design**: Works seamlessly across all devices

## 🚀 Tech Stack

This project is built with modern technologies:

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Backend Services**: Supabase
- **AI Integration**: Google's Gemini AI
- **Authentication**: Supabase Auth

## 💻 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or Bun package manager
- Supabase account for backend services

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd HCI-Project
```

2. Install dependencies:
```bash
# Using npm
npm install

# Using Bun
bun install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
# or
bun run dev
```

Visit `http://localhost:5173` to see the application running.

## 📁 Project Structure

- `/src` - Main application source code
  - `/components` - Reusable UI components
  - `/contexts` - React context providers
  - `/hooks` - Custom React hooks
  - `/integrations` - Third-party service integrations
  - `/pages` - Application pages/routes
  - `/lib` - Utility functions and configurations

## 🔒 Security Features

- Secure authentication using Supabase
- CAPTCHA verification for enhanced security
- Protected routes and API endpoints
- Secure data storage and transmission

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 📧 Contact

For any queries or support, please open an issue in the repository.

- email: cs22b1061@iiitdm.ac.in
- phone: 6301179024
