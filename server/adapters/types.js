/**
 * Helper utilities for adapters to normalize tags, media types, and queries.
 */

export function buildQueryTags(userTags = '', blacklist = []) {
  const userList = (userTags || '').trim().split(/\s+/).filter(Boolean);
  const negativeList = (blacklist || []).map(t => `-${t.trim().toLowerCase()}`).filter(Boolean);

  // Combine user tags and blacklist exclusions
  const combined = [...userList, ...negativeList];
  return combined.join(' ');
}

export function detectMediaType(url = '') {
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov')) {
    return 'video';
  }
  if (cleanUrl.endsWith('.gif')) {
    return 'gif';
  }
  return 'image';
}

export function normalizeRating(rating = '') {
  const r = (rating || '').toLowerCase();
  if (r === 'explicit' || r === 'e') return 'e';
  if (r === 'questionable' || r === 'q') return 'q';
  if (r === 'safe' || r === 'general' || r === 's' || r === 'g') return 's';
  return 'e'; // default adult content
}

export function filterOutBlacklisted(items = [], blacklist = []) {
  if (!blacklist || blacklist.length === 0) return items;
  const blacklistSet = new Set(blacklist.map(t => t.toLowerCase().trim()));

  return items.filter(item => {
    if (!item.tags || !item.tags.all) return true;
    for (const tag of item.tags.all) {
      if (blacklistSet.has(tag.toLowerCase().trim())) {
        return false;
      }
    }
    return true;
  });
}
