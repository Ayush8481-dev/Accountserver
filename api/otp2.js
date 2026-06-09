export const config = {
  runtime: 'edge', // Upgraded to Edge Runtime for instant execution
};

export default async function handler(req) {
  // 1. Parse the URL to get parameters
  const url = new URL(req.url);
  const number = url.searchParams.get("number");
  const type = url.searchParams.get("type") || "0"; 

  // 2. Validate the mobile number (Must be exactly 10 digits)
  if (!number || !/^\d{10}$/.test(number)) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Please provide a valid 10-digit mobile number. Example: ?number=9876543210" 
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Validate the SMS type
  if (!["0", "1", "2"].includes(type)) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Invalid type parameter. Please select 0, 1, or 2." 
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // 4. Make the POST request to PenPencil server
    const response = await fetch(`https://api.penpencil.co/v1/users/resend-otp-secure?smsType=${type}`, {
      method: "POST",
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Origin": "https://www.pw.live",
        "Referer": "https://www.pw.live/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        
        // PW/PenPencil specific headers
        "client-id": "5eb393ee95fab7468a79d189",
        "client-type": "WEB"
      },
      body: JSON.stringify({
        mobile: number, 
        countryCode: "+91",
        // --- ADDED: Organization ID in the body to satisfy the User Microservice ---
        organizationId: "5eb393ee95fab7468a79d189" 
      })
    });

    // 5. Extract response
    const rawData = await response.text();
    let otpData;
    try {
      otpData = JSON.parse(rawData);
    } catch (e) {
      otpData = rawData;
    }

    // 6. Return successful response
    return new Response(
      JSON.stringify({
        success: response.ok,
        target_number: number,
        sms_type: type,
        api_response: otpData
      }),
      {
        status: response.ok ? 200 : response.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate", 
        }
      }
    );

  } catch (error) {
    // 7. Handle failures safely
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to interact with PenPencil server",
        details: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
