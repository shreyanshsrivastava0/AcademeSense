if(isValid){
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const message = document.getElementById('message').value.trim();
    const subject = document.getElementById('subject').value;

    // Structured message
    const formattedMessage = `*New Contact Form Submission:*\n\n` +
        `*Name:* ${name}\n` +
        `*Email:* ${email}\n` +
        `*Phone:* ${phone}\n` +
        `*Subject:* ${subject}\n` +
        `*Message:* ${message}`;

    // Replace with your WhatsApp number in international format (no + or 0)
    const phoneNumber = "9369701729";

    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(formattedMessage)}`;
    window.open(whatsappURL, "_blank");
}
