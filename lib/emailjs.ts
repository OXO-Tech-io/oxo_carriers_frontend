import emailjs from '@emailjs/browser';

/**
 * Send an email using EmailJS from the browser
 * @param templateParams Object containing template variables (e.g. { to_name: 'John', message: 'Hello' })
 * @param templateId Optional specific template ID, otherwise uses NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
 * @returns Promise with the result
 */
export const sendBrowserEmail = async (templateParams: Record<string, any>, templateId?: string) => {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
  const finalTemplateId = templateId || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';

  if (!serviceId || !finalTemplateId || !publicKey) {
    console.error('EmailJS configuration missing in frontend .env');
    throw new Error('EmailJS configuration missing');
  }

  try {
    const response = await emailjs.send(
      serviceId,
      finalTemplateId,
      templateParams,
      publicKey
    );
    return response;
  } catch (error) {
    console.error('EmailJS send failed:', error);
    throw error;
  }
};
