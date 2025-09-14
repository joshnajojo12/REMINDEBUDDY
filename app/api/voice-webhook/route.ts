import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const medicine = url.searchParams.get('medicine') || 'your medication';
    
    // Forward the request to the Flask backend
    const backendUrl = `http://localhost:3001/voice-webhook?medicine=${encodeURIComponent(medicine)}`;
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/xml',
      },
    });
    
    const twimlContent = await response.text();
    
    return new NextResponse(twimlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Voice webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Forward the request to the Flask backend
    const backendUrl = 'http://localhost:3001/voice-webhook';
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
    });
    
    const twimlContent = await response.text();
    
    return new NextResponse(twimlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Voice webhook POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}