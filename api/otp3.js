export const config = {
  runtime: 'edge', // Edge Runtime for fast execution
};

export default async function handler(req) {
  // 1. Parse the URL to get parameters
  const url = new URL(req.url);
  const number = url.searchParams.get("number");

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

  // 3. Generate a random UUID for the device ID (Hotstar expects this to track sessions)
  const deviceId = crypto.randomUUID();

  try {
    // 4. Target the specific Hotstar BFF endpoint you provided
    const targetUrl = `https://www.hotstar.com/api/internal/bff/v2/pages/1/spaces/1/widgets/8?action=sendOtp&pageRef=watch&page_enum=onboarding_login&qrCode=true`;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Origin": "https://www.hotstar.com",
        "Referer": "https://www.hotstar.com/in",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        
        // --- HOTSTAR SPECIFIC REQUIRED HEADERS ---
        "x-hs-platform": "web",           // Identifies the platform
        "x-country-code": "in",           // Crucial for regional routing
        "x-hs-device-id": deviceId,       // Bypasses missing device tracking
        "x-hs-app-version": "1.0.0",
        "accept-language": "en"
        // -----------------------------------------
      },
      // Hotstar typically uses 'identifierValue' and 'identifierType' for authentication
      body: JSON.stringify({
        identifierValue: number,
        identifierType: "PHONE",
        countryCode: "IN"
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

    // 6. Return response back to your client
    return new Response(
      JSON.stringify({
        success: response.ok,
        target_number: number,
        api_response: otpData
      }),
      {
        status: response.ok ? 200 : response.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate", 
        }
      }
    );

  } catch (error) {
    // 7. Handle network or fetch failures
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to interact with Hotstar server",
        details: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
