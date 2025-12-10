"use client";

import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, FileText, Sun, Cloud, CloudRain, Moon } from "lucide-react";
import { ChatInputArea } from "../input/ChatInputArea";
import { useRef, useState, useEffect } from "react";

interface WelcomeScreenProps {
  onSendMessage: (content: string, files?: File[]) => void;
  isLoading?: boolean;
}

interface WeatherData {
  temp: number;
  condition: "sunny" | "cloudy" | "rainy";
  location: string;
}

const suggestions = [
  {
    icon: Upload,
    title: "Upload gambar station list",
    description: "Paste screenshot atau upload foto",
  },
  {
    icon: FileSpreadsheet,
    title: "Upload Excel RFQ",
    description: "File .xlsx dengan daftar station",
  },
  {
    icon: FileText,
    title: "Upload PDF Spec",
    description: "Dokumen spesifikasi produk",
  },
];

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return { text: "Selamat Pagi", emoji: "🌅" };
  } else if (hour >= 11 && hour < 15) {
    return { text: "Selamat Siang", emoji: "☀️" };
  } else if (hour >= 15 && hour < 18) {
    return { text: "Selamat Sore", emoji: "🌇" };
  } else {
    return { text: "Selamat Malam", emoji: "🌙" };
  }
}

function WeatherIcon({ condition }: { condition: string }) {
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 18;

  if (condition === "rainy") return <CloudRain className="h-5 w-5 text-blue-500" />;
  if (condition === "cloudy") return <Cloud className="h-5 w-5 text-slate-400" />;
  if (isNight) return <Moon className="h-5 w-5 text-indigo-400" />;
  return <Sun className="h-5 w-5 text-yellow-500" />;
}

export function WelcomeScreen({ onSendMessage, isLoading }: WelcomeScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [greeting, setGreeting] = useState(getGreeting());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch weather (using free API)
  useEffect(() => {
    async function fetchWeather() {
      try {
        // Try to get user's location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
              );
              const data = await response.json();

              // Map weather code to condition
              const code = data.current?.weather_code || 0;
              let condition: "sunny" | "cloudy" | "rainy" = "sunny";
              if (code >= 61 && code <= 67) condition = "rainy";
              else if (code >= 1 && code <= 48) condition = "cloudy";

              setWeather({
                temp: Math.round(data.current?.temperature_2m || 28),
                condition,
                location: "Lokasi Anda"
              });
            },
            () => {
              // Fallback: Jakarta weather
              setWeather({ temp: 30, condition: "sunny", location: "Jakarta" });
            }
          );
        } else {
          setWeather({ temp: 30, condition: "sunny", location: "Jakarta" });
        }
      } catch {
        setWeather({ temp: 30, condition: "sunny", location: "Jakarta" });
      }
    }
    fetchWeather();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full text-center"
        >
          {/* Greeting & Weather */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center justify-center gap-4 mb-2">
              <span className="text-4xl">{greeting.emoji}</span>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                {greeting.text}!
              </h1>
            </div>

            {/* Weather & Time */}
            <div className="flex items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
              <span className="text-sm">
                {currentTime.toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </span>
              {weather && (
                <>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5">
                    <WeatherIcon condition={weather.condition} />
                    <span className="text-sm font-medium">{weather.temp}°C</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 dark:text-slate-400 mb-8"
          >
            Upload gambar, Excel, atau PDF untuk menganalisis station list dan mencari model serupa
          </motion.p>

          {/* Suggestion Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <suggestion.icon className="h-8 w-8 text-blue-500 mb-3 mx-auto" />
                <h3 className="font-medium text-slate-800 dark:text-white mb-1">{suggestion.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{suggestion.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Hidden file input for suggestion cards */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.xlsx,.xls,.pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) {
                onSendMessage("Menganalisis file yang diupload...", files);
              }
            }}
          />
        </motion.div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <ChatInputArea
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          placeholder="Ketik pesan, paste gambar (Ctrl+V), atau drag & drop file..."
        />
      </motion.div>
    </div>
  );
}
