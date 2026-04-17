const axios = require('axios');

const BASE_URL = 'https://api.plaud.ai';

function client() {
  const raw = process.env.PLAUD_TOKEN ?? '';
  const token = raw.toLowerCase().startsWith('bearer ')
    ? raw.slice(7).trim()
    : raw.trim();

  return axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function getRecentFiles(days = 7) {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;

  const res = await client().get('/file/simple/web', {
    params: { skip: 0, limit: 500, is_trash: 0, sort_by: 'edit_time', is_desc: true },
  });

  const files = res.data?.data_file_list ?? [];
  return files.filter((f) => {
    // start_time is in milliseconds
    return f.is_summary && (f.start_time ?? 0) >= since;
  });
}

async function getFileSummary(file) {
  const res = await client().get(`/file/detail/${file.id}`);
  const detail = res.data?.data ?? {};

  const summaryItem = (detail.content_list ?? []).find(
    (c) => c.data_type === 'auto_sum_note'
  );

  let summaryText = null;
  if (summaryItem?.data_link) {
    const s3 = await axios.get(summaryItem.data_link);
    summaryText = s3.data?.ai_content ?? null;
  }

  return {
    id: file.id,
    name: detail.file_name ?? file.filename ?? file.id,
    date: new Date(file.start_time).toLocaleDateString('en-US', { dateStyle: 'medium' }),
    summary: summaryText,
  };
}

module.exports = { getRecentFiles, getFileSummary };
