<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Contact Message — JachaiX</title>
  <style>
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #0a1628; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 1.4rem; font-weight: 700; letter-spacing: -0.01em; }
    .header h1 span { color: #22c55e; }
    .badge { display: inline-block; margin-top: 8px; background: #22c55e; color: #000; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 10px; border-radius: 99px; }
    .body { padding: 32px; }
    .row { margin-bottom: 20px; }
    .label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 4px; }
    .value { font-size: 0.97rem; color: #1e293b; word-break: break-word; }
    .value a { color: #16a34a; text-decoration: none; }
    .message-box { background: #f8fafc; border-left: 4px solid #22c55e; border-radius: 4px; padding: 16px 20px; margin-top: 24px; }
    .message-box p { margin: 0; color: #334155; font-size: 0.95rem; line-height: 1.7; white-space: pre-wrap; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; text-align: center; }
    .footer p { margin: 0; font-size: 0.8rem; color: #94a3b8; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Jachai<span>X</span></h1>
      <span class="badge">New Contact Message</span>
    </div>

    <div class="body">
      <div class="row">
        <div class="label">From</div>
        <div class="value">{{ $senderName }}</div>
      </div>
      <div class="row">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:{{ $senderEmail }}">{{ $senderEmail }}</a></div>
      </div>
      <div class="row">
        <div class="label">Category</div>
        <div class="value">{{ $category }}</div>
      </div>
      <div class="row">
        <div class="label">Subject</div>
        <div class="value">{{ $mailSubject }}</div>
      </div>

      <hr class="divider" />

      <div class="label">Message</div>
      <div class="message-box">
        <p>{{ $messageBody }}</p>
      </div>
    </div>

    <div class="footer">
      <p>Sent via the JachaiX contact form &mdash; reply directly to this email to respond to {{ $senderName }}.</p>
    </div>
  </div>
</body>
</html>
