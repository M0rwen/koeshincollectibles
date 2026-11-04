const nodemailer = require('nodemailer')

const sendEmail = async options => {
    if (process.env.BREVO_API_KEY) {
        const body = {
            sender: {
                name: process.env.SMTP_FROM_NAME,
                email: process.env.SMTP_FROM_EMAIL
            },
            to: [{ email: options.email }],
            subject: options.subject
        }

        const htmlContent = options.html || options.message
        if (htmlContent) body.htmlContent = htmlContent
        if (options.text) body.textContent = options.text
        if (options.attachments?.length) {
            body.attachment = options.attachments.map(attachment => ({
                name: attachment.filename,
                content: Buffer.isBuffer(attachment.content)
                    ? attachment.content.toString('base64')
                    : Buffer.from(attachment.content).toString('base64')
            }))
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(10_000)
        })

        if (!response.ok) {
            throw new Error(`Brevo email request failed with status ${response.status}`)
        }
        return
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    })

    const message = {
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        html: `<p>${options.message}</p>`,
        attachments: options.attachments
    }

    await transporter.sendMail(message)
}

module.exports = sendEmail
