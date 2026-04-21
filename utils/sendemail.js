const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);
// console.log("RESEND KEY:", process.env.RESEND_API_KEY);
const sendEmail = async (to, subject, html) => {
  try {
    const response = await resend.emails.send({
      from: "Daily Job Openings <no-reply@dailyjobopenings.online>",
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