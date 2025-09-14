import os
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Get Twilio credentials from environment
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN") 
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

@app.route('/make-call', methods=['POST'])
def make_call():
    """Initiate a voice call to remind patient about medication"""
    try:
        data = request.json
        patient_phone = data.get('phone')
        medicine_name = data.get('medicine_name', 'your medication')
        
        if not patient_phone:
            return jsonify({'error': 'Phone number is required'}), 400
            
        # Get the public base URL for TwiML webhook (use Next.js API route proxy)
        public_base_url = os.environ.get("PUBLIC_BASE_URL") or "https://ce2f5d20-583e-4ad3-a3ff-8b931f94803c-00-2r8sbi29wnkq5.pike.replit.dev"
        
        # URL encode the medicine name to handle spaces and special characters
        from urllib.parse import quote
        encoded_medicine = quote(medicine_name)
        # Use Next.js API route that proxies to our Flask backend
        twiml_url = f"{public_base_url}/api/voice-webhook?medicine={encoded_medicine}"
        
        # Make the call
        call = client.calls.create(
            to=patient_phone,
            from_=TWILIO_PHONE_NUMBER,
            url=twiml_url,
            method='GET'
        )
        
        return jsonify({
            'success': True,
            'call_sid': call.sid,
            'message': f'Voice call initiated to {patient_phone}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/voice-webhook', methods=['GET', 'POST'])
def voice_webhook():
    """Handle the voice call and create TwiML response"""
    medicine_name = request.args.get('medicine', 'your medication')
    
    response = VoiceResponse()
    
    # Create the voice message
    message = f"Hello! This is your medication reminder. Have you taken your {medicine_name}? Press 1 if yes, press 2 if no, or say yes or no."
    
    # Use Gather to collect user input
    # Get the public base URL for the action webhook
    public_base_url = os.environ.get("PUBLIC_BASE_URL") or "https://ce2f5d20-583e-4ad3-a3ff-8b931f94803c-00-2r8sbi29wnkq5.pike.replit.dev"
    action_url = f"{public_base_url}/api/handle-response?medicine={medicine_name}"
    
    gather = response.gather(
        input='dtmf speech',
        timeout=10,
        num_digits=1,
        speech_timeout='auto',
        action=action_url,
        method='POST'
    )
    
    gather.say(message, voice='alice')
    
    # If no input received
    response.say("I didn't receive a response. Please call your caregiver.", voice='alice')
    response.hangup()
    
    return str(response)

@app.route('/handle-response', methods=['POST'])
def handle_response():
    """Handle the patient's response (voice or keypress)"""
    response = VoiceResponse()
    
    # Get the user's input
    digits = request.values.get('Digits')
    speech_result = request.values.get('SpeechResult', '').lower()
    
    # Check for positive responses
    if (digits == '1' or 
        any(word in speech_result for word in ['yes', 'yeah', 'yep', 'ok', 'okay', 'taken', 'done'])):
        response.say("Great! Thank you for taking your medication. Have a wonderful day!", voice='alice')
        # You can add webhook to notify the caregiver here
        
    elif (digits == '2' or 
          any(word in speech_result for word in ['no', 'not', 'nope', 'haven\'t', 'didn\'t'])):
        response.say("Please take your medication now. I'll call again in 5 minutes to check.", voice='alice')
        # You can add logic to schedule a follow-up call here
        
    else:
        response.say("I didn't understand your response. Please contact your caregiver.", voice='alice')
    
    response.hangup()
    return str(response)

@app.route('/call-status', methods=['POST'])
def call_status():
    """Webhook to receive call status updates"""
    call_sid = request.values.get('CallSid')
    call_status = request.values.get('CallStatus')
    
    print(f"Call {call_sid} status: {call_status}")
    
    # You can add logic here to update the frontend about call status
    return '', 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3001))
    app.run(host='localhost', port=port, debug=True)