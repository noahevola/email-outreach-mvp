const express = require('express');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json());

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Decryption Helper (Placeholder for MVP)
const decryptPassword = (encryptedPassword) => {
  // In production, use crypto.privateDecrypt or aes-256-cbc here
  return encryptedPassword; 
};

app.post('/api/send-campaign', async (req, res) => {
  const { campaign_id, recipient_ids, user_id } = req.body;

  if (!campaign_id || !recipient_ids) return res.status(400).json({ error: 'Missing Data' });

  try {
    // 1. Get User's Account
    const { data: accounts } = await supabase
      .from('user_mail_accounts')
      .select('*')
      .eq('user_id', user_id)
      .limit(1);

    if (!accounts || !accounts.length) throw new Error('No mail account found');
    const mailAccount = accounts[0];

    // 2. Get Campaign Content
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    // 3. Get Contacts
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .in('id', recipient_ids);

    // 4. Setup Transporter
    const transporter = nodemailer.createTransport({
      host: mailAccount.smtp_host,
      port: mailAccount.smtp_port,
      secure: mailAccount.smtp_port === 465,
      auth: {
        user: mailAccount.smtp_user,
        pass: decryptPassword(mailAccount.smtp_pass),
      },
    });

    // 5. Send Loop
    const results = [];
    for (const contact of contacts) {
      try {
        const personalizedBody = campaign.body
          .replace('{{first_name}}', contact.first_name || 'there');

        await transporter.sendMail({
          from: `"${mailAccount.account_name}" <${mailAccount.smtp_user}>`,
          to: contact.email,
          subject: campaign.subject,
          html: personalizedBody,
        });

        results.push({ id: contact.id, status: 'Sent' });
        
        // Update DB
        await supabase.from('campaign_recipients').upsert({
            campaign_id: campaign.id,
            contact_id: contact.id,
            send_status: 'Sent',
            sent_at: new Date().toISOString()
        });

      } catch (err) {
        results.push({ id: contact.id, status: 'Failed', error: err.message });
      }
    }

    res.json({ success: true, results });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Email Service running on port ${PORT}`));
