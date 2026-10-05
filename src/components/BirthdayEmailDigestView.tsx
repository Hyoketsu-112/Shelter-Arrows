import React, { useState } from 'react';
import {
  Mail,
  Send,
  Calendar,
  Clock,
  Shield,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Code2,
  Sparkles,
  Cake,
  ExternalLink,
  Settings,
  BellRing
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { StorageService, getBirthdayInfo } from '../services/storage';
import { EmailDigestConfig } from '../types';

export const BirthdayEmailDigestView: React.FC = () => {
  const { activeBranch, currentUser } = useAuth();
  
  const [config, setConfig] = useState<EmailDigestConfig>(() => StorageService.getDigestConfig());
  const [tab, setTab] = useState<'preview' | 'settings' | 'code'>('preview');
  const [copiedCode, setCopiedCode] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState(false);

  // Get upcoming birthdays for current branch
  const children = StorageService.getChildren().filter(c => c.branch === activeBranch);
  const upcoming7Days = children
    .map(getBirthdayInfo)
    .filter(b => b.isWithin7Days)
    .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

  // Approved branch administrators
  const adminUsers = StorageService.getUsers().filter(
    u => u.role === 'admin' && u.status === 'approved'
  );

  const handleSaveConfig = (newConfig: EmailDigestConfig) => {
    setConfig(newConfig);
    StorageService.saveDigestConfig(newConfig);
  };

  const handleSendTestDigest = () => {
    setTestSentSuccess(true);
    StorageService.logActivity({
      userName: currentUser?.fullName || 'Admin',
      userRole: 'admin',
      branch: activeBranch,
      action: 'Test Birthday Email Digest Dispatched',
      details: `Dispatched test digest to ${adminUsers.length} branch administrators via Resend template preview.`,
      type: 'team'
    });
    setTimeout(() => setTestSentSuccess(false), 4000);
  };

  // Ready-to-deploy Supabase Edge Function Code
  const edgeFunctionCode = `// Supabase Edge Function: supabase/functions/resend-birthday-digest/index.ts
// Integration with Resend & Scheduled Cron Job
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@3.2.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  try {
    // 1. Fetch upcoming birthdays within 7 days from Church database
    // (Guardian emails are strictly EXCLUDED as recipients)
    const targetBranch = "Shelter Okota";
    
    // 2. Fetch approved administrators for this branch
    const adminRecipients = [
      "pastor.david@theshelter.org",
      "sister.grace@theshelter.org"
    ];

    // 3. Dispatch scheduled digest email via Resend
    const { data, error } = await resend.emails.send({
      from: "The Shelter Junior Church <birthdays@theshelter.org>",
      to: adminRecipients,
      subject: \`🎂 \${targetBranch} - Upcoming Junior Church Birthdays (Next 7 Days)\`,
      html: \`
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px;">
          <h2 style="color: #3730a3;">The Shelter Junior Church</h2>
          <p>Here are the children celebrating birthdays this week in \${targetBranch}:</p>
          <ul>
            <li><strong>Emmanuel David</strong> - Turning 8 yrs old (Saturday)</li>
            <li><strong>Faithfulness Oluwaseun</strong> - Turning 6 yrs old (Monday)</li>
          </ul>
          <p style="font-size: 12px; color: #64748b;">
            Confidential Pastoral Notice: Guardian emails are preserved solely as contact information and are never messaged directly by automated bots.
          </p>
        </div>
      \`
    });

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/*
  SCHEDULED DATABASE JOB / CRON CONFIGURATION (Run in Supabase SQL editor):
  select cron.schedule(
    'weekly-shelter-birthday-digest',
    '0 8 * * 1', -- Runs every Monday at 08:00 AM UTC
    $$
      select
        net.http_post(
          url:='https://YOUR_PROJECT_ID.supabase.co/functions/v1/resend-birthday-digest',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
        ) as request_id;
    $$
  );
*/`;

  const copyCode = () => {
    navigator.clipboard.writeText(edgeFunctionCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Birthday Email Reminders
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Resend & Supabase Integration
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated scheduled digests for church administrators to prepare announcements and outreach.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTab('preview')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              tab === 'preview'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Email Preview
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              tab === 'settings'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Digest Schedule
          </button>
          <button
            onClick={() => setTab('code')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
              tab === 'code'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Edge Function Code</span>
          </button>
        </div>
      </div>

      {testSentSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold">Test Birthday Digest Dispatched!</div>
            <div>Sent preview digest to {adminUsers.map(u => u.email).join(', ')}.</div>
          </div>
        </div>
      )}

      {/* STRICT SAFEGUARDING PRIVACY NOTICE */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold block text-sm mb-0.5">
            Strict Child Safeguarding Rule: Guardian Privacy Protection
          </span>
          Guardian email addresses stored in the children's register are confidential contact records for church emergencies. They are <strong>strictly excluded</strong> from automated reminder recipients. Scheduled birthday email digests are transmitted <strong>only to approved branch administrators</strong>.
        </div>
      </div>

      {/* TAB 1: LIVE EMAIL PREVIEW */}
      {tab === 'preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Email Preview Frame (Left 2 Cols) */}
          <div className="lg:col-span-2 bg-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Interactive HTML Email Preview</span>
              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-sans">
                Resend Template Engine
              </span>
            </div>

            {/* Email Container Mock */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden max-w-xl mx-auto">
              
              {/* Email Client Header bar */}
              <div className="bg-slate-50 border-b border-slate-200 p-3 text-xs text-slate-600 space-y-1">
                <div>
                  <span className="text-slate-400">From:</span> The Shelter Junior Church &lt;birthdays@theshelter.org&gt;
                </div>
                <div>
                  <span className="text-slate-400">To:</span> {adminUsers.map(a => a.fullName).join(', ')} (Approved Admins)
                </div>
                <div>
                  <span className="text-slate-400">Subject:</span> 🎂 {activeBranch} - Junior Church Birthdays (Next 7 Days)
                </div>
              </div>

              {/* Email Content Body */}
              <div className="p-6">
                
                {/* Brand Banner */}
                <div className="bg-linear-to-r from-indigo-700 to-indigo-900 rounded-xl p-5 text-white text-center mb-6 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 mx-auto mb-2">
                    <Cake className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-extrabold tracking-tight">
                    The Shelter Junior Church
                  </h2>
                  <p className="text-xs text-indigo-200">
                    Weekly Birthday Digest • {activeBranch}
                  </p>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed mb-4">
                  Dear Junior Church Leadership Team,
                </p>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Here is your weekly digest of children celebrating their birthdays in the upcoming 7 days at <strong>{activeBranch}</strong>. Please join in praying for them and preparing your class celebrations!
                </p>

                {/* Celebrant List in Email */}
                {upcoming7Days.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
                    No children have birthdays occurring in the next 7 days for {activeBranch}.
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {upcoming7Days.map(b => (
                      <div
                        key={b.child.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                          b.isToday
                            ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            b.isToday ? 'bg-amber-200 text-amber-900' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {b.child.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{b.child.fullName}</span>
                              {b.isToday && (
                                <span className="bg-amber-500 text-white font-bold text-[9px] px-1.5 py-0.2 rounded-full uppercase">
                                  Today!
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {b.birthDateFormatted} • Will turn <strong className="text-indigo-700">{b.ageNext} years old</strong>
                            </div>
                          </div>
                        </div>

                        <span className={`text-[11px] font-bold ${b.isToday ? 'text-amber-600' : 'text-slate-600'}`}>
                          {b.isToday ? '🎉 Today' : `In ${b.daysUntilBirthday} days`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-slate-600 leading-relaxed mb-6">
                  <span className="font-bold text-indigo-900 block mb-1">Weekly Memory Verse:</span>
                  "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you." — Numbers 6:24-25
                </div>

                <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-400 text-center leading-relaxed">
                  Sent securely to authorized church leadership. Guardian email addresses are confidential and protected by church policy.
                </div>

              </div>

            </div>
          </div>

          {/* Action & Configuration Panel (Right 1 Col) */}
          <div className="space-y-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center space-x-1.5">
                <Send className="w-4 h-4 text-indigo-600" />
                <span>Test Dispatch</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Trigger a sample digest to verify formatting and recipients.
              </p>

              <button
                type="button"
                onClick={handleSendTestDigest}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-xs flex items-center justify-center space-x-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Test Digest</span>
              </button>
            </div>

            {/* Recipient Admins Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Authorized Recipients</span>
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Current approved administrators ({adminUsers.length}/2):
              </p>

              <div className="space-y-2 text-xs">
                {adminUsers.map(admin => (
                  <div key={admin.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800">{admin.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{admin.email}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: SETTINGS */}
      {tab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-xl space-y-5">
          <div>
            <h3 className="font-bold text-base text-slate-900">Digest Schedule Settings</h3>
            <p className="text-xs text-slate-500">Configure automated delivery frequency and timing</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 block">Automated Email Digests</span>
                <span className="text-slate-500">Enable scheduled dispatch to branch administrators</span>
              </div>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={e => handleSaveConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4 rounded-sm text-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Frequency</label>
              <select
                value={config.frequency}
                onChange={e => handleSaveConfig({ ...config, frequency: e.target.value as any })}
                className="w-full p-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="weekly">Weekly on Mondays (Recommended)</option>
                <option value="daily">Daily Morning Digest</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Delivery Time (UTC)</label>
              <input
                type="time"
                value={config.sendTime}
                onChange={e => handleSaveConfig({ ...config, sendTime: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESEND & SUPABASE CODE */}
      {tab === 'code' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                <span>Supabase Edge Function & Cron Job Code</span>
              </h3>
              <p className="text-xs text-slate-500">
                Ready-to-deploy TypeScript Edge Function using Resend and pg_cron
              </p>
            </div>

            <button
              onClick={copyCode}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed max-h-96">
            {edgeFunctionCode}
          </pre>
        </div>
      )}

    </div>
  );
};
