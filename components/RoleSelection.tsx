
'use client';

interface RoleSelectionProps {
  gender: 'male' | 'female';
  onRoleSelect: (role: 'patient' | 'caregiver') => void;
}

export default function RoleSelection({ gender, onRoleSelect }: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-12 w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <i className="ri-user-heart-fill text-5xl text-white"></i>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Choose Your Role</h1>
          <p className="text-2xl text-gray-600">How would you like to use Medicine Buddy?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Patient Option */}
          <button
            onClick={() => onRoleSelect('patient')}
            className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-3xl p-10 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-blue-200 hover:border-blue-300 cursor-pointer"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 transition-colors">
                <span className="text-5xl text-white">
                  {gender === 'male' ? '👨' : '👵'}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                I Need Medicine Reminders
              </h3>
              <p className="text-xl text-gray-600 mb-6">
                I want to receive calls and see my medicines to take
              </p>
              <div className="space-y-3 text-lg text-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📞</span>
                  <span>Get phone call reminders</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💊</span>
                  <span>See my medicines clearly</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <span>Mark medicines as taken</span>
                </div>
              </div>
            </div>
          </button>

          {/* Caregiver Option */}
          <button
            onClick={() => onRoleSelect('caregiver')}
            className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-3xl p-10 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-green-200 hover:border-green-300 cursor-pointer"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-600 transition-colors">
                <span className="text-5xl text-white">👨‍⚕️</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                I'm Helping Someone
              </h3>
              <p className="text-xl text-gray-600 mb-6">
                I want to manage medicines and set up reminders for my loved one
              </p>
              <div className="space-y-3 text-lg text-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚙️</span>
                  <span>Add and manage medicines</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <span>Set up phone reminders</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <span>Track medicine progress</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 text-lg">
            💡 You can always switch roles later if needed
          </p>
        </div>
      </div>
    </div>
  );
}
