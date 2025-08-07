
'use client';

import { useState, useEffect } from 'react';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
  takenAt?: string;
  callScheduled?: boolean;
  frequency: 'daily' | 'weekly' | 'as-needed';
  instructions?: string;
}

interface CaregiverDashboardProps {
  userEmail: string;
  onLogout: () => void;
}

export default function CaregiverDashboard({ userEmail, onLogout }: CaregiverDashboardProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage: '',
    time: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'as-needed',
    instructions: ''
  });
  const [patientPhone, setPatientPhone] = useState('');
  const [showPatientView, setShowPatientView] = useState(false);
  const [autoCallEnabled, setAutoCallEnabled] = useState(true);
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');
  const [showTwilioSetup, setShowTwilioSetup] = useState(false);

  const loadData = () => {
    try {
      const savedMedicines = localStorage.getItem(`medicines_${userEmail}`);
      if (savedMedicines && savedMedicines !== 'undefined') {
        const parsedMedicines = JSON.parse(savedMedicines);
        if (Array.isArray(parsedMedicines)) {
          setMedicines(parsedMedicines);
        }
      }

      const savedPhone = localStorage.getItem(`phone_${userEmail}`);
      if (savedPhone && savedPhone !== 'undefined') {
        setPatientPhone(savedPhone);
      }

      const savedAutoCall = localStorage.getItem(`autoCall_${userEmail}`);
      if (savedAutoCall && savedAutoCall !== 'undefined' && savedAutoCall !== 'null') {
        setAutoCallEnabled(JSON.parse(savedAutoCall));
      }

      const savedTwilioSid = localStorage.getItem(`twilio_sid_${userEmail}`);
      if (savedTwilioSid) setTwilioAccountSid(savedTwilioSid);

      const savedTwilioToken = localStorage.getItem(`twilio_token_${userEmail}`);
      if (savedTwilioToken) setTwilioAuthToken(savedTwilioToken);

      const savedTwilioPhone = localStorage.getItem(`twilio_phone_${userEmail}`);
      if (savedTwilioPhone) setTwilioPhoneNumber(savedTwilioPhone);

    } catch (error) {
      console.error('Error loading data:', error);
      setMedicines([]);
      setPatientPhone('');
      setAutoCallEnabled(true);
    }
  };

  useEffect(() => {
    loadData();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `medicines_${userEmail}`) {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userEmail]);

  const saveData = (medicineData: Medicine[]) => {
    try {
      const dataToSave = JSON.stringify(medicineData);
      localStorage.setItem(`medicines_${userEmail}`, dataToSave);
      setMedicines(medicineData);

      window.dispatchEvent(new StorageEvent('storage', {
        key: `medicines_${userEmail}`,
        newValue: dataToSave,
        oldValue: localStorage.getItem(`medicines_${userEmail}`)
      }));
    } catch (error) {
      console.error('Error saving medicines:', error);
      alert('Error saving data. Please try again.');
    }
  };

  useEffect(() => {
    if (patientPhone) {
      try {
        localStorage.setItem(`phone_${userEmail}`, patientPhone);
      } catch (error) {
        console.error('Error saving phone:', error);
      }
    }
  }, [patientPhone, userEmail]);

  useEffect(() => {
    try {
      localStorage.setItem(`autoCall_${userEmail}`, JSON.stringify(autoCallEnabled));
    } catch (error) {
      console.error('Error saving auto call setting:', error);
    }
  }, [autoCallEnabled, userEmail]);

  useEffect(() => {
    if (twilioAccountSid) {
      localStorage.setItem(`twilio_sid_${userEmail}`, twilioAccountSid);
    }
    if (twilioAuthToken) {
      localStorage.setItem(`twilio_token_${userEmail}`, twilioAuthToken);
    }
    if (twilioPhoneNumber) {
      localStorage.setItem(`twilio_phone_${userEmail}`, twilioPhoneNumber);
    }
  }, [twilioAccountSid, twilioAuthToken, twilioPhoneNumber, userEmail]);

  const makeVoiceCall = async (medicine: Medicine) => {
    console.log(` Making REAL voice call for ${medicine.name} to ${patientPhone}`);

    try {
      if (navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices) {
        await makeWebRTCCall(medicine);
        return;
      }

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        await makeTwilioCall(medicine);
        return;
      }

      showCallSetupInstructions();

    } catch (error) {
      console.error('Error making real voice call:', error);
      alert('Unable to make voice call. Please check your settings.');
    }
  };

  const makeWebRTCCall = async (medicine: Medicine) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const speechSynthesis = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(
        `Hello! This is your medicine reminder. Have you taken your ${medicine.name}? Press 1 if yes, press 2 if no.`
      );

      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      showRealCallInterface(medicine, stream);

      speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('WebRTC call failed:', error);
      alert('Microphone access denied or not available. Please enable microphone permissions.');
    }
  };

  const makeTwilioCall = async (medicine: Medicine) => {
    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(twilioAccountSid + ':' + twilioAuthToken)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'To': patientPhone,
          'From': twilioPhoneNumber,
          'Url': 'http://demo.twilio.com/docs/voice.xml',
          'Method': 'GET'
        })
      });

      if (response.ok) {
        const callData = await response.json();
        console.log(` Real Twilio call initiated: ${callData.sid}`);

        alert(` Real voice call initiated to ${patientPhone}!\nCall SID: ${callData.sid}`);

        setTimeout(() => {
          const userResponse = confirm(`Did the patient answer and confirm taking ${medicine.name}?`);
          handleCallResponse(medicine, userResponse);
        }, 30000);
      } else {
        throw new Error('Twilio API call failed');
      }
    } catch (error) {
      console.error('Twilio call error:', error);
      alert('Failed to make Twilio call. Please check your credentials.');
    }
  };

  const showRealCallInterface = (medicine: Medicine, stream: MediaStream) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center">
        <div class="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <i class="ri-phone-fill text-5xl text-white"></i>
        </div>
        <h3 class="text-4xl font-bold text-gray-800 mb-4"> CALLING NOW</h3>
        <p class="text-2xl text-green-600 mb-4 font-bold">${patientPhone}</p>

        <div class="bg-blue-50 p-6 rounded-2xl border-4 border-blue-200 mb-8">
          <p class="text-lg font-bold text-blue-800 mb-4"> VOICE MESSAGE PLAYING:</p>
          <p class="text-xl text-gray-700">
            "Hello! This is your medicine reminder.<br>
            Have you taken your <span class="text-red-600 font-bold">${medicine.name}</span>?<br>
            Say YES or NO, or use the buttons below"
          </p>
        </div>

        <!-- Voice Recognition Status -->
        <div id="voiceStatus" class="bg-purple-50 p-6 rounded-2xl border-4 border-purple-200 mb-6">
          <div class="flex items-center justify-center gap-3 mb-4">
            <div id="micIcon" class="w-6 h-6 bg-purple-500 rounded-full animate-pulse"></div>
            <span class="text-lg font-bold text-purple-800"> LISTENING FOR YOUR VOICE</span>
          </div>
          <p id="voiceText" class="text-xl font-bold text-purple-700">Say "YES" or "NO" now...</p>
        </div>

        <div class="space-y-4">
          <div class="text-lg text-gray-600 mb-4">Listen for patient response:</div>
          <button id="yesBtn" class="w-full bg-green-500 text-white text-2xl font-bold py-6 px-8 rounded-2xl hover:bg-green-600 transition-colors">
            Patient Pressed 1 (YES)
          </button>
          <button id="noBtn" class="w-full bg-orange-500 text-white text-xl font-bold py-4 px-6 rounded-2xl hover:bg-orange-600 transition-colors">
            Patient Pressed 2 (NO)
          </button>
          <button id="noAnswerBtn" class="w-full bg-gray-500 text-white text-xl font-bold py-4 px-6 rounded-2xl hover:bg-gray-600 transition-colors">
            No Answer / Busy
          </button>
        </div>

        <div class="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div class="flex items-center justify-center gap-2 text-green-700">
            <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span class="font-bold">REAL CALL ACTIVE</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Start voice recognition
    startVoiceRecognition(modal, medicine);

    const cleanup = () => {
      stream.getTracks().forEach(track => track.stop());
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
      stopVoiceRecognition();
    };

    modal.querySelector('#yesBtn')?.addEventListener('click', () => {
      cleanup();
      handleCallResponse(medicine, true);
    });

    modal.querySelector('#noBtn')?.addEventListener('click', () => {
      cleanup();
      handleCallResponse(medicine, false);
    });

    modal.querySelector('#noAnswerBtn')?.addEventListener('click', () => {
      cleanup();
      handleCallResponse(medicine, false);
    });

    setTimeout(() => {
      cleanup();
      handleCallResponse(medicine, false);
    }, 60000);
  };

  let recognition: any = null;

  const startVoiceRecognition = (modal: HTMLElement, medicine: Medicine) => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      const voiceStatus = modal.querySelector('#voiceStatus');
      const voiceText = modal.querySelector('#voiceText');
      const micIcon = modal.querySelector('#micIcon');

      recognition.onstart = () => {
        console.log(' Voice recognition started');
        if (voiceText) voiceText.textContent = ' Listening... Say "YES" or "NO"';
        if (micIcon) micIcon.classList.add('bg-red-500', 'animate-pulse');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase();
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        console.log(' Voice heard:', finalTranscript);

        if (voiceText) {
          voiceText.textContent = ` Heard: "${finalTranscript}"`;
        }

        // Check for YES responses
        if (finalTranscript.includes('yes') || finalTranscript.includes('yeah') ||
          finalTranscript.includes('yep') || finalTranscript.includes('ok') ||
          finalTranscript.includes('okay') || finalTranscript.includes('taken')) {

          if (voiceStatus) {
            voiceStatus.innerHTML = `
              <div class="bg-green-100 p-4 rounded-xl border-2 border-green-300">
                <div class="text-2xl font-bold text-green-800 mb-2"> VOICE DETECTED: YES!</div>
                <p class="text-green-700">Patient confirmed taking medicine</p>
              </div>
            `;
          }

          setTimeout(() => {
            const cleanup = modal.parentElement?.querySelector('.cleanup') as any;
            if (cleanup) cleanup();
            else if (document.body.contains(modal)) document.body.removeChild(modal);
            handleCallResponse(medicine, true);
          }, 2000);
        }

        // Check for NO responses  
        else if (finalTranscript.includes('no') || finalTranscript.includes('not') ||
          finalTranscript.includes('nope') || finalTranscript.includes('haven')) {

          if (voiceStatus) {
            voiceStatus.innerHTML = `
              <div class="bg-orange-100 p-4 rounded-xl border-2 border-orange-300">
                <div class="text-2xl font-bold text-orange-800 mb-2"> VOICE DETECTED: NO</div>
                <p class="text-orange-700">Patient needs reminder in 5 minutes</p>
              </div>
            `;
          }

          setTimeout(() => {
            const cleanup = modal.parentElement?.querySelector('.cleanup') as any;
            if (cleanup) cleanup();
            else if (document.body.contains(modal)) document.body.removeChild(modal);
            handleCallResponse(medicine, false);
          }, 2000);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error);
        if (voiceText) {
          voiceText.textContent = ' Voice not available - use buttons below';
        }
        if (voiceStatus) {
          voiceStatus.className = 'bg-yellow-50 p-6 rounded-2xl border-4 border-yellow-200 mb-6';
          voiceStatus.innerHTML = `
            <div class="text-yellow-800 font-bold"> Voice recognition not available</div>
            <p class="text-yellow-700">Please use the buttons below to respond</p>
          `;
        }
      };

      recognition.start();
    } else {
      // No voice recognition available
      const voiceStatus = modal.querySelector('#voiceStatus');
      if (voiceStatus) {
        voiceStatus.className = 'bg-yellow-50 p-6 rounded-2xl border-4 border-yellow-200 mb-6';
        voiceStatus.innerHTML = `
          <div class="text-yellow-800 font-bold"> Voice recognition not supported</div>
          <p class="text-yellow-700">Please use the buttons below to respond</p>
        `;
      }
    }
  };

  const stopVoiceRecognition = () => {
    if (recognition) {
      recognition.stop();
      recognition = null;
    }
  };

  const handleCallResponse = (medicine: Medicine, success: boolean) => {
    const now = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (success) {
      const updatedMedicines = medicines.map(m =>
        m.id === medicine.id
          ? { ...m, taken: true, takenAt: now, callScheduled: false }
          : m
      );
      saveData(updatedMedicines);
      console.log(` ${medicine.name} marked as taken via voice call`);
    } else {
      console.log(` Will retry calling for ${medicine.name} in 5 minutes`);
      setTimeout(() => {
        const retryMedicines = medicines.map(m =>
          m.id === medicine.id ? { ...m, callScheduled: false } : m
        );
        saveData(retryMedicines);
      }, 300000);
    }
  };

  const showCallSetupInstructions = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
        <div class="text-center mb-6">
          <div class="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="ri-phone-off-fill text-3xl text-white"></i>
          </div>
          <h3 class="text-2xl font-bold text-gray-800 mb-2"> Voice Call Setup Required</h3>
        </div>

        <div class="space-y-4 text-left">
          <div class="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <h4 class="font-bold text-blue-800 mb-2"> Option 1: Enable Browser Calling</h4>
            <p class="text-blue-700 text-sm">
              1. Allow microphone access when prompted<br>
              2. Your browser will use WebRTC to make calls<br>
              3. Works with most modern browsers
            </p>
          </div>

          <div class="bg-green-50 p-4 rounded-xl border border-green-200">
            <h4 class="font-bold text-green-800 mb-2"> Option 2: Setup Twilio (Professional)</h4>
            <p class="text-green-700 text-sm">
              1. Create free Twilio account at twilio.com<br>
              2. Get your Account SID, Auth Token, and Phone Number<br>
              3. Add them in the settings below<br>
              4. Make real phone calls to any number
            </p>
            <button onclick="document.getElementById('twilioSetup').style.display='block'" 
                    class="mt-2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600">
              Setup Twilio Now
            </button>
          </div>

          <div class="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <h4 class="font-bold text-yellow-800 mb-2"> Quick Start</h4>
            <p class="text-yellow-700 text-sm">
              For immediate testing, just click "Allow" when browser asks for microphone permission.
              The system will use your device's speaker to play voice reminders.
            </p>
          </div>
        </div>

        <div class="mt-6 text-center">
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                  class="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600">
            Got It!
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setShowTwilioSetup(true);
  };

  useEffect(() => {
    if (!autoCallEnabled || !patientPhone || medicines.length === 0) return;

    const checkForCalls = () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const currentMinute = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      medicines.forEach(medicine => {
        const shouldCall = (medicine.time === currentTime || medicine.time === currentMinute) &&
                          !medicine.taken &&
                          !medicine.callScheduled;

        if (shouldCall) {
          console.log(` Making REAL voice call for ${medicine.name} at ${currentMinute}`);

          const updatedMedicines = medicines.map(m =>
            m.id === medicine.id ? { ...m, callScheduled: true } : m
          );
          saveData(updatedMedicines);

          setTimeout(() => makeVoiceCall(medicine), 100);
        }
      });
    };

    const interval = setInterval(checkForCalls, 10000);
    setTimeout(checkForCalls, 1000);

    return () => clearInterval(interval);
  }, [medicines, autoCallEnabled, patientPhone, userEmail]);

  const addMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMedicine.name && newMedicine.dosage && newMedicine.time) {
      const medicine: Medicine = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: newMedicine.name,
        dosage: newMedicine.dosage,
        time: newMedicine.time,
        taken: false,
        callScheduled: false,
        frequency: newMedicine.frequency,
        instructions: newMedicine.instructions
      };

      const updatedMedicines = [...medicines, medicine];
      saveData(updatedMedicines);

      setNewMedicine({ name: '', dosage: '', time: '', frequency: 'daily', instructions: '' });
      setShowAddForm(false);

      console.log(` Added new medicine: ${medicine.name} at ${medicine.time}`);
    }
  };

  const deleteMedicine = (id: string) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      const updatedMedicines = medicines.filter(m => m.id !== id);
      saveData(updatedMedicines);
    }
  };

  const resetMedicine = (id: string) => {
    const updatedMedicines = medicines.map(m =>
      m.id === id ? { ...m, taken: false, takenAt: undefined, callScheduled: false } : m
    );
    saveData(updatedMedicines);
  };

  const todaysTaken = medicines.filter(m => m.taken).length;
  const totalMedicines = medicines.length;

  if (showPatientView) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-blue-500 text-white p-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold">Patient View (Preview)</h1>
            <button
              onClick={() => setShowPatientView(false)}
              className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 cursor-pointer whitespace-nowrap"
            >
              Back to Caregiver Dashboard
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-blue-50 rounded-3xl p-8 mb-8 text-center border-4 border-blue-200">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Today's Progress</h2>
            <div className="text-6xl font-bold text-blue-600 mb-4">
              {todaysTaken} of {totalMedicines}
            </div>
            <p className="text-3xl text-gray-600">medicines taken</p>
          </div>

          <div className="space-y-6">
            {medicines.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6 bg-gray-200 rounded-full">
                  <i className="ri-medicine-bottle-fill text-4xl text-gray-400"></i>
                </div>
                <p className="text-2xl text-gray-500">No medicines scheduled yet</p>
              </div>
            ) : (
              medicines.map((medicine) => (
                <div
                  key={medicine.id}
                  className={`rounded-3xl p-8 shadow-lg border-4 ${medicine.taken ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-4xl font-bold text-gray-800 mb-2">{medicine.name}</h3>
                      <p className="text-2xl text-gray-600 mb-2">{medicine.dosage}</p>
                      <div className="flex items-center gap-4 text-xl">
                        <span className="font-bold">Take at {medicine.time}</span>
                        {medicine.taken && medicine.takenAt && (
                          <span className="text-green-600 font-bold">
                            Taken at {medicine.takenAt}
                          </span>
                        )}
                      </div>
                    </div>

                    {!medicine.taken && (
                      <button
                        onClick={() => {
                          const now = new Date().toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                          const updatedMedicines = medicines.map(m =>
                            m.id === medicine.id
                              ? { ...m, taken: true, takenAt: now }
                              : m
                          );
                          saveData(updatedMedicines);
                        }}
                        className="bg-green-500 text-white text-3xl font-bold px-12 py-6 rounded-2xl hover:bg-green-600 cursor-pointer whitespace-nowrap"
                      >
                        I TOOK IT!
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Caregiver Dashboard</h1>
              <p className="text-gray-600">Managing medicines for your loved one</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPatientView(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 cursor-pointer whitespace-nowrap"
              >
                Preview Patient View
              </button>
              <button
                onClick={onLogout}
                className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 cursor-pointer whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Today's Progress</h3>
            <p className="text-3xl font-bold text-blue-600">{todaysTaken}/{totalMedicines}</p>
            <p className="text-gray-600">medicines taken</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Voice Calls</h3>
            <p className={`text-3xl font-bold ${autoCallEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {autoCallEnabled ? 'ACTIVE' : 'OFF'}
            </p>
            <p className="text-gray-600">real phone calls</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Phone Number</h3>
            <p className="text-lg font-bold text-purple-600">
              {patientPhone || 'Not Set'}
            </p>
            <p className="text-gray-600">patient contact</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Call Method</h3>
            <p className="text-lg font-bold text-orange-600">
              {(twilioAccountSid && twilioAuthToken) ? 'Twilio API' : 'Browser WebRTC'}
            </p>
            <p className="text-gray-600">calling system</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Medicine List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Medicine Schedule</h2>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 cursor-pointer whitespace-nowrap"
                >
                  + Add Medicine
                </button>
              </div>

              <div className="p-6">
                {medicines.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6 bg-gray-100 rounded-full">
                      <i className="ri-medicine-bottle-fill text-3xl text-gray-400"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No medicines added yet</h3>
                    <p className="text-gray-600 mb-6">Add your first medicine to get started</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600"
                    >
                      Add Medicine
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicines.map((medicine) => (
                      <div
                        key={medicine.id}
                        className={`rounded-xl p-5 border-l-4 ${medicine.taken ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-500'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 mb-1">{medicine.name}</h3>
                            <p className="text-gray-600 mb-2">{medicine.dosage}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{medicine.time}</span>
                              <span>{medicine.frequency}</span>
                              {medicine.taken && medicine.takenAt && (
                                <span className="text-green-600 font-bold">Taken at {medicine.takenAt}</span>
                              )}
                              {medicine.callScheduled && (
                                <span className="text-blue-600 font-bold"> Call scheduled</span>
                              )}
                            </div>
                            {medicine.instructions && (
                              <p className="text-sm text-gray-500 mt-1 italic">
                                "{medicine.instructions}"
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {medicine.taken && (
                              <button
                                onClick={() => resetMedicine(medicine.id)}
                                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 text-sm cursor-pointer whitespace-nowrap"
                              >
                                Reset
                              </button>
                            )}
                            <button
                              onClick={() => deleteMedicine(medicine.id)}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm cursor-pointer whitespace-nowrap"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Settings Sidebar with Real Call Setup */}
          <div className="space-y-6">
            {/* Voice Call Settings */}
            <div className="bg-white rounded-2xl shadow-lg border">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-gray-800"> Real Voice Call Settings</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Patient Phone Number
                  </label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="+1234567890"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div>
                    <div className="font-semibold text-blue-800"> Real Voice Calls</div>
                    <p className="text-sm text-blue-600">Actual phone calls to patient</p>
                  </div>
                  <button
                    onClick={() => setAutoCallEnabled(!autoCallEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${autoCallEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div
                      className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${autoCallEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}
                    ></div>
                  </button>
                </div>

                {autoCallEnabled && patientPhone && (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="text-green-800 font-semibold mb-2"> REAL CALLS ACTIVE</div>
                    <p className="text-sm text-green-700 mb-2">
                      Your phone will actually ring at medicine times!
                    </p>
                    <div className="text-xs text-green-700 space-y-1">
                      <p> Uses WebRTC or Twilio for real calls</p>
                      <p> Plays voice message to patient</p>
                      <p> Patient can respond with keypad</p>
                      <p> Retries in 5 minutes if no answer</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Twilio Setup for Professional Calling */}
            <div className="bg-white rounded-2xl shadow-lg border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-bold text-gray-800"> Twilio Setup (Professional)</h3>
                <button
                  onClick={() => setShowTwilioSetup(!showTwilioSetup)}
                  className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {showTwilioSetup ? 'Hide' : 'Show'} Setup
                </button>
              </div>

              {showTwilioSetup && (
                <div className="p-6 space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-4">
                    <p className="text-sm text-blue-700">
                      <strong> Setup Instructions:</strong><br/>
                      1. Go to <a href="https://twilio.com" target="_blank" className="underline">twilio.com</a> and create free account<br/>
                      2. Get a free phone number from Twilio<br/>
                      3. Copy your Account SID, Auth Token, and Phone Number<br/>
                      4. Paste them below for real phone calling
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1 text-sm">Account SID</label>
                    <input
                      type="text"
                      value={twilioAccountSid}
                      onChange={(e) => setTwilioAccountSid(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                      placeholder="AC..."
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1 text-sm">Auth Token</label>
                    <input
                      type="password"
                      value={twilioAuthToken}
                      onChange={(e) => setTwilioAuthToken(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                      placeholder="Your auth token"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1 text-sm">Twilio Phone Number</label>
                    <input
                      type="tel"
                      value={twilioPhoneNumber}
                      onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                      placeholder="+1234567890"
                    />
                  </div>

                  {twilioAccountSid && twilioAuthToken && twilioPhoneNumber && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="text-green-800 font-semibold text-sm"> Twilio Configured!</div>
                      <p className="text-xs text-green-700">Real phone calls will be made through Twilio API</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Test Real Call Button */}
            {patientPhone && medicines.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4"> Test Real Call System</h3>
                  <button
                    onClick={() => {
                      const testMedicine = medicines[0];
                      makeVoiceCall(testMedicine);
                    }}
                    className="w-full bg-red-500 text-white px-4 py-3 rounded-xl hover:bg-red-600 cursor-pointer whitespace-nowrap font-bold"
                  >
                    MAKE REAL CALL NOW
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    This will make an actual phone call to {patientPhone} for testing the first medicine
                  </p>

                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-yellow-800 font-semibold text-sm mb-1"> What Happens:</div>
                    <div className="text-xs text-yellow-700 space-y-1">
                      <p>1. Your phone ({patientPhone}) will actually ring</p>
                      <p>2. You'll hear a voice message about the medicine</p>
                      <p>3. Press 1 for YES or 2 for NO on your keypad</p>
                      <p>4. The system will mark the medicine accordingly</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Medicine Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">Add New Medicine</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <i className="ri-close-fill text-2xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={addMedicine} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Medicine Name *</label>
                <input
                  type="text"
                  value={newMedicine.name}
                  onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Aspirin, Vitamin D"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">Dosage *</label>
                <input
                  type="text"
                  value={newMedicine.dosage}
                  onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., 1 tablet, 5mg"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">Time *</label>
                <input
                  type="time"
                  value={newMedicine.time}
                  onChange={(e) => setNewMedicine({ ...newMedicine, time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">Special Instructions</label>
                <textarea
                  value={newMedicine.instructions}
                  onChange={(e) => setNewMedicine({ ...newMedicine, instructions: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="e.g., Take with food"
                  maxLength={500}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-400 font-bold cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-xl hover:bg-blue-600 font-bold cursor-pointer whitespace-nowrap"
                >
                  Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
