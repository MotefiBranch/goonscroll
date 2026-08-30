import { nativeStorage } from './nativeStorage';

const REPO_OWNER = 'lalaliwe';
const REPO_NAME = 'goonscroll';
const FILE_PATH = 'sync/backup.json';

export async function nativePushToGitHub(token: string): Promise<{ success: boolean; updatedAt: string }> {
  if (!token) throw new Error('GitHub token is required');

  const backupData = nativeStorage.exportBackup();
  const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(backupData, null, 2))));

  // 1. Get existing file SHA if it exists
  let sha: string | undefined;
  try {
    const getRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GoonScroll-iOS',
      },
    });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }
  } catch (e) {}

  // 2. Commit / update the backup file in repository
  const putRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'GoonScroll-iOS',
    },
    body: JSON.stringify({
      message: `Cloud Sync from GoonScroll iOS [${new Date().toISOString()}]`,
      content: contentBase64,
      sha,
    }),
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub Sync failed (${putRes.status}): ${errText}`);
  }

  const updatedAt = new Date().toISOString();
  return { success: true, updatedAt };
}

export async function nativePullFromGitHub(token: string): Promise<{ success: boolean; result: any; updatedAt: string }> {
  if (!token) throw new Error('GitHub token is required');

  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GoonScroll-iOS',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to pull backup from GitHub repository (${res.status})`);
  }

  const fileData = await res.json();
  const rawJson = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
  const backup = JSON.parse(rawJson);

  nativeStorage.importBackup(backup);
  return { success: true, result: backup, updatedAt: new Date().toISOString() };
}
