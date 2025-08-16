# Email Configuration Guide

This guide explains how to set up email functionality using Resend to avoid spam and ensure high deliverability.

## 1. Resend Account Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your email address
3. Get your API key from the dashboard

## 2. Domain Configuration (Recommended)

For best deliverability, configure a custom domain:

### Add Domain to Resend
1. Go to Domains in your Resend dashboard
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)

### DNS Records Setup
Add these DNS records to your domain:

#### SPF Record (TXT)
```
Name: send
Value: "v=spf1 include:amazonses.com ~all"
TTL: 600
```

#### DKIM Record (TXT)
```
Name: resend._domainkey
Value: [Copy from Resend dashboard]
TTL: 600
```

#### MX Record
```
Name: send
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
TTL: 600
```

#### DMARC Record (TXT) - Optional but recommended
```
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarcreports@yourdomain.com;
TTL: 600
```

## 3. Environment Variables

Add these to your `.env.local` file:

```env
# Required
RESEND_API_KEY=re_xxxxxxxxx

# Recommended (use your verified domain)
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_REPLY_TO_EMAIL=support@yourdomain.com
```

## 4. Anti-Spam Best Practices

Our implementation includes:

### Email Structure
- ✅ Both HTML and plain text versions
- ✅ Proper email headers
- ✅ List-Unsubscribe header
- ✅ Professional styling
- ✅ Clear sender identification

### Content Optimization
- ✅ Personalized content
- ✅ Clear call-to-action buttons
- ✅ Professional language
- ✅ Proper Vietnamese formatting
- ✅ No spam trigger words

### Technical Features
- ✅ SPF/DKIM authentication
- ✅ DMARC alignment
- ✅ Proper reply-to addresses
- ✅ Email tracking tags
- ✅ Error handling

## 5. Email Warm-up Schedule

For new domains, follow this schedule:

| Day | Messages per day | Messages per hour |
|-----|------------------|-------------------|
| 1   | Up to 150 emails | -                 |
| 2   | Up to 250 emails | -                 |
| 3   | Up to 400 emails | -                 |
| 4   | Up to 700 emails | 50 Maximum        |
| 5   | Up to 1,000 emails | 75 Maximum      |
| 6   | Up to 1,500 emails | 100 Maximum     |
| 7   | Up to 2,000 emails | 150 Maximum     |

## 6. Monitoring

Monitor these metrics:
- Bounce rate (keep below 4%)
- Spam complaint rate (keep below 0.08%)
- Open rates
- Click rates

## 7. Testing

Test emails using Resend's test addresses:
- `delivered@resend.dev` - Successful delivery
- `bounced@resend.dev` - Hard bounce
- `complained@resend.dev` - Spam complaint

## 8. Troubleshooting

### Domain Not Verifying
1. Check DNS propagation (use `nslookup`)
2. Ensure no trailing periods in DNS values
3. Wait up to 48 hours for propagation

### Emails Going to Spam
1. Verify SPF/DKIM records
2. Check domain reputation
3. Review email content for spam triggers
4. Ensure proper warm-up schedule

### High Bounce Rate
1. Validate email addresses before sending
2. Remove invalid addresses from lists
3. Check for typos in recipient addresses

## 9. Production Checklist

- [ ] Domain verified in Resend
- [ ] SPF record configured
- [ ] DKIM record configured
- [ ] MX record configured (optional)
- [ ] DMARC record configured (recommended)
- [ ] Environment variables set
- [ ] Test emails sent successfully
- [ ] Monitoring set up
