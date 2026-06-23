const MAX_QQ_MESSAGE_TEXT_LENGTH = 1000

function getAllowedQqGroupIds() {
  const rawGroupIds = process.env.ALLOWED_QQ_GROUP_IDS || ''

  return rawGroupIds
    .split(',')
    .map((groupId) => groupId.trim())
    .filter(Boolean)
}

function buildQqGroupMemoryUserId(groupId) {
  return `qq_group_${groupId}`
}

export function parseOnebotGroupMessageEvent(event) {
  if (event === null || typeof event !== 'object') {
    return {
      shouldProcess: false,
      reason: 'Invalid event body'
    }
  }

  if (event.post_type !== 'message') {
    return {
      shouldProcess: false,
      reason: 'Ignored non-message event'
    }
  }

  if (event.message_type !== 'group') {
    return {
      shouldProcess: false,
      reason: 'Ignored non-group message'
    }
  }

  const groupId = String(event.group_id || '').trim()
  const qqUserId = String(event.user_id || '').trim()
  const messageText =
    typeof event.raw_message === 'string' ? event.raw_message.trim() : ''

  if (!groupId) {
    return {
      shouldProcess: false,
      reason: 'Missing group_id'
    }
  }

  const allowedQqGroupIds = getAllowedQqGroupIds()

  if (!allowedQqGroupIds.includes(groupId)) {
    return {
      shouldProcess: false,
      reason: 'Group is not allowed',
      groupId: groupId,
      qqUserId: qqUserId
    }
  }

  if (!messageText) {
    return {
      shouldProcess: false,
      reason: 'Empty message',
      groupId: groupId,
      qqUserId: qqUserId
    }
  }

  if (messageText.length > MAX_QQ_MESSAGE_TEXT_LENGTH) {
    return {
      shouldProcess: false,
      reason: 'Message is too long',
      groupId: groupId,
      qqUserId: qqUserId
    }
  }

  return {
    shouldProcess: true,
    groupId: groupId,
    qqUserId: qqUserId,
    memoryUserId: buildQqGroupMemoryUserId(groupId),
    messageText: messageText
  }
}
