const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    const response = await resend.emails.send({
      from: "Daily Job Openings <no-reply@dailyjobopenings.online>", // ✅ use your domain
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", response);
  } catch (error) {
    console.error("❌ Email error:", error);
    throw error;
  }
};

module.exports = sendEmail;