# NutriTrack — AI-Powered Calorie Tracker

A full-stack MERN calorie tracking application with **Google Gemini AI** for meal analysis and a smart chatbot. Users can log meals via text or image, and Gemini automatically analyzes the nutritional content (calories, protein, carbs, fat).

## Features

- 📸 **AI Image Analysis**: Upload a picture of your food and let AI calculate the calories and macros.
- ✍️ **Natural Language Logging**: Type what you ate (e.g., "2 chapatis and a bowl of dal") and get instant nutritional breakdown.
- 🤖 **Context-Aware Chatbot**: Chat with NutriBot to get meal suggestions based on your remaining daily calorie budget.
- 📊 **Analytics Dashboard**: Track your 7-day intake with dynamic bar charts and macro distribution donuts.
- 👤 **Personalized Goals**: Automatically calculates your BMR (Basal Metabolic Rate) and TDEE based on your profile.
- 🎨 **Premium UI**: Modern dark theme with glassmorphism, responsive design, and smooth animations.

## Tech Stack

**Frontend:** React (Vite), Vanilla CSS, React Router, Axios  
**Backend:** Node.js, Express.js, MongoDB (Mongoose)  
**AI Integration:** Google Gemini API ('gemini-3.5-flash' model)  
**Authentication:** JWT (JSON Web Tokens) & bcrypt  

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas)
- [Google Gemini API Key](https://aistudio.google.com/apikey) (Free)

## Setup Instructions

### 1. Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the example:
   ```bash
   # Add your MongoDB URI, a JWT secret, and your Gemini API Key
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000`.

### 2. Frontend Setup

1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The client will run on `http://localhost:5173`.

## Usage Guide

1. **Sign Up**: Create an account by providing your physical stats. The app will calculate your daily calorie goal.
2. **Dashboard Overview**: View your daily progress, macros, and remaining calorie budget.
3. **Log Meal**: Go to the "Log Meal" tab to enter text or upload an image of your food.
4. **Chatbot**: Click the floating action button in the bottom right to talk to the AI nutritionist.
5. **Analytics**: Review your progress over the last 7 days.

## Notes

- Uploaded images are stored locally in `server/uploads/`. In a production environment, you should use cloud storage like AWS S3 or Cloudinary.
- The Gemini model used is `gemini-1.5-flash`. The prompt engineering is tuned to return JSON formatting for seamless integration.

## License

MIT License
