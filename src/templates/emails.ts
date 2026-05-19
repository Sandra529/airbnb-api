export function welcomeEmail(name: string, role: string): string {
  const roleMessage =
    role === "HOST"
      ? `<p>You're registered as a <strong>Host</strong>! Start by creating your first listing and welcoming guests from around the world.</p>
         <a href="http://localhost:3000/listings" style="background:#FF5A5F;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Create Your First Listing</a>`
      : `<p>You're registered as a <strong>Guest</strong>! Explore amazing listings and book your next adventure.</p>
         <a href="http://localhost:3000/listings" style="background:#FF5A5F;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Explore Listings</a>`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF5A5F;">Welcome to Airbnb, ${name}! 🎉</h1>
      <p>We're thrilled to have you on board.</p>
      ${roleMessage}
      <p style="margin-top:24px;">Happy travels!</p>
      <p><strong>The Airbnb Team</strong></p>
    </div>
  `;
}

export function bookingConfirmationEmail(
  guestName: string,
  listingTitle: string,
  location: string,
  checkIn: string,
  checkOut: string,
  totalPrice: number
): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF5A5F;">Booking Confirmed! ✅</h1>
      <p>Hi <strong>${guestName}</strong>, your booking has been confirmed!</p>
      <div style="background:#f7f7f7;padding:20px;border-radius:8px;margin:20px 0;">
        <h2 style="color:#FF5A5F;">${listingTitle}</h2>
        <p>📍 <strong>Location:</strong> ${location}</p>
        <p>📅 <strong>Check-in:</strong> ${checkIn}</p>
        <p>📅 <strong>Check-out:</strong> ${checkOut}</p>
        <p>💰 <strong>Total Price:</strong> $${totalPrice}</p>
      </div>
      <p><strong>Cancellation Policy:</strong> You can cancel your booking up to 24 hours before check-in for a full refund.</p>
      <p>Enjoy your stay!</p>
      <p><strong>The Airbnb Team</strong></p>
    </div>
  `;
}

export function bookingCancellationEmail(
  guestName: string,
  listingTitle: string,
  checkIn: string,
  checkOut: string
): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF5A5F;">Booking Cancelled</h1>
      <p>Hi <strong>${guestName}</strong>, your booking has been cancelled.</p>
      <div style="background:#f7f7f7;padding:20px;border-radius:8px;margin:20px 0;">
        <h2>${listingTitle}</h2>
        <p>📅 <strong>Check-in:</strong> ${checkIn}</p>
        <p>📅 <strong>Check-out:</strong> ${checkOut}</p>
      </div>
      <p>We're sorry to see you go! Find another amazing listing:</p>
      <a href="http://localhost:3000/listings" style="background:#FF5A5F;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Explore Listings</a>
      <p style="margin-top:24px;"><strong>The Airbnb Team</strong></p>
    </div>
  `;
}

export function passwordResetEmail(name: string, resetLink: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#FF5A5F;">Password Reset Request</h1>
      <p>Hi <strong>${name}</strong>, we received a request to reset your password.</p>
      <p>Click the button below to reset it. This link expires in <strong>1 hour</strong>.</p>
      <a href="${resetLink}" style="background:#FF5A5F;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset Password</a>
      <p style="margin-top:24px;color:#666;">If you did not request this, ignore this email. Your password will remain unchanged.</p>
      <p><strong>The Airbnb Team</strong></p>
    </div>
  `;
}