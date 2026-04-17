const axios = require('axios');

const BASE_URL = 'https://platform.plaud.ai/developer/api';

function client() {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.PLAUD_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
}

async function getRecentFiles(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceTs = Math.floor(since.getTime() / 1000);

  const res = await client().get('/file/simple/web', {
    params: { skip: 0, limit: 500, is_trash: 0, sort_by: 'edit_time', is_desc: true },
  });

  const files = res.data?.data ?? res.data ?? [];
  return files.filter((f) => {
    const ts = f.start_time ?? f.edit_time ?? 0;
    return ts >= sinceTs;
  });
}

async function getFileSummary(fileId) {
  const res = await client().get(`/file/detail/${fileId}`);
  const detail = res.data?.data ?? res.data ?? {};
  return {
    id: fileId,
    name: detail.filename ?? detail.name ?? fileId,
    date: detail.start_time
      ? new Date(detail.start_time * 1000).toLocaleDateString('en-US', { dateStyle: 'medium' })
      : 'Unknown date',
    summary: detail.ai_content ?? detail.summary ?? null,
  };
}

module.exports = { getRecentFiles, getFileSummary };
