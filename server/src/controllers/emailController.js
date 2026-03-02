const { sendMail, sendTemplate } = require('../services/emailService');

// send raw message
const sendRawEmail = async (req, res, next) => {
  try {
    const { to, subject, html, text } = req.body;
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ message: 'to, subject and html/text required' });
    }
    const info = await sendMail({ to, subject, html, text });
    res.json({ message: 'Email sent', info });
  } catch (err) {
    next(err);
  }
};

// send by template
const sendTemplateEmail = async (req, res, next) => {
  try {
    const { templateId, to, variables } = req.body;
    if (!templateId || !to) {
      return res.status(400).json({ message: 'templateId and to are required' });
    }
    const info = await sendTemplate({ templateId, to, variables });
    res.json({ message: 'Template email sent', info });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendRawEmail,
  sendTemplateEmail,
};