/**
 * FCM Notification Service for CityCare Backend
 * Handles sending push notifications to mobile devices via Firebase Cloud Messaging
 * 
 * Usage:
 *   const { sendNotification, sendToTopic, sendToDevice } = require('./services/fcmService');
 *   
 *   // Send to specific device
 *   await sendToDevice(deviceToken, 'New Report', 'A new waste report has been submitted');
 *   
 *   // Send to all residents
 *   await sendToTopic('residents', 'Announcement', 'Important update from CLENRO');
 */

const { messaging } = require('../config/firebase');

/**
 * Send notification to a specific device
 * @param {string} deviceToken - FCM registration token from mobile device
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 * @param {object} notification - Optional custom notification payload
 * @returns {Promise<object>} - FCM response
 */
const sendToDevice = async (deviceToken, title, body, data = {}, notification = null) => {
  try {
    const message = {
      notification: notification || {
        title: title,
        body: body
      },
      data: data,
      token: deviceToken
    };
    
    const response = await messaging.send(message);
    console.log(`✅ FCM sent to device: ${deviceToken}`, response);
    return response;
  } catch (error) {
    console.error('❌ FCM send to device error:', error);
    
    // Handle specific FCM errors
    if (error.code === 'messaging/registration-token-not-registered') {
      console.log('Device token is no longer valid. User should refresh token.');
      // You might want to remove this token from your database
    }
    
    throw error;
  }
};

/**
 * Send notification to a topic (e.g., all residents)
 * @param {string} topic - Topic name (e.g., 'residents', 'barangay_carmen')
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 * @returns {Promise<object>} - FCM response
 */
const sendToTopic = async (topic, title, body, data = {}) => {
  try {
    const message = {
      notification: {
        title: title,
        body: body
      },
      data: data,
      topic: topic
    };
    
    const response = await messaging.sendToTopic(topic, message);
    console.log(`✅ FCM sent to topic: ${topic}`, response);
    return response;
  } catch (error) {
    console.error('❌ FCM send to topic error:', error);
    throw error;
  }
};

/**
 * Send notification to multiple devices
 * @param {string[]} deviceTokens - Array of FCM registration tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 * @returns {Promise<object>} - FCM batch response
 */
const sendToDevices = async (deviceTokens, title, body, data = {}) => {
  try {
    const messages = deviceTokens.map(token => ({
      notification: {
        title: title,
        body: body
      },
      data: data,
      token: token
    }));
    
    const response = await messaging.sendEachForMulticast(messages);
    console.log(`✅ FCM sent to ${deviceTokens.length} devices`, response);
    
    // Log failed tokens
    if (response.failureCount > 0) {
      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          console.warn(`Failed to send to token ${deviceTokens[index]}: ${resp.error?.message}`);
        }
      });
    }
    
    return response;
  } catch (error) {
    console.error('❌ FCM send to devices error:', error);
    throw error;
  }
};

/**
 * Send a notification with custom payload
 * @param {string} deviceToken - FCM registration token
 * @param {object} payload - Complete FCM payload
 * @returns {Promise<object>} - FCM response
 */
const sendNotification = async (deviceToken, payload) => {
  try {
    const message = {
      ...payload,
      token: deviceToken
    };
    
    const response = await messaging.send(message);
    console.log(`✅ FCM custom notification sent:`, response);
    return response;
  } catch (error) {
    console.error('❌ FCM custom notification error:', error);
    throw error;
  }
};

/**
 * Send a data message (notification without visible notification)
 * @param {string} deviceToken - FCM registration token
 * @param {object} data - Data payload to send
 * @returns {Promise<object>} - FCM response
 */
const sendDataMessage = async (deviceToken, data) => {
  try {
    const message = {
      data: data,
      token: deviceToken
    };
    
    const response = await messaging.send(message);
    console.log(`✅ FCM data message sent:`, response);
    return response;
  } catch (error) {
    console.error('❌ FCM data message error:', error);
    throw error;
  }
};

module.exports = {
  sendToDevice,
  sendToTopic,
  sendToDevices,
  sendNotification,
  sendDataMessage,
  messaging // Export raw messaging for advanced use
};
