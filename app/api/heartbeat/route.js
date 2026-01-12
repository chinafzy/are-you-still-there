// 对应文件路径: app/api/heartbeat/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { userId } = await req.json();
    
    const { error } = await supabase
      .from('user_safety')
      .update({ last_check_in: new Date(), status: 'active' })
      .eq('user_id', userId);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const config = await req.json();
    
    // 使用 upsert: 如果用户存在则更新，不存在则创建
    const { error } = await supabase
      .from('user_safety')
      .upsert({
        user_id: config.userId,
        user_name: config.userName,
        interval_hours: config.checkInInterval,
        contact_name: config.contactName,
        contact_email: config.contactEmail,
        testament: config.testament,
        last_check_in: new Date(),
        status: 'active'
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
