# 📧 Email Configuration Guide - Anti-Spam Optimized

## 🎯 Overview

This guide provides comprehensive instructions for configuring email functionality in EduConnect to ensure maximum deliverability and avoid spam folders.

## 🔧 Resend Setup (Recommended)

### 1. Create Resend Account
1. Visit [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free tier)
3. Verify your email address

### 2. Domain Verification (Critical for Deliverability)

#### Option A: Use Your Own Domain (Recommended)
```bash
# Add these DNS records to your domain:

# SPF Record (TXT)
Name: send
Value: "v=spf1 include:amazonses.com ~all"

# DKIM Record (TXT) 
Name: resend._domainkey
Value: [Get from Resend Dashboard]

# MX Record (Optional but recommended)
Name: send
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10

# DMARC Record (TXT) - Advanced
Name: _dmarc
Value: "v=DMARC1; p=none; rua=mailto:dmarcreports@yourdomain.com;"
```

#### Option B: Use Resend Test Domain (Development Only)
```env
RESEND_FROM_EMAIL="onboarding@resend.dev"
RESEND_REPLY_TO_EMAIL="support@resend.dev"
```

### 3. Environment Variables

Add to your `.env.local`:

```env
# Resend Configuration
RESEND_API_KEY="re_your_api_key_here"

# Production - Use your verified domain
RESEND_FROM_EMAIL="noreply@yourdomain.com"
RESEND_REPLY_TO_EMAIL="support@yourdomain.com"

# Development - Use Resend test domain
# RESEND_FROM_EMAIL="onboarding@resend.dev"
# RESEND_REPLY_TO_EMAIL="support@resend.dev"
```

## 🛡️ Anti-Spam Best Practices

### 1. Email Content Optimization

✅ **DO:**
- Use professional HTML templates with proper structure
- Include plain text versions of all emails
- Use clear, descriptive subject lines
- Include unsubscribe links
- Use proper sender names (e.g., "EduConnect <noreply@yourdomain.com>")

❌ **DON'T:**
- Use ALL CAPS in subject lines
- Include excessive exclamation marks
- Use spam trigger words (FREE, URGENT, etc.)
- Send from personal email domains (gmail, yahoo)

### 2. Technical Headers

Our implementation includes these anti-spam headers:

```javascript
headers: {
  'List-Unsubscribe': '<https://yourdomain.com/unsubscribe>',
  'X-Entity-Ref-ID': 'unique-reference-id',
  'X-Priority': '1', // For important emails only
  'X-MSMail-Priority': 'High',
  'Importance': 'high'
}
```

### 3. Email Warm-up Schedule

For new domains, follow this schedule:

| Day | Max Emails | Max Per Hour |
|-----|------------|--------------|
| 1   | 150        | -            |
| 2   | 250        | -            |
| 3   | 400        | -            |
| 4   | 700        | 50           |
| 5   | 1,000      | 75           |
| 6   | 1,500      | 100          |
| 7+  | 2,000+     | 150          |

## 🔍 Email Types in EduConnect

### 1. Parent Report Notifications
- **Trigger:** When admin sends reports to parents
- **Content:** Professional HTML template with report details
- **Frequency:** Per report period (typically monthly)

### 2. Teacher Reminder Emails
- **Trigger:** When admin sends reminders for incomplete reports
- **Content:** Warning-styled template with incomplete class list
- **Frequency:** As needed (typically weekly during report periods)

## 📊 Monitoring & Analytics

### 1. Email Tracking
All emails include tracking tags:
```javascript
tags: [
  { name: 'type', value: 'report_notification' },
  { name: 'student', value: 'Student Name' },
  { name: 'period', value: 'Report Period' }
]
```

### 2. Database Logging
Emails are logged in the `email_notifications` table:
- Recipient information
- Subject and content
- Send status and timestamp
- Email type classification

## 🚨 Troubleshooting

### Common Issues:

1. **Emails going to spam:**
   - Verify domain DNS records
   - Check sender reputation
   - Review email content for spam triggers

2. **High bounce rate:**
   - Validate email addresses before sending
   - Clean up invalid addresses
   - Monitor bounce reports

3. **Low delivery rate:**
   - Implement email warm-up
   - Use authenticated domain
   - Monitor sender reputation

### Testing:
```bash
# Test email addresses (Resend provides these)
delivered@resend.dev    # Successful delivery
bounced@resend.dev      # Hard bounce
complained@resend.dev   # Spam complaint
```

## 🔒 Security Considerations

1. **API Key Security:**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Email Content:**
   - Sanitize user input in email templates
   - Validate email addresses
   - Implement rate limiting

3. **Privacy:**
   - Include privacy policy links
   - Provide unsubscribe options
   - Handle data according to GDPR/local laws

## 📈 Performance Optimizations

Our implementation includes:

1. **Batch Processing:** Eliminates N+1 query problems
2. **Async Operations:** Non-blocking email sending
3. **Error Handling:** Graceful failure handling
4. **Caching:** Efficient data lookup with Maps
5. **Rate Limiting:** Respects email service limits

## 🎯 Production Checklist

Before going live:

- [ ] Domain verified in Resend
- [ ] DNS records properly configured
- [ ] Environment variables set
- [ ] Email templates tested
- [ ] Bounce handling implemented
- [ ] Monitoring dashboard configured
- [ ] Backup email service configured (optional)

## 📞 Support

For issues with email delivery:
1. Check Resend dashboard for delivery status
2. Review DNS configuration
3. Monitor email logs in database
4. Contact Resend support if needed

---

*This configuration ensures maximum email deliverability while maintaining professional appearance and compliance with anti-spam regulations.*
