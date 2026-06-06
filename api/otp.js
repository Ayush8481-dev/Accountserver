export const config = {
  runtime: 'edge', // Upgraded to Edge Runtime for instant execution and 0ms cold starts
};

export default async function handler(req) {
  // 1. Parse the URL to get parameters
  const url = new URL(req.url);
  const number = url.searchParams.get("number");
  const name = url.searchParams.get("name");

  // 2. Validate the mobile number (Must be exactly 10 digits)
  if (!number || !/^\d{10}$/.test(number)) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Please provide a valid 10-digit mobile number. Example: ?number=9876543210" 
      }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }

  // 3. Set the name, default to a blank space if not provided
  const userName = name || " ";

  try {
    // 4. Make the POST request to VBSPU server
    const response = await fetch("https://vbspuresult.org.in/Account/SendOtp", {
      method: "POST",
      headers: {
        "Host": "vbspuresult.org.in",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://vbspuresult.org.in",
        "Referer": "https://vbspuresult.org.in/Account/Registration",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      },
      body: new URLSearchParams({
        mobile: number,
        Name: userName
      })
    });

    // 5. Extract response (The OTP)
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
        success: true,
        target_number: number,
        used_name: userName,
        otp_received: otpData
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Force Vercel NOT to cache this response so you always get a fresh OTP
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate", 
        }
      }
    );

  } catch (error) {
    // 7. Handle failures safely
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch OTP from server",
        details: error.message
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}
