// src/common/services/email.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { SelectQuery } from 'src/db/postgres.client';
import { Messages } from './utils/messages';
// Assuming SelectQuery is a global or imported utility for database queries
// You'll need to define SelectQuery and ApiResponseFormat in your project.

/**
 * Interface for the data required to send an email.
 */
export interface EmailData {
  to: string;
  subject?: string; // Optional: If provided, overrides the template's subject
  template: string; // The name of the email template to use (e.g., 'password_reset')
  languageId?: number; // Optional: Language ID for translated templates
  data: { // Data to be injected into the template placeholders (e.g., {{otp}}, {{email}})
    otp?: string;
    email?: string;
    expires_in?: string;
    [key: string]: any; // Allows for any other dynamic data
  };
}

/**
 * Interface representing the structure of a row from the 'email_templates' table.
 */
interface DbEmailTemplate {
  id: number;
  name: string;
  subject: string;
  template_html: string;
  template_text: string | null;
  variables: any | null;
  category: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by: number | null;
  updated_by: number | null;
}

/**
 * Interface representing the structure of a row from the 'email_template_translations' table.
 */
interface DbEmailTemplateTranslation {
  id: number;
  template_id: number;
  language_id: number;
  subject: string;
  template_html: string;
  template_text: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: number | null;
  updated_by: number | null;
}


@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(
    private configService: ConfigService,
  ) {
    // Initialize Nodemailer transporter using environment variables
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587), // Default to 587 if not specified
      secure: this.configService.get<boolean>('SMTP_SECURE', false), // true for 465 (SSL/TLS), false for other ports (STARTTLS)
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      // IMPORTANT: In production, `rejectUnauthorized` should generally be `true` for security.
      // Set to `false` only if you're certain about your self-signed certificate setup or during development.
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify the Nodemailer transporter connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Nodemailer configuration error:', error);
      } else {
        console.log('Nodemailer is ready to send emails. Connection successful.');
      }
    });
  }

  /**
   * Fetches an email template from the database based on its name.
   * If a `languageId` is provided, it attempts to fetch the translated version.
   * Falls back to the default template if no translation is found.
   * @param templateName The unique name of the template (e.g., 'password_reset').
   * @param languageId Optional: The ID of the language for translated templates.
   * @returns An object containing the subject, HTML content, and plain text content of the template.
   * @throws InternalServerErrorException if the template is not found or is inactive.
   */
  private async getEmailTemplate(
    templateName: string,
    languageId?: number,
  ): Promise<{ subject: string; html: string; text: string | null }> {
    try {
      const baseTemplateSql = `
        SELECT id, name, subject, template_html, template_text, is_active
        FROM email_templates
        WHERE name = $1 AND is_active = true
      `;
      const baseTemplateResult:any = await SelectQuery(baseTemplateSql, [templateName]);

      if (baseTemplateResult.length === 0) {
        throw new InternalServerErrorException(`Email template '${templateName}' not found or is inactive in the database.`);
      }

      const baseTemplate: DbEmailTemplate = baseTemplateResult[0];

      let subject = baseTemplate.subject;
      let html = baseTemplate.template_html;
      let text = baseTemplate.template_text;

      // If a language ID is provided, attempt to fetch a translated version of the template
      if (languageId) {
        const translatedTemplateSql = `
          SELECT subject, template_html, template_text
          FROM email_template_translations
          WHERE template_id = $1 AND language_id = $2
        `;
        const translatedTemplateResult:any = await SelectQuery(translatedTemplateSql, [baseTemplate.id, languageId]);

        if (translatedTemplateResult.length > 0) {
          const translatedTemplate: DbEmailTemplateTranslation = translatedTemplateResult[0];
          // If a translation is found, use its content
          subject = translatedTemplate.subject;
          html = translatedTemplate.template_html;
          text = translatedTemplate.template_text;
          console.log(`Using translated template for '${templateName}' in language ID ${languageId}.`);
        } else {
          console.warn(`No translation found for '${templateName}' in language ID ${languageId}. Falling back to default template.`);
        }
      }

      return { subject, html, text };
    } catch (e) {
      console.error('Error fetching email template:', e);
      // If it's an InternalServerErrorException already, re-throw it.
      // Otherwise, wrap in a generic error.
      if (e instanceof InternalServerErrorException) {
        throw e;
      }
      throw new InternalServerErrorException(Messages.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Replaces placeholders in a template string with actual data.
   * Placeholders should be in the format `{{key}}` (e.g., `{{otp}}`).
   * @param templateContent The template string (e.g., HTML or plain text).
   * @param data An object where keys match template placeholders and values are the replacements.
   * @returns The template string with all specified placeholders replaced.
   */
  // private replaceTemplateVariables(templateContent: string, data: { [key: string]: any }): string {
  //   let replacedContent = templateContent;
  //   // Iterate over each key-value pair in the data object
  //   for (const key in data) {
  //     if (Object.prototype.hasOwnProperty.call(data, key)) {
  //       // Create a regular expression to find all occurrences of the placeholder `{{key}}`
  //       // `\s*` allows for optional whitespace around the key, `g` for global replacement
  //       const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
  //       // Replace the placeholder with the corresponding data value
  //       replacedContent = replacedContent.replace(placeholder, String(data[key]));
  //     }
  //   }
  //   return replacedContent;
  // }

    private getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
      }

      private replaceTemplateVariables(templateContent: string, data: { [key: string]: any }): string {
        return templateContent.replace(/\$\{\s*([\w.]+)\s*\}/g, (_, path) => {
          const value = this.getNestedValue(data, path);
          return value !== undefined && value !== null ? String(value) : '';
        });
      }
  /**
   * Sends an email by fetching the template from the database,
   * replacing its variables, and using Nodemailer to send it.
   * @param emailData The data required to send the email, including recipient, template name, and variables.
   * @throws InternalServerErrorException if the email sending fails.
   */
  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      // 1. Get the template content (HTML, text, and subject) from the database
      const { subject: templateSubject, html, text } = await this.getEmailTemplate(
        emailData.template,
        emailData.languageId,
      );

      // 2. Determine the final subject: use the one from `emailData` if provided, otherwise use the template's subject
      const finalSubject = emailData.subject || templateSubject;

      // 3. Replace variables in both HTML and plain text templates
      const htmlContent = this.replaceTemplateVariables(html, emailData.data);
      // Only process text content if it exists in the template
      const textContent = text ? this.replaceTemplateVariables(text, emailData.data) : undefined;

      console.log('Attempting to send email:', {
        to: emailData.to,
        subject: finalSubject,
        templateName: emailData.template,
        // Don't log full HTML content for brevity/security in console
      });

      // 4. Send the email using Nodemailer
      await this.transporter.sendMail({
        from: this.configService.get<string>('FROM_EMAIL', 'no-reply@yourdomain.com'), // Sender email, now uses FROM_EMAIL
        to: emailData.to,
        subject: finalSubject,
        html: htmlContent,
        text: textContent,
      });

      console.log(`✅ Email sent successfully to ${emailData.to} for template '${emailData.template}'.`);
    } catch (error) {
      console.error(`❌ Email sending error for ${emailData.to} (template: ${emailData.template}):`, error.message);
      // Re-throw as a NestJS `InternalServerErrorException` for consistent error handling
      throw new InternalServerErrorException('Failed to send email.');
    }
  }

  // ====================================================================
  // Specific email sending methods using the generic sendEmail method
  // ====================================================================

  /**
   * Sends a verification email to a user.
   * Template: 'email_verification'
   * @param email The recipient's email address.
   * @param otp The One-Time Password for verification.
   * @param languageId Optional: Language ID for the email template.
   */
  async sendVerificationEmail(email: string, otp: string, languageId?: number): Promise<void> {
    await this.sendEmail({
      to: email,
      template: 'email_verification', // Matches the 'name' column in your email_templates table
      languageId,
      data: {
        otp,
        email,
        expires_in: '15 minutes', // Example variable, can be made dynamic
      },
    });
  }

  /**
   * Sends a vendor verification email.
   * Template: 'vendor-email-verification'
   * @param email The vendor's email address.
   * @param otp The One-Time Password for verification.
   * @param languageId Optional: Language ID for the email template.
   */
  async sendVendorVerificationEmail(email: string, otp: string, languageId?: number): Promise<void> {
    await this.sendEmail({
      to: email,
      template: 'vendor-email-verification', // Matches the 'name' column in your email_templates table
      languageId,
      data: {
        otp,
        email,
        expires_in: '15 minutes',
      },
    });
  }

  /**
   * Sends a password reset email.
   * Template: 'password_reset'
   * @param email The recipient's email address.
   * @param otp The One-Time Password for password reset.
   * @param languageId Optional: Language ID for the email template.
   */
  async sendPasswordResetEmail(email: string, otp: string, languageId?: number): Promise<void> {
    await this.sendEmail({
      to: email,
      template: 'password_reset', // Matches the 'name' column in your email_templates table
      languageId,
      data: {
        otp,
        email,
        expires_in: '15 minutes',
      },
    });
  }

  /**
   * Sends a generic OTP email.
   * Template: 'generic-otp'
   * @param email The recipient's email address.
   * @param otp The One-Time Password.
   * @param expires_in A string indicating when the OTP expires (e.g., '15 minutes').
   * @param languageId Optional: Language ID for the email template.
   */
  async sendGenericOtpEmail(email: string, otp: string, expires_in: string, languageId?: number): Promise<void> {
    await this.sendEmail({
      to: email,
      template: 'generic-otp',
      languageId,
      data: {
        otp,
        email,
        expires_in,
      },
    });
  }

  /**
   * Sends an email for 2-Factor Authentication during login.
   * Template: 'login_2fa'
   * @param email The recipient's email address.
   * @param otp The One-Time Password for 2FA.
   * @param expires_in A string indicating when the OTP expires (e.g., '15 minutes').
   * @param languageId Optional: Language ID for the email template.
   */
  async sendLogin2FaEmail(email: string, otp: string, expires_in: string, languageId?: number): Promise<void> {
    await this.sendEmail({
      to: email,
      template: 'login_2fa',
      languageId,
      data: {
        otp,
        email,
        expires_in,
      },
    });
  }
}




// // src/common/services/email.service.ts

// import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import * as nodemailer from 'nodemailer';
// import { Transporter } from 'nodemailer';
// import { SelectQuery } from 'src/db/postgres.client';
// import { Messages } from './utils/messages';

// // Assuming SelectQuery is a global or imported utility for database queries
// // You'll need to define SelectQuery and ApiResponseFormat in your project.

// /**
//  * Interface for the data required to send an email.
//  */
// export interface EmailData {
//   to: string;
//   subject?: string; // Optional: If provided, overrides the template's subject
//   template: string; // The name of the email template to use (e.g., 'password_reset')
//   languageId?: number; // Optional: Language ID for translated templates
//   data: { // Data to be injected into the template placeholders (e.g., {{otp}}, {{email}})
//     otp?: string;
//     email?: string;
//     expires_in?: string;
//     [key: string]: any; // Allows for any other dynamic data
//   };
// }

// /**
//  * Interface representing the structure of a row from the 'email_templates' table.
//  */
// interface DbEmailTemplate {
//   id: number;
//   name: string;
//   subject: string;
//   template_html: string;
//   template_text: string | null;
//   variables: any | null;
//   category: string | null;
//   is_system: boolean;
//   is_active: boolean;
//   created_at: Date;
//   updated_at: Date;
//   created_by: number | null;
//   updated_by: number | null;
// }

// /**
//  * Interface representing the structure of a row from the 'email_template_translations' table.
//  */
// interface DbEmailTemplateTranslation {
//   id: number;
//   template_id: number;
//   language_id: number;
//   subject: string;
//   template_html: string;
//   template_text: string | null;
//   created_at: Date;
//   updated_at: Date;
//   created_by: number | null;
//   updated_by: number | null;
// }

// @Injectable()
// export class EmailService {
//   private transporter: Transporter;

//   constructor(
//     private configService: ConfigService,
//   ) {
//     // Initialize Nodemailer transporter using environment variables
//     // Gmail-specific configuration
//     this.transporter = nodemailer.createTransporter({
//       service: 'gmail', // Using Gmail service
//       host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
//       port: 587, // Gmail uses 587 for STARTTLS
//       secure: false, // false for STARTTLS (port 587), true for SSL/TLS (port 465)
//       auth: {
//         user: this.configService.get<string>('SMTP_USER'),
//         pass: this.configService.get<string>('SMTP_PASS'), // Use App Password for Gmail
//       },
//       tls: {
//         rejectUnauthorized: true, // Set to true for production security
//       },
//     });

//     // Verify the Nodemailer transporter connection
//     this.transporter.verify((error, success) => {
//       if (error) {
//         console.error('❌ Nodemailer configuration error:', error);
//         console.error('Please check your Gmail SMTP credentials and ensure you are using an App Password');
//       } else {
//         console.log('✅ Nodemailer is ready to send emails. Gmail SMTP connection successful.');
//       }
//     });
//   }

//   /**
//    * Fetches an email template from the database based on its name.
//    * If a `languageId` is provided, it attempts to fetch the translated version.
//    * Falls back to the default template if no translation is found.
//    * @param templateName The unique name of the template (e.g., 'password_reset').
//    * @param languageId Optional: The ID of the language for translated templates.
//    * @returns An object containing the subject, HTML content, and plain text content of the template.
//    * @throws InternalServerErrorException if the template is not found or is inactive.
//    */
//   private async getEmailTemplate(
//     templateName: string,
//     languageId?: number,
//   ): Promise<{ subject: string; html: string; text: string | null }> {
//     try {
//       const baseTemplateSql = `
//         SELECT id, name, subject, template_html, template_text, is_active
//         FROM email_templates
//         WHERE name = $1 AND is_active = true
//       `;
//       const baseTemplateResult: any = await SelectQuery(baseTemplateSql, [templateName]);

//       if (baseTemplateResult.length === 0) {
//         throw new InternalServerErrorException(`Email template '${templateName}' not found or is inactive in the database.`);
//       }

//       const baseTemplate: DbEmailTemplate = baseTemplateResult[0];

//       let subject = baseTemplate.subject;
//       let html = baseTemplate.template_html;
//       let text = baseTemplate.template_text;

//       // If a language ID is provided, attempt to fetch a translated version of the template
//       if (languageId) {
//         const translatedTemplateSql = `
//           SELECT subject, template_html, template_text
//           FROM email_template_translations
//           WHERE template_id = $1 AND language_id = $2
//         `;
//         const translatedTemplateResult: any = await SelectQuery(translatedTemplateSql, [baseTemplate.id, languageId]);

//         if (translatedTemplateResult.length > 0) {
//           const translatedTemplate: DbEmailTemplateTranslation = translatedTemplateResult[0];
//           // If a translation is found, use its content
//           subject = translatedTemplate.subject;
//           html = translatedTemplate.template_html;
//           text = translatedTemplate.template_text;
//           console.log(`✅ Using translated template for '${templateName}' in language ID ${languageId}.`);
//         } else {
//           console.warn(`⚠️ No translation found for '${templateName}' in language ID ${languageId}. Falling back to default template.`);
//         }
//       }

//       return { subject, html, text };
//     } catch (e) {
//       console.error('❌ Error fetching email template:', e);
//       // If it's an InternalServerErrorException already, re-throw it.
//       // Otherwise, wrap in a generic error.
//       if (e instanceof InternalServerErrorException) {
//         throw e;
//       }
//       throw new InternalServerErrorException(Messages.INTERNAL_SERVER_ERROR);
//     }
//   }

//   /**
//    * Replaces placeholders in a template string with actual data.
//    * Placeholders should be in the format `{{key}}` (e.g., `{{otp}}`).
//    * @param templateContent The template string (e.g., HTML or plain text).
//    * @param data An object where keys match template placeholders and values are the replacements.
//    * @returns The template string with all specified placeholders replaced.
//    */
//   private replaceTemplateVariables(templateContent: string, data: { [key: string]: any }): string {
//     let replacedContent = templateContent;
//     // Iterate over each key-value pair in the data object
//     for (const key in data) {
//       if (Object.prototype.hasOwnProperty.call(data, key)) {
//         // Create a regular expression to find all occurrences of the placeholder `{{key}}`
//         // `\s*` allows for optional whitespace around the key, `g` for global replacement
//         const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
//         // Replace the placeholder with the corresponding data value
//         replacedContent = replacedContent.replace(placeholder, String(data[key]));
//       }
//     }
//     return replacedContent;
//   }

//   /**
//    * Sends an email by fetching the template from the database,
//    * replacing its variables, and using Nodemailer to send it.
//    * @param emailData The data required to send the email, including recipient, template name, and variables.
//    * @throws InternalServerErrorException if the email sending fails.
//    */
//   async sendEmail(emailData: EmailData): Promise<void> {
//     try {
//       // 1. Get the template content (HTML, text, and subject) from the database
//       const { subject: templateSubject, html, text } = await this.getEmailTemplate(
//         emailData.template,
//         emailData.languageId,
//       );

//       // 2. Determine the final subject: use the one from `emailData` if provided, otherwise use the template's subject
//       const finalSubject = emailData.subject || templateSubject;

//       // 3. Replace variables in both HTML and plain text templates
//       const htmlContent = this.replaceTemplateVariables(html, emailData.data);
//       // Only process text content if it exists in the template
//       const textContent = text ? this.replaceTemplateVariables(text, emailData.data) : undefined;

//       console.log('📧 Attempting to send email:', {
//         to: emailData.to,
//         subject: finalSubject,
//         templateName: emailData.template,
//         from: this.configService.get<string>('FROM_EMAIL', 'dwaparyugfoundation@gmail.com'),
//         // Don't log full HTML content for brevity/security in console
//       });

//       // 4. Send the email using Nodemailer
//       const info = await this.transporter.sendMail({
//         from: `"Dwaparyug Foundation" <${this.configService.get<string>('FROM_EMAIL', 'dwaparyugfoundation@gmail.com')}>`, // Sender name and email
//         to: emailData.to,
//         subject: finalSubject,
//         html: htmlContent,
//         text: textContent,
//       });

//       console.log(`✅ Email sent successfully to ${emailData.to} for template '${emailData.template}'.`);
//       console.log(`📬 Message ID: ${info.messageId}`);
      
//       // Log additional info for Gmail
//       if (info.response) {
//         console.log(`📤 Gmail response: ${info.response}`);
//       }

//     } catch (error) {
//       console.error(`❌ Email sending error for ${emailData.to} (template: ${emailData.template}):`, error.message);
      
//       // Log more specific Gmail errors
//       if (error.code === 'EAUTH') {
//         console.error('❌ Gmail authentication failed. Please check your credentials and ensure 2FA is enabled with App Password.');
//       } else if (error.code === 'ECONNECTION') {
//         console.error('❌ Connection failed. Please check your internet connection and Gmail SMTP settings.');
//       }
      
//       // Re-throw as a NestJS `InternalServerErrorException` for consistent error handling
//       throw new InternalServerErrorException('Failed to send email. Please check email configuration.');
//     }
//   }

//   // ====================================================================
//   // Specific email sending methods using the generic sendEmail method
//   // ====================================================================

//   /**
//    * Sends a verification email to a user.
//    * Template: 'email_verification'
//    * @param email The recipient's email address.
//    * @param otp The One-Time Password for verification.
//    * @param languageId Optional: Language ID for the email template.
//    */
//   async sendVerificationEmail(email: string, otp: string, languageId?: number): Promise<void> {
//     await this.sendEmail({
//       to: email,
//       template: 'email_verification', // Matches the 'name' column in your email_templates table
//       languageId,
//       data: {
//         otp,
//         email,
//         expires_in: '15 minutes', // Example variable, can be made dynamic
//       },
//     });
//   }

//   /**
//    * Sends a vendor verification email.
//    * Template: 'vendor-email-verification'
//    * @param email The vendor's email address.
//    * @param otp The One-Time Password for verification.
//    * @param languageId Optional: Language ID for the email template.
//    */
//   async sendVendorVerificationEmail(email: string, otp: string, languageId?: number): Promise<void> {
//     await this.sendEmail({
//       to: email,
//       template: 'vendor-email-verification', // Matches the 'name' column in your email_templates table
//       languageId,
//       data: {
//         otp,
//         email,
//         expires_in: '15 minutes',
//       },
//     });
//   }

//   /**
//    * Sends a password reset email.
//    * Template: 'password_reset'
//    * @param email The recipient's email address.
//    * @param otp The One-Time Password for password reset.
//    * @param languageId Optional: Language ID for the email template.
//    */
//   async sendPasswordResetEmail(email: string, otp: string, languageId?: number): Promise<void> {
//     await this.sendEmail({
//       to: email,
//       template: 'password_reset', // Matches the 'name' column in your email_templates table
//       languageId,
//       data: {
//         otp,
//         email,
//         expires_in: '15 minutes',
//       },
//     });
//   }

//   /**
//    * Sends a generic OTP email.
//    * Template: 'generic-otp'
//    * @param email The recipient's email address.
//    * @param otp The One-Time Password.
//    * @param expires_in A string indicating when the OTP expires (e.g., '15 minutes').
//    * @param languageId Optional: Language ID for the email template.
//    */
//   async sendGenericOtpEmail(email: string, otp: string, expires_in: string, languageId?: number): Promise<void> {
//     await this.sendEmail({
//       to: email,
//       template: 'generic-otp',
//       languageId,
//       data: {
//         otp,
//         email,
//         expires_in,
//       },
//     });
//   }

//   /**
//    * Sends an email for 2-Factor Authentication during login.
//    * Template: 'login_2fa'
//    * @param email The recipient's email address.
//    * @param otp The One-Time Password for 2FA.
//    * @param expires_in A string indicating when the OTP expires (e.g., '15 minutes').
//    * @param languageId Optional: Language ID for the email template.
//    */
//   async sendLogin2FaEmail(email: string, otp: string, expires_in: string, languageId?: number): Promise<void> {
//     await this.sendEmail({
//       to: email,
//       template: 'login_2fa',
//       languageId,
//       data: {
//         otp,
//         email,
//         expires_in,
//       },
//     });
//   }

//   /**
//    * Test email configuration by sending a test email
//    * @param testEmail Email address to send test email to
//    */
//   async sendTestEmail(testEmail: string): Promise<void> {
//     try {
//       const info = await this.transporter.sendMail({
//         from: `"Dwaparyug Foundation" <${this.configService.get<string>('FROM_EMAIL', 'dwaparyugfoundation@gmail.com')}>`,
//         to: testEmail,
//         subject: 'Test Email - Email Service Configuration',
//         html: `
//           <h2>Email Service Test</h2>
//           <p>This is a test email to verify that your email service is working correctly.</p>
//           <p><strong>Configuration:</strong></p>
//           <ul>
//             <li>SMTP Host: ${this.configService.get<string>('SMTP_HOST')}</li>
//             <li>From Email: ${this.configService.get<string>('FROM_EMAIL')}</li>
//             <li>Test sent at: ${new Date().toISOString()}</li>
//           </ul>
//           <p>If you received this email, your email service is configured correctly!</p>
//         `,
//         text: `Email Service Test\n\nThis is a test email to verify that your email service is working correctly.\n\nConfiguration:\n- SMTP Host: ${this.configService.get<string>('SMTP_HOST')}\n- From Email: ${this.configService.get<string>('FROM_EMAIL')}\n- Test sent at: ${new Date().toISOString()}\n\nIf you received this email, your email service is configured correctly!`,
//       });

//       console.log(`✅ Test email sent successfully to ${testEmail}`);
//       console.log(`📬 Message ID: ${info.messageId}`);
//     } catch (error) {
//       console.error(`❌ Test email failed:`, error.message);
//       throw new InternalServerErrorException('Test email failed to send.');
//     }
//   }
// }