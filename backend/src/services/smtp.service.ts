import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface SendMailOptions {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  body?: string;
  html?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId: string;
  previewUrl: string | false;
  response: string;
}

let cachedTransporter: Transporter | null = null;

export const smtpService = {
  /**
   * Get or initialize Nodemailer Ethereal SMTP transporter
   */
  async getTransporter(): Promise<Transporter> {
    if (cachedTransporter) {
      return cachedTransporter;
    }

    let user = env.ETHEREAL_USER;
    let pass = env.ETHEREAL_PASSWORD;

    // If credentials are not set in environment, dynamically generate Ethereal test account
    if (!user || !pass) {
      logger.info('No Ethereal credentials in env. Creating a dynamic Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      user = testAccount.user;
      pass = testAccount.pass;
      logger.info({ user: testAccount.user }, 'Generated dynamic Ethereal test account');
    }

    cachedTransporter = nodemailer.createTransport({
      host: env.ETHEREAL_HOST || 'smtp.ethereal.email',
      port: env.ETHEREAL_PORT || 587,
      secure: false,
      auth: {
        user,
        pass,
      },
    });

    try {
      await cachedTransporter.verify();
      logger.info('Ethereal SMTP Transporter verified and ready to send emails');
    } catch (err) {
      logger.warn({ err }, 'Ethereal SMTP Transporter verification warning');
    }

    return cachedTransporter;
  },

  /**
   * Send email through Nodemailer Ethereal SMTP
   */
  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    const transporter = await this.getTransporter();

    const fromAddress = options.from || env.ETHEREAL_USER || 'outreach@ethereal.email';

    const mailOptions = {
      from: `"AutoMail Scheduler" <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.body || '',
      html: options.html || (options.text ? options.text.replace(/\n/g, '<br/>') : undefined),
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    logger.info(
      {
        messageId: info.messageId,
        recipient: options.to,
        previewUrl: previewUrl || 'N/A',
      },
      '📧 Email sent via Ethereal SMTP'
    );

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl,
      response: info.response,
    };
  },
};
