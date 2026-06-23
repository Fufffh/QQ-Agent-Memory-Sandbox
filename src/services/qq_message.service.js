const MAX_QQ_MESSAGE_TEXT_LENGTH = 1000

function getAllowedQqGroupIds() {
  const rawGroupIds = process.env.ALLOWED_QQ_GROUP_IDS || ''

  return rawGroupIds
    .split(',')
    .map((groupId) => groupId.trim())
    .filter(Boolean)
}

function buildQqGroupMemberMemoryUserId(groupId, qqUserId) {
  return `qq_group_${groupId}_user_${qqUserId}`
}

function getSenderName(sender, qqUserId) {
  if (sender === null || typeof sender !== 'object') {
    return `QQ user ${qqUserId}`
  }

  if (typeof sender.card === 'string' && sender.card.trim()) {
    return sender.card.trim()
  }

  if (typeof sender.nickname === 'string' && sender.nickname.trim()) {
    return sender.nickname.trim()
  }

  return `QQ user ${qqUserId}`
}

function buildMemoryMessageText(senderName, qqUserId, messageText) {
  return [
    `Speaker: ${senderName} (${qqUserId})`,
    `Message: ${messageText}`
  ].join('\n')
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
  const senderName = getSenderName(event.sender, qqUserId)

  if (!groupId) {
    return {
      shouldProcess: false,
      reason: 'Missing group_id'
    }
  }

  if (!qqUserId) {
    return {
      shouldProcess: false,
      reason: 'Missing user_id',
      groupId: groupId
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
    senderName: senderName,
    memoryUserId: buildQqGroupMemberMemoryUserId(groupId, qqUserId),
    messageText: buildMemoryMessageText(senderName, qqUserId, messageText),
    rawMessage: messageText
  }
}
