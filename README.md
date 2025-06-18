# Ever Ease - Secure End-of-Life Planning

A comprehensive end-of-life planning platform that helps users organize their assets, documents, wishes, and designate executors with secure, encrypted storage.

## Features

- **Personalized Planning Checklist**: Customized based on user responses
- **Asset Documentation**: Financial, physical, and digital assets
- **Document Storage**: Secure upload and organization
- **Wishes & Directives**: Medical, funeral, and personal preferences
- **Executor Management**: Invite and manage trusted individuals
- **Email Notifications**: Automated invitations and confirmations
- **End-to-End Encryption**: All data is securely encrypted

## Email Configuration

To enable email notifications (registration confirmation, executor invitations, password reset), you need to configure an email service:

### Option 1: Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Set environment variables in Supabase:
   ```
   EMAIL_SERVICE=resend
   RESEND_API_KEY=your-resend-api-key
   FROM_EMAIL=noreply@yourdomain.com
   APP_URL=https://yourdomain.com
   ```

### Option 2: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key from the dashboard
3. Set environment variables in Supabase:
   ```
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your-sendgrid-api-key
   FROM_EMAIL=noreply@yourdomain.com
   APP_URL=https://yourdomain.com
   ```

### Setting Environment Variables in Supabase

1. Go to your Supabase project dashboard
2. Navigate to Settings > Edge Functions
3. Add the environment variables listed above
4. Deploy the edge functions

## Email Templates Included

- **Welcome Email**: Sent after user registration
- **Executor Invitation**: Sent when inviting someone as an executor
- **Password Reset**: Sent when user requests password reset

## Testing Email Delivery

1. **Check Spam Folder**: Emails might end up in spam initially
2. **Verify Domain**: Set up proper DNS records for your domain
3. **Test with Different Providers**: Try Gmail, Outlook, etc.
4. **Monitor Logs**: Check Supabase edge function logs for errors

## Troubleshooting Email Issues

### Emails Not Being Sent

1. Check environment variables are set correctly
2. Verify API keys are valid and have proper permissions
3. Check edge function logs in Supabase dashboard
4. Ensure your email service account is verified

### Emails Going to Spam

1. Set up SPF, DKIM, and DMARC records for your domain
2. Use a verified domain for the FROM_EMAIL
3. Avoid spam trigger words in subject lines
4. Maintain good sender reputation

### Email Service Limits

- **Resend**: 100 emails/day on free plan
- **SendGrid**: 100 emails/day on free plan

For production use, upgrade to a paid plan for higher limits and better deliverability.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Deployment

The app is configured for deployment on Netlify with Supabase as the backend.

1. Connect your repository to Netlify
2. Set up environment variables in Netlify
3. Configure Supabase project
4. Deploy edge functions to Supabase

## Security

- All user data is encrypted at rest
- End-to-end encryption for sensitive information
- Row-level security policies in Supabase
- Secure authentication with Supabase Auth
- Audit logging for all user actions

## Support

For issues or questions, please check the documentation or contact support.