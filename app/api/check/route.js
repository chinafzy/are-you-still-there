// 对应文件路径: app/api/check/route.js
// 此接口应由 Zeabur Cron 或 GitHub Actions 每 30 分钟调用一次
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req) {
  try {
    // 1. 获取所有活跃状态的用户
    const { data: users, error } = await supabase
      .from('user_safety')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    const now = new Date();
    const results = [];

    for (const user of users) {
      const lastCheck = new Date(user.last_check_in);
      const diffMs = now - lastCheck;
      const thresholdMs = user.interval_hours * 60 * 60 * 1000;

      if (diffMs > thresholdMs) {
        // 2. 触发警报：发送邮件
        await resend.emails.send({
          from: 'Guardian <onboarding@resend.dev>',
          to: user.contact_email,
          subject: `[紧急通知] 您的好友 ${user.user_name || '一位用户'} 的状态提醒`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
              <h2 style="color: #333;">安全提醒</h2>
              <p>您好，我是 "Project Connection" 独居守护系统。</p>
              <p>您的好友 <strong>${user.user_name}</strong> 设置了定期安全打卡协议，但目前已超过 <strong>${user.interval_hours}小时</strong> 未收到其反馈。</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #666; font-style: italic;">其预设留给您的信息：</p>
              <blockquote style="background: #f9f9f9; padding: 15px; border-left: 4px solid #3b82f6;">
                ${user.testament || '（未设置留言内容）'}
              </blockquote>
              <p style="font-size: 12px; color: #999; margin-top: 30px;">
                提示：请尝试通过电话或其他方式联系对方。如果这只是一个误会，请告知其登录应用重置状态。
              </p>
            </div>
          `
        });

        // 3. 更新状态，避免重复发送
        await supabase
          .from('user_safety')
          .update({ status: 'triggered' })
          .eq('user_id', user.user_id);
          
        results.push({ user: user.user_id, status: 'notified' });
      }
    }

    return Response.json({ processed: users.length, triggered: results });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
