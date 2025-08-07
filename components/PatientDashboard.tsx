
'use client';

import { useState, useEffect } from 'react';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
  takenAt?: string;
  frequency: 'daily' | 'weekly' | 'as-needed';
  instructions?: string;
}

interface PatientDashboardProps {
  userEmail: string;
  gender: 'male' | 'female';
  onLogout: () => void;
}

export default function PatientDashboard({ userEmail, gender, onLogout }: PatientDashboardProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastCompletedMedicine, setLastCompletedMedicine] = useState<string>('');

  // FIXED data loading with proper error handling
  const loadData = () => {
    try {
      const savedMedicines = localStorage.getItem(`medicines_${userEmail}`);
      if (savedMedicines && savedMedicines !== 'undefined' && savedMedicines !== 'null') {
        const parsedMedicines = JSON.parse(savedMedicines);
        if (Array.isArray(parsedMedicines)) {
          setMedicines(parsedMedicines);
        }
      }
    } catch (error) {
      console.error('Error loading medicines:', error);
      setMedicines([]);
    }
  };

  useEffect(() => {
    // Load data immediately
    loadData();

    // Update time every second and check for data changes
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      loadData(); // Reload data every second to stay synced
    }, 1000);

    // Load data when page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    // Listen for localStorage changes from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `medicines_${userEmail}`) {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userEmail]);

  const markAsTaken = (medicineId: string) => {
    const now = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const medicine = medicines.find(m => m.id === medicineId);
    if (medicine) {
      setLastCompletedMedicine(medicine.name);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    }

    const updatedMedicines = medicines.map(medicine =>
      medicine.id === medicineId
        ? { ...medicine, taken: true, takenAt: now }
        : medicine
    );

    setMedicines(updatedMedicines);

    // Save to localStorage immediately with error handling
    try {
      const dataToSave = JSON.stringify(updatedMedicines);
      localStorage.setItem(`medicines_${userEmail}`, dataToSave);
      console.log(`✅ Marked ${medicine?.name} as taken at ${now}`);

      // Force trigger storage event for same-tab updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: `medicines_${userEmail}`,
        newValue: dataToSave,
        oldValue: localStorage.getItem(`medicines_${userEmail}`)
      }));
    } catch (error) {
      console.error('Error saving medicines:', error);
      alert('Error saving your progress. Please try again.');
    }
  };

  const todaysTaken = medicines.filter(m => m.taken).length;
  const totalMedicines = medicines.length;
  const upcomingMedicines = medicines.filter(m => !m.taken);
  const completedMedicines = medicines.filter(m => m.taken);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    const genderPrefix = gender === 'male' ? 'Mr.' : 'Mrs.';
    if (hour < 12) return `Good Morning, ${genderPrefix}`;
    if (hour < 17) return `Good Afternoon, ${genderPrefix}`;
    return `Good Evening, ${genderPrefix}`;
  };

  const getMotivationalMessage = () => {
    const progress = totalMedicines > 0 ? (todaysTaken / totalMedicines) * 100 : 0;

    if (progress === 100) return "🌟 Perfect! You've taken all your medicines today! 🌟";
    if (progress >= 75) return "🎯 You're doing great! Almost finished for today!";
    if (progress >= 50) return "💪 Keep going! You're more than halfway done!";
    if (progress >= 25) return "👍 Good start! Remember to take the rest of your medicines!";
    return "📋 Time to start taking your medicines for today!";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Success Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-lg mx-4 border-4 border-green-400">
            <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <i className="ri-check-fill text-6xl text-white"></i>
            </div>
            <h3 className="text-5xl font-bold text-gray-800 mb-6">Excellent! 🎉</h3>
            <p className="text-3xl text-gray-700 mb-4">
              You took your
            </p>
            <p className="text-4xl font-bold text-green-600 mb-6">
              {lastCompletedMedicine}
            </p>
            <div className="bg-green-100 rounded-2xl p-6 border-4 border-green-300">
              <p className="text-2xl text-green-800 font-bold">
                Way to go! Keep up the great work! 💪
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Header with Live Time */}
      <div className="bg-blue-500 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-6xl font-bold mb-4">My Medicines</h1>
              <p className="text-3xl mb-2">{getGreeting()}</p>
              <div className="bg-blue-400 rounded-2xl px-6 py-3 inline-block">
                <p className="text-2xl font-bold" suppressHydrationWarning={true}>
                  🕐 {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500 text-white text-2xl font-bold px-8 py-4 rounded-2xl hover:bg-red-600 cursor-pointer whitespace-nowrap"
            >
              Logout
            </button>
          </div>

          {/* Motivational Message */}
          <div className="bg-blue-400 rounded-3xl p-6 text-center">
            <p className="text-2xl font-bold">
              {getMotivationalMessage()}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        {/* Enhanced Progress Section */}
        <div className="bg-blue-50 rounded-3xl p-10 mb-10 text-center border-4 border-blue-200 shadow-lg">
          <h2 className="text-5xl font-bold text-gray-800 mb-6">Today's Progress</h2>
          <div className="text-8xl font-bold text-blue-600 mb-6">
            {todaysTaken} of {totalMedicines}
          </div>
          <p className="text-4xl text-gray-600 mb-8">medicines taken</p>

          {totalMedicines > 0 && (
            <div className="w-full bg-gray-300 rounded-full h-10 mb-6">
              <div
                className="bg-green-500 h-10 rounded-full transition-all duration-1000 flex items-center justify-end pr-4"
                style={{ width: `${Math.max(10, (todaysTaken / totalMedicines) * 100)}%` }}
              >
                <span className="text-white font-bold text-lg">
                  {Math.round((todaysTaken / totalMedicines) * 100)}%
                </span>
              </div>
            </div>
          )}

          {todaysTaken === totalMedicines && totalMedicines > 0 && (
            <div className="bg-green-100 rounded-3xl p-8 border-4 border-green-300">
              <p className="text-5xl font-bold text-green-700 mb-4">🌟 ALL DONE TODAY! 🌟</p>
              <p className="text-2xl text-green-600">You're taking great care of your health!</p>
            </div>
          )}
        </div>

        {/* No Medicines Message - Enhanced */}
        {totalMedicines === 0 ? (
          <div className="bg-gray-50 rounded-3xl p-12 text-center border-4 border-gray-200 shadow-lg">
            <div className="w-40 h-40 flex items-center justify-center mx-auto mb-8 bg-gray-200 rounded-full">
              <i className="ri-medicine-bottle-fill text-8xl text-gray-400"></i>
            </div>
            <h3 className="text-5xl font-bold text-gray-800 mb-8">No Medicines Yet</h3>
            <p className="text-3xl text-gray-600 mb-10 leading-relaxed">
              Ask your family member to add your medicines using the caregiver account.
            </p>
            <div className="bg-blue-100 rounded-3xl p-8 border-4 border-blue-300">
              <p className="text-3xl text-blue-800 font-bold mb-4">
                💡 What your family will do:
              </p>
              <div className="space-y-4 text-2xl text-blue-700">
                <p>• Add your medicine schedule</p>
                <p>• Set up phone call reminders</p>
                <p>• Help you track your progress</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Medicines to Take - EXTRA LARGE AND CLEAR */}
            {upcomingMedicines.length > 0 && (
              <div className="mb-12">
                <h3 className="text-6xl font-bold text-red-600 mb-10 text-center">
                  ⏰ TAKE THESE MEDICINES NOW
                </h3>
                <div className="bg-red-100 rounded-3xl p-6 mb-8 text-center border-4 border-red-300">
                  <p className="text-4xl font-bold text-red-800">
                    {upcomingMedicines.length} medicine{upcomingMedicines.length > 1 ? 's' : ''} waiting
                  </p>
                </div>

                <div className="space-y-8">
                  {upcomingMedicines.map((medicine) => (
                    <div
                      key={medicine.id}
                      className="bg-red-50 rounded-3xl p-10 border-6 border-red-300 shadow-xl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-6xl font-bold text-gray-800 mb-6">{medicine.name}</h4>
                          <p className="text-4xl text-gray-600 mb-6">{medicine.dosage}</p>
                          <div className="flex items-center gap-6 mb-6">
                            <div className="bg-red-200 rounded-3xl px-8 py-4">
                              <span className="text-3xl font-bold text-red-700">
                                🕐 Take at {medicine.time}
                              </span>
                            </div>
                          </div>
                          {medicine.instructions && (
                            <div className="bg-yellow-100 rounded-3xl p-6 border-4 border-yellow-300">
                              <p className="text-3xl text-yellow-800 font-bold">
                                📝 Important: {medicine.instructions}
                              </p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => markAsTaken(medicine.id)}
                          className="bg-green-500 text-white text-5xl font-bold px-20 py-10 rounded-3xl hover:bg-green-600 transform hover:scale-105 transition-all duration-200 shadow-2xl cursor-pointer whitespace-nowrap ml-8 border-4 border-green-400"
                        >
                          ✓ I TOOK IT!
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Medicines - Enhanced */}
            {completedMedicines.length > 0 && (
              <div>
                <h3 className="text-5xl font-bold text-green-600 mb-10 text-center">
                  ✅ COMPLETED TODAY
                </h3>
                <div className="bg-green-100 rounded-3xl p-6 mb-8 text-center border-4 border-green-300">
                  <p className="text-4xl font-bold text-green-800">
                    Great job! {completedMedicines.length} medicine{completedMedicines.length > 1 ? 's' : ''} completed! 🎉
                  </p>
                </div>

                <div className="space-y-6">
                  {completedMedicines.map((medicine) => (
                    <div
                      key={medicine.id}
                      className="bg-green-50 rounded-3xl p-8 border-4 border-green-300 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-4xl font-bold text-gray-800 mb-2">{medicine.name}</h4>
                          <p className="text-3xl text-gray-600 mb-3">{medicine.dosage}</p>
                          {medicine.takenAt && (
                            <p className="text-2xl text-green-700 font-bold">
                              ✓ Completed at {medicine.takenAt}
                            </p>
                          )}
                        </div>
                        <div className="bg-green-200 rounded-3xl px-10 py-6">
                          <span className="text-3xl font-bold text-green-700">✅ DONE!</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Enhanced Phone Call Instructions with Voice Recognition */}
        <div className="mt-16 bg-blue-100 rounded-3xl p-12 text-center border-4 border-blue-300 shadow-lg">
          <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <i className="ri-phone-fill text-6xl text-white"></i>
          </div>
          <h4 className="text-5xl font-bold text-gray-800 mb-8">📞 Smart Phone Reminders</h4>

          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 border-4 border-blue-200">
              <p className="text-3xl text-gray-700 font-bold mb-6">
                🔔 We will call you when it's time for your medicine!
              </p>
              <p className="text-2xl text-gray-600 mb-4">
                When your phone rings, we'll ask: "Have you taken your medicine?"
              </p>
              <div className="bg-purple-100 rounded-2xl p-6 border-4 border-purple-300">
                <p className="text-2xl text-purple-800 font-bold">
                  🎤 NEW: Answer with your VOICE or buttons!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-green-100 rounded-3xl p-8 border-4 border-green-300">
                <div className="text-6xl mb-6">🎙️</div>
                <p className="text-3xl font-bold text-green-800 mb-4">Say "YES"</p>
                <p className="text-2xl text-green-700 mb-4">
                  Just speak: "Yes", "Yeah", "Okay", "I took it"
                </p>
                <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                  <p className="text-lg text-green-600">✅ Automatically marked as taken!</p>
                </div>
              </div>

              <div className="bg-orange-100 rounded-3xl p-8 border-4 border-orange-300">
                <div className="text-6xl mb-6">🗣️</div>
                <p className="text-3xl font-bold text-orange-800 mb-4">Say "NO"</p>
                <p className="text-2xl text-orange-700 mb-4">
                  Just speak: "No", "Not yet", "Haven't taken"
                </p>
                <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
                  <p className="text-lg text-orange-600">⏰ We'll call again in 5 minutes!</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-100 rounded-3xl p-8 border-4 border-purple-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-4xl mb-4">🎤</div>
                  <p className="text-xl text-purple-800 font-bold mb-2">Voice Recognition</p>
                  <p className="text-lg text-purple-700">
                    Our system listens and understands when you say YES or NO
                  </p>
                </div>
                <div>
                  <div className="text-4xl mb-4">👆</div>
                  <p className="text-xl text-purple-800 font-bold mb-2">Backup Buttons</p>
                  <p className="text-lg text-purple-700">
                    If voice doesn't work, click the YES or NO buttons
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-3xl p-8 border-4 border-blue-200">
              <div className="text-4xl mb-4">💡</div>
              <p className="text-2xl text-blue-800 font-bold mb-4">How It Works:</p>
              <div className="space-y-3 text-lg text-blue-700">
                <p>1. 📞 Your phone rings at medicine time</p>
                <p>2. 🎙️ Say "YES" or "NO" clearly into the phone</p>
                <p>3. 🤖 Our system hears and understands you</p>
                <p>4. ✅ Your medicine gets marked automatically</p>
                <p>5. 👆 Or click buttons if voice doesn't work</p>
              </div>
            </div>

            <div className="bg-green-50 rounded-3xl p-8 border-4 border-green-200">
              <p className="text-2xl text-green-800 font-bold">
                🌟 Keep your phone nearby so you don't miss important reminders!
              </p>
              <p className="text-lg text-green-700 mt-4">
                The system works with both your voice AND button clicks for maximum convenience
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
