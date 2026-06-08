"use client";

import { useLanguage } from "@/lib/i18n";
import React, { useState } from "react";

export function ContactPage() {
  const { tx } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/v1/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name:     formData.fullName,
          email:    formData.email,
          category: formData.category,
          subject:  formData.subject,
          message:  formData.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const firstError = data.errors
          ? Object.values(data.errors as Record<string, string[]>)[0][0]
          : data.message ?? "Something went wrong.";
        setErrorMsg(firstError);
        setStatus("error");
        return;
      }
      setStatus("success");
      setFormData({ fullName: "", email: "", subject: "", category: "", message: "" });
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <main className="jx-contact-page">
      <style dangerouslySetInnerHTML={{ __html: `
        .jx-contact-page {
          background-color: #f8fafc;
          color: #1e293b;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }
        .jx-contact-hero-wrapper {
          background-color: #0a1628;
          position: relative;
          overflow: hidden;
        }
        .jx-contact-hero-wrapper::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#1e3a5f 1.5px, transparent 1.5px);
          background-size: 16px 16px;
          opacity: 0.4;
          mask-image: radial-gradient(circle at 80% 50%, black 0%, transparent 60%);
          -webkit-mask-image: radial-gradient(circle at 80% 50%, black 0%, transparent 60%);
        }
        .jx-contact-hero {
          max-width: 1200px;
          margin: 0 auto;
          padding: 64px 2rem 100px;
          text-align: left;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          z-index: 2;
        }
        .jx-contact-hero-content {
          flex: 1;
          z-index: 2;
        }
        .jx-contact-hero h1 {
          font-family: var(--font-display), sans-serif;
          font-size: clamp(1.85rem, 3.5vw, 3rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.02em;
          margin: 0 0 0.75rem;
          color: #ffffff;
        }
        .jx-contact-hero p {
          font-size: 1rem;
          color: #94a3b8;
          line-height: 1.65;
          max-width: 440px;
          margin: 0;
        }
        .jx-contact-hero-graphic {
          position: relative;
          width: 220px;
          height: 220px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .jx-contact-hero-graphic img {
          width: 140%;
          height: 140%;
          object-fit: contain;
        }
        
        .jx-contact-container {
          max-width: 1200px;
          margin: -70px auto 3rem;
          background: #ffffff;
          border-radius: 12px;
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 2rem;
          padding: 2.5rem;
          color: #1e293b;
          position: relative;
          z-index: 10;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .jx-contact-form-section h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #0f172a;
        }
        .jx-contact-form-section p {
          color: #64748b;
          margin-bottom: 2rem;
        }
        .jx-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .jx-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .jx-form-group label {
          font-weight: 500;
          font-size: 0.9rem;
          color: #334155;
        }
        .jx-input {
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          color: #0f172a;
          outline: none;
          transition: all 0.2s;
        }
        .jx-input:focus {
          border-color: #00e676;
          box-shadow: 0 0 0 3px rgba(0, 230, 118, 0.1);
        }
        .jx-textarea {
          resize: vertical;
          min-height: 120px;
        }
        .jx-privacy-notice {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: #f0fdf4;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border: 1px solid #bbf7d0;
        }
        .jx-privacy-notice p {
          margin: 0;
          font-size: 0.85rem;
          color: #166534;
        }
        .jx-privacy-notice strong {
          display: block;
          color: #14532d;
          margin-bottom: 0.2rem;
        }
        .jx-submit-btn {
          background: #00e676;
          color: #ffffff;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: background 0.2s;
        }
        .jx-submit-btn:hover {
          background: #00c853;
        }

        .jx-contact-info-section h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          color: #0f172a;
        }
        .jx-contact-info-section > p {
          color: #64748b;
          margin-bottom: 1.5rem;
        }
        .jx-info-cards {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .jx-info-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        .jx-info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .jx-info-icon {
          width: 40px;
          height: 40px;
          background: #f0fdf4;
          color: #16a34a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .jx-info-content h4 {
          margin: 0 0 0.2rem 0;
          font-size: 0.95rem;
          color: #0f172a;
        }
        .jx-info-content p {
          margin: 0;
          font-size: 0.85rem;
          color: #64748b;
        }
        .jx-info-content small {
          display: block;
          color: #94a3b8;
          margin-top: 0.2rem;
        }

        .jx-urgent-box {
          margin-top: 2rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.25rem;
        }
        .jx-urgent-box h4 {
          margin: 0 0 0.5rem 0;
          color: #0f172a;
        }
        .jx-urgent-box p {
          margin: 0 0 1rem 0;
          font-size: 0.85rem;
          color: #64748b;
        }
        .jx-report-btn {
          background: transparent;
          border: 1px solid #16a34a;
          color: #16a34a;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .jx-report-btn:hover {
          background: #f0fdf4;
        }

        .jx-features-row {
          max-width: 1200px;
          margin: 0 auto 3rem;
          padding: 0 2rem;
        }
        .jx-features-container {
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .jx-feature {
          padding: 1.5rem 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-right: 1px solid #e2e8f0;
        }
        .jx-feature:last-child {
          border-right: none;
        }
        .jx-feature-icon {
          width: 40px;
          height: 40px;
          background: #f0fdf4;
          color: #16a34a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .jx-feature h4 {
          margin: 0 0 0.2rem 0;
          color: #0f172a;
          font-size: 0.95rem;
        }
        .jx-feature p {
          margin: 0;
          font-size: 0.8rem;
          color: #64748b;
        }

        .jx-faq-section {
          max-width: 1000px;
          margin: 0 auto 3rem;
          text-align: center;
          padding: 0 2rem;
        }
        .jx-faq-section h2 {
          color: #0f172a;
          margin-bottom: 0.5rem;
          font-size: 1.75rem;
        }
        .jx-faq-section > p {
          color: #64748b;
          margin-bottom: 2rem;
        }
        .jx-faq-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          text-align: left;
        }
        .jx-faq-column {
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
        }
        .jx-faq-item-container {
          border-bottom: 1px solid #e2e8f0;
        }
        .jx-faq-item-container:last-child {
          border-bottom: none;
        }
        .jx-faq-item {
          padding: 1.2rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          color: #1e293b;
          font-weight: 500;
        }
        .jx-faq-item:hover {
          background: #f8fafc;
        }
        .jx-faq-answer {
          padding: 0 1.5rem 1.2rem;
          color: #64748b;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .jx-help-banner {
          max-width: 1200px;
          margin: 0 auto 4rem;
          background: #f0fdf4;
          border-radius: 12px;
          padding: 2rem 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #bbf7d0;
        }
        .jx-help-banner-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .jx-help-icon {
          width: 50px;
          height: 50px;
          background: #ffffff;
          color: #16a34a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .jx-help-banner h3 {
          margin: 0 0 0.3rem 0;
          color: #14532d;
        }
        .jx-help-banner p {
          margin: 0;
          color: #166534;
        }
        .jx-help-btn {
          background: transparent;
          border: 1px solid #16a34a;
          color: #16a34a;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .jx-help-btn:hover {
          background: #ffffff;
        }

        @media (max-width: 900px) {
          .jx-contact-container {
            grid-template-columns: 1fr;
          }
          .jx-features-row {
            grid-template-columns: 1fr 1fr;
          }
          .jx-faq-grid {
            grid-template-columns: 1fr;
          }
          .jx-help-banner {
            flex-direction: column;
            text-align: center;
            gap: 1.5rem;
          }
          .jx-help-banner-left {
            flex-direction: column;
          }
        }
        @media (max-width: 600px) {
          .jx-form-grid {
            grid-template-columns: 1fr;
          }
          .jx-features-row {
            grid-template-columns: 1fr;
          }
          .jx-contact-hero {
            flex-direction: column;
            text-align: center;
          }
          .jx-contact-hero-graphic {
            margin-top: 2rem;
          }
        }
      `}} />

      <div className="jx-contact-hero-wrapper">
        <section className="jx-contact-hero">
          <div className="jx-contact-hero-content">
            <h1>{tx({ en: "Contact Us", bn: "যোগাযোগ করুন" })}</h1>
            <p>
              {tx({
                en: "We're here to help, listen, and collaborate. Reach out to us for any questions, feedback, partnerships, or support.",
                bn: "যেকোনো প্রশ্ন, মতামত, অংশীদারিত্ব বা সাপোর্টের জন্য আমাদের সাথে যোগাযোগ করুন।"
              })}
            </p>
          </div>
          <div className="jx-contact-hero-graphic">
            <img src="/contact_logo.png" alt="Contact JachaiX" />
          </div>
        </section>
      </div>

      <div className="jx-contact-container">
        <div className="jx-contact-form-section">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            {tx({ en: "Send us a message", bn: "বার্তা পাঠান" })}
          </h2>
          <p>{tx({ en: "Fill out the form below and our team will get back to you as soon as possible.", bn: "নিচের ফর্মটি পূরণ করুন এবং আমাদের দল যত দ্রুত সম্ভব আপনার সাথে যোগাযোগ করবে।" })}</p>

          <form onSubmit={handleSubmit}>
            <div className="jx-form-grid">
              <div className="jx-form-group">
                <label>{tx({ en: "Full Name", bn: "পুরো নাম" })}</label>
                <input type="text" name="fullName" className="jx-input" placeholder={tx({ en: "Enter your full name", bn: "আপনার নাম লিখুন" })} value={formData.fullName} onChange={handleChange} required />
              </div>
              <div className="jx-form-group">
                <label>{tx({ en: "Email Address", bn: "ইমেইল ঠিকানা" })}</label>
                <input type="email" name="email" className="jx-input" placeholder={tx({ en: "Enter your email address", bn: "ইমেইল লিখুন" })} value={formData.email} onChange={handleChange} required />
              </div>
            </div>
            
            <div className="jx-form-group" style={{ marginBottom: '1.5rem' }}>
              <label>{tx({ en: "Subject", bn: "বিষয়" })}</label>
              <select name="subject" className="jx-input" value={formData.subject} onChange={handleChange} required>
                <option value="" disabled>{tx({ en: "Select a subject", bn: "বিষয় নির্বাচন করুন" })}</option>
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>

            <div className="jx-form-group" style={{ marginBottom: '1.5rem' }}>
              <label>{tx({ en: "Category", bn: "ক্যাটাগরি" })}</label>
              <select name="category" className="jx-input" value={formData.category} onChange={handleChange} required>
                <option value="" disabled>{tx({ en: "Select a category", bn: "ক্যাটাগরি নির্বাচন করুন" })}</option>
                <option value="feedback">Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="jx-form-group" style={{ marginBottom: '1.5rem' }}>
              <label>{tx({ en: "Message", bn: "বার্তা" })}</label>
              <textarea name="message" className="jx-input jx-textarea" placeholder={tx({ en: "Write your message here...", bn: "আপনার বার্তা এখানে লিখুন..." })} value={formData.message} onChange={handleChange} required />
            </div>

            <div className="jx-privacy-notice">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div>
                <strong>{tx({ en: "We value your privacy", bn: "আমরা আপনার গোপনীয়তা মূল্যায়ন করি" })}</strong>
                <p>{tx({ en: "Your information will be used only to respond to your inquiry.", bn: "আপনার তথ্য শুধুমাত্র আপনার প্রশ্নের উত্তর দিতে ব্যবহৃত হবে।" })}</p>
              </div>
            </div>

            {status === "success" && (
              <div style={{ background: "rgba(22,163,74,0.12)", border: "1px solid #16a34a", borderRadius: "8px", padding: "12px 16px", color: "#22c55e", fontSize: "0.92rem", marginBottom: "0.75rem" }}>
                ✓ Your message has been sent! We will get back to you within 24 hours.
              </div>
            )}
            {status === "error" && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: "8px", padding: "12px 16px", color: "#f87171", fontSize: "0.92rem", marginBottom: "0.75rem" }}>
                {errorMsg}
              </div>
            )}

            <button type="submit" className="jx-submit-btn" disabled={status === "sending"}>
              {status === "sending" ? (
                <>Sending…</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  {tx({ en: "Send Message", bn: "বার্তা পাঠান" })}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="jx-contact-info-section">
          <h3>{tx({ en: "Contact Information", bn: "যোগাযোগের তথ্য" })}</h3>
          <p>{tx({ en: "Choose the best way to reach us.", bn: "আমাদের সাথে যোগাযোগের সেরা উপায় বেছে নিন।" })}</p>

          <div className="jx-info-cards">
            <div className="jx-info-card">
              <div className="jx-info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="jx-info-content" style={{ flex: 1 }}>
                <h4>{tx({ en: "Email Us", bn: "ইমেইল করুন" })}</h4>
                <p>info@jachaix.com<br/>support@jachaix.com</p>
              </div>
              <span style={{ color: '#cbd5e1' }}>›</span>
            </div>

            <div className="jx-info-card">
              <div className="jx-info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="jx-info-content" style={{ flex: 1 }}>
                <h4>{tx({ en: "Call Us", bn: "কল করুন" })}</h4>
                <p>+880 1234-567890</p>
                <small>Sun - Thu, 9:00 AM - 6:00 PM (BST)</small>
              </div>
              <span style={{ color: '#cbd5e1' }}>›</span>
            </div>

            <div className="jx-info-card">
              <div className="jx-info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="jx-info-content" style={{ flex: 1 }}>
                <h4>{tx({ en: "Visit Us", bn: "পরিদর্শন করুন" })}</h4>
                <p>House 12, Road 5, Dhanmondi<br/>Dhaka 1205, Bangladesh</p>
              </div>
              <span style={{ color: '#cbd5e1' }}>›</span>
            </div>

            <div className="jx-info-card" style={{ cursor: 'default' }}>
              <div className="jx-info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="jx-info-content">
                <h4>{tx({ en: "Response Time", bn: "প্রতিক্রিয়ার সময়" })}</h4>
                <p>We typically respond within<br/>24 hours on business days.</p>
              </div>
            </div>
          </div>

          <div className="jx-urgent-box">
            <h4>{tx({ en: "Report Urgent Issues", bn: "জরুরী সমস্যা রিপোর্ট করুন" })}</h4>
            <p>{tx({ en: "Found a critical misinformation issue that needs immediate attention?", bn: "গুরুত্বপূর্ণ ভুল তথ্যের সমস্যা পেয়েছেন যা তাৎক্ষণিক মনোযোগ দাবি করে?" })}</p>
            <button className="jx-report-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {tx({ en: "Report Now", bn: "এখনই রিপোর্ট করুন" })}
            </button>
          </div>
        </div>
      </div>

      <div className="jx-features-row">
        <div className="jx-features-container">
          <div className="jx-feature">
            <div className="jx-feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h4>{tx({ en: "Human Support", bn: "মানব সাপোর্ট" })}</h4>
              <p>{tx({ en: "Talk to real people who care.", bn: "যারা যত্নশীল তাদের সাথে কথা বলুন।" })}</p>
            </div>
          </div>
          <div className="jx-feature">
            <div className="jx-feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h4>{tx({ en: "Trusted & Secure", bn: "বিশ্বস্ত ও নিরাপদ" })}</h4>
              <p>{tx({ en: "Your data is safe with us.", bn: "আপনার ডেটা আমাদের কাছে নিরাপদ।" })}</p>
            </div>
          </div>
          <div className="jx-feature">
            <div className="jx-feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h4>{tx({ en: "Quick Response", bn: "দ্রুত প্রতিক্রিয়া" })}</h4>
              <p>{tx({ en: "We aim to reply within 24 hours.", bn: "আমরা ২৪ ঘণ্টার মধ্যে উত্তর দেয়ার লক্ষ্য রাখি।" })}</p>
            </div>
          </div>
          <div className="jx-feature">
            <div className="jx-feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
            </div>
            <div>
              <h4>{tx({ en: "Open Collaboration", bn: "মুক্ত সহযোগিতা" })}</h4>
              <p>{tx({ en: "We welcome partnerships.", bn: "আমরা অংশীদারিত্বকে স্বাগত জানাই।" })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="jx-faq-section">
        <h2>{tx({ en: "Frequently Asked Questions", bn: "সচরাচর জিজ্ঞাসিত প্রশ্ন" })}</h2>
        <p>{tx({ en: "Find quick answers to common questions.", bn: "সাধারণ প্রশ্নের দ্রুত উত্তর খুঁজুন।" })}</p>
        
        <div className="jx-faq-grid">
          <div className="jx-faq-column">
            <div className="jx-faq-item-container">
              <div className="jx-faq-item" onClick={() => toggleFaq(1)}>
                <span>{tx({ en: "How can I submit a claim for verification?", bn: "যাচাইয়ের জন্য আমি কীভাবে একটি দাবি জমা দিতে পারি?" })}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openFaq === 1 ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {openFaq === 1 && (
                <div className="jx-faq-answer">
                  {tx({ 
                    en: "You can submit a claim by navigating to the 'Verify Claim' page from our navigation menu. Paste the link or text of the claim, and our system will begin the verification process using our AI and human reviewers.", 
                    bn: "আপনি আমাদের নেভিগেশন মেনু থেকে 'দাবি যাচাই করুন' পৃষ্ঠায় গিয়ে একটি দাবি জমা দিতে পারেন। দাবির লিঙ্ক বা টেক্সট পেস্ট করুন, এবং আমাদের সিস্টেম এআই এবং মানব পর্যালোচকদের ব্যবহার করে যাচাই প্রক্রিয়া শুরু করবে।" 
                  })}
                </div>
              )}
            </div>
            <div className="jx-faq-item-container">
              <div className="jx-faq-item" onClick={() => toggleFaq(2)}>
                <span>{tx({ en: "How long does verification take?", bn: "যাচাইকরণে কত সময় লাগে?" })}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openFaq === 2 ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {openFaq === 2 && (
                <div className="jx-faq-answer">
                  {tx({ 
                    en: "Initial automated verification provides instant preliminary results. Full human-verified fact-checking typically takes 24 to 48 hours depending on the complexity of the claim.", 
                    bn: "প্রাথমিক স্বয়ংক্রিয় যাচাইকরণ তাৎক্ষণিক প্রাথমিক ফলাফল প্রদান করে। দাবির জটিলতার উপর নির্ভর করে সম্পূর্ণ মানব-যাচাইকৃত ফ্যাক্ট-চেকিং করতে সাধারণত ২৪ থেকে ৪৮ ঘণ্টা সময় লাগে।" 
                  })}
                </div>
              )}
            </div>
            <div className="jx-faq-item-container">
              <div className="jx-faq-item" onClick={() => toggleFaq(3)}>
                <span>{tx({ en: "Can I provide additional evidence?", bn: "আমি কি অতিরিক্ত প্রমাণ সরবরাহ করতে পারি?" })}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openFaq === 3 ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {openFaq === 3 && (
                <div className="jx-faq-answer">
                  {tx({ 
                    en: "Yes! When submitting a claim, you can attach documents, links to credible sources, or images to support the fact-checking process.", 
                    bn: "হ্যাঁ! একটি দাবি জমা দেওয়ার সময়, আপনি ফ্যাক্ট-চেকিং প্রক্রিয়াকে সমর্থন করার জন্য নথি, বিশ্বাসযোগ্য সূত্রের লিঙ্ক বা ছবি সংযুক্ত করতে পারেন।" 
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="jx-faq-column">
            <div className="jx-faq-item-container">
              <div className="jx-faq-item" onClick={() => toggleFaq(4)}>
                <span>{tx({ en: "How can I report misinformation?", bn: "আমি কীভাবে ভুল তথ্যের প্রতিবেদন করতে পারি?" })}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openFaq === 4 ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {openFaq === 4 && (
                <div className="jx-faq-answer">
                  {tx({ 
                    en: "You can report misinformation by using the 'Report Now' button in the urgent issues section below, or by submitting the specific link through our Verify Claim portal.", 
                    bn: "আপনি নিচের জরুরী সমস্যা বিভাগের 'এখনই রিপোর্ট করুন' বোতামটি ব্যবহার করে বা আমাদের দাবি যাচাই পোর্টালের মাধ্যমে নির্দিষ্ট লিঙ্ক জমা দিয়ে ভুল তথ্যের প্রতিবেদন করতে পারেন।" 
                  })}
                </div>
              )}
            </div>
            <div className="jx-faq-item-container">
              <div className="jx-faq-item" onClick={() => toggleFaq(5)}>
                <span>{tx({ en: "Can I collaborate or partner with JachaiX?", bn: "আমি কি JachaiX-এর সাথে সহযোগিতা বা অংশীদারিত্ব করতে পারি?" })}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openFaq === 5 ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {openFaq === 5 && (
                <div className="jx-faq-answer">
                  {tx({ 
                    en: "Absolutely. We welcome partnerships with media organizations, researchers, and educational institutions. Please select 'Partnership' in the contact form above to get started.", 
                    bn: "অবশ্যই। আমরা মিডিয়া সংস্থা, গবেষক এবং শিক্ষা প্রতিষ্ঠানের সাথে অংশীদারিত্বকে স্বাগত জানাই। শুরু করতে উপরের যোগাযোগ ফর্মে 'অংশীদারিত্ব' নির্বাচন করুন।" 
                  })}
                </div>
              )}
            </div>
            <div className="jx-faq-item-container">
              <div className="jx-faq-item" onClick={() => toggleFaq(6)}>
                <span>{tx({ en: "Is my information kept confidential?", bn: "আমার তথ্য কি গোপন রাখা হয়?" })}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openFaq === 6 ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {openFaq === 6 && (
                <div className="jx-faq-answer">
                  {tx({ 
                    en: "Yes, we adhere to strict privacy standards. Any personal information submitted during a report or inquiry is kept strictly confidential and is only used to respond to your request.", 
                    bn: "হ্যাঁ, আমরা কঠোর গোপনীয়তা মান মেনে চলি। কোনো রিপোর্ট বা অনুসন্ধানের সময় জমা দেওয়া যেকোনো ব্যক্তিগত তথ্য কঠোরভাবে গোপন রাখা হয় এবং শুধুমাত্র আপনার অনুরোধের উত্তর দিতে ব্যবহৃত হয়।" 
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="jx-help-banner">
        <div className="jx-help-banner-left">
          <div className="jx-help-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <div>
            <h3>{tx({ en: "Still have questions?", bn: "এখনও প্রশ্ন আছে?" })}</h3>
            <p>{tx({ en: "Our support team is ready to help you.", bn: "আমাদের সাপোর্ট টিম আপনাকে সাহায্য করতে প্রস্তুত।" })}</p>
          </div>
        </div>
        <button className="jx-help-btn">
          {tx({ en: "Visit Help Center", bn: "হেল্প সেন্টার দেখুন" })} <span style={{ marginLeft: '0.5rem' }}>→</span>
        </button>
      </div>
    </main>
  );
}
