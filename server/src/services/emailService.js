const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// read template file and compile
function compileTemplate(templateString, variables) {
  const template = handlebars.compile(templateString);
  return template(variables);
}

// transporter configuration using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// basic send mail function
async function sendMail({ to, subject, html, text, from }) {
  const info = await transporter.sendMail({
    from: from || process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
  return info;
}

// send using stored template id (objectId or name)
async function sendTemplate({ templateId, to, variables = {} }) {
  const EmailTemplate = require('../models/emailTemplateModel');
  const tpl = await EmailTemplate.findById(templateId);
  if (!tpl) throw new Error('Template not found');

  const html = compileTemplate(tpl.body, variables);
  const text = compileTemplate(tpl.body.replace(/<[^>]+>/g, ''), variables);

  return sendMail({ to, subject: tpl.subject, html, text });
}

module.exports = {
  sendMail,
  sendTemplate,
};