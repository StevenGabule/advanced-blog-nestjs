import {Injectable, InternalServerErrorException} from "@nestjs/common";
import Mail from "nodemailer/lib/mailer";
import * as nodemailer from 'nodemailer';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class MailService {
  private transporter: Mail;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD')
      }
    })
  }

  async sendMail(to: string, subject: string, html: string, text?: string) {
    const mailOptions = {
      from: `"John Blogging" <${this.configService.get<string>('SMTP_FROM')}>`,
      to,
      subject,
      text,
      html
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to}`)
    } catch (e) {
      console.error('Error sending email:', e)
      throw new InternalServerErrorException('Failed to send email.')
    }
  }
}
