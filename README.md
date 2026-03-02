# CRM Practice Project

This is a full-stack CRM application (MERN-style) built for learning and small deployments.

## Email Setup

The project now includes a lightweight email service using **Nodemailer**. It's configured via SMTP environment variables so you can use any provider (Gmail, SendGrid, Mailgun, etc.).

### Environment Variables
Copy `server/.env.example` to `server/.env` and fill in the values:

```properties
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
EMAIL_FROM="CRM App <no-reply@yourdomain.com>"
WELCOME_TEMPLATE_ID=...optional template objectId...
```

`WELCOME_TEMPLATE_ID` can point to an `EmailTemplate` document you create via the admin UI; if provided, a welcome message will be sent to new users automatically.

### Using SendGrid
If you prefer a hosted service, create a SendGrid account (free tier is fine) and obtain SMTP credentials. Use those values for the `SMTP_*` variables above. Nodemailer will still be the underlying library, but SendGrid will handle deliverability and analytics.

Example `.env` snippet for SendGrid:

```properties
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey          # literally the word "apikey"
SMTP_PASS=<your_sendgrid_api_key>
```

### Sending Emails from Code
Two endpoints are available under `/api/emails`:

- `POST /api/emails/send` – raw message, body `{ to, subject, html, text }`
- `POST /api/emails/send-template` – template-driven, body `{ templateId, to, variables }`

Both require authentication (`protect` middleware).

You can also call `sendTemplate` from any controller (see `authController.registerUser` example).

### Switching to Another Provider
The service layer (`server/src/services/emailService.js`) wraps Nodemailer. To switch to another provider (e.g. SendGrid API, Mailgun SDK), update that file only; the rest of the app remains unchanged.

## Running the App

1. `cd server && npm install`
2. Set up `.env`
3. `node server.js` or add a start script to `package.json`
4. `cd client && npm install && npm run dev`


Enjoy building your CRM!
