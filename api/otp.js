export default async function handler(req, res) {
  // 1. Get the mobile number from the query parameters: ?number=1234567890
  const { number } = req.query;

  // 2. Validate that a number was provided
  if (!number) {
    return res.status(400).json({ error: "Please provide a mobile number. Example: ?number=9876543210" });
  }

  try {
    // 3. Make the POST request to the VBSPU server
    const response = await fetch("https://vbspuresult.org.in/Account/SendOtp", {
      method: "POST",
      headers: {
        "Host": "vbspuresult.org.in",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://vbspuresult.org.in",
        "Referer": "https://vbspuresult.org.in/Account/Registration",
        // Adding a User-Agent helps prevent the server from blocking the request
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      },
      // URLSearchParams automatically formats the body as x-www-form-urlencoded
      body: new URLSearchParams({
        mobile: number,
        Name: "VercelUser" // You can pass a default name here
      })
    });

    // 4. Read the response from VBSPU
    const rawData = await response.text();
    let otpData;

    // Try to parse it as JSON, otherwise just return the raw text
    try {
      otpData = JSON.parse(rawData);
    } catch (e) {
      otpData = rawData;
    }

    // 5. Send the result back to your frontend
    return res.status(200).json({
      success: true,
      target_number: number,
      otp_received: otpData
    });

  } catch (error) {
    // Handle any server/network errors
    return res.status(500).json({ 
      success: false, 
      error: "Failed to fetch OTP from VBSPU server", 
      details: error.message 
    });
  }
}
