import axios from 'axios';
import Webhook from '../models/Webhook.js';
import WebhookLog from '../models/WebhookLog.js';
import dotenv from 'dotenv';

dotenv.config();

const WEBHOOK_TIMEOUT = parseInt(process.env.WEBHOOK_TIMEOUT_MS) || 5000;
const WEBHOOK_MAX_RETRIES = parseInt(process.env.WEBHOOK_MAX_RETRIES) || 3;

/**
 * Forward event to all active webhooks
 */
export async function forwardToWebhooks(event, payload) {
    try {
        const webhooks = await Webhook.find({ 
            active: true,
            events: event 
        });

        const promises = webhooks.map(webhook => 
            sendWebhook(webhook, event, payload)
        );

        await Promise.allSettled(promises);
    } catch (error) {
        console.error('Error forwarding webhooks:', error);
    }
}

/**
 * Send webhook to a single endpoint
 */
async function sendWebhook(webhook, event, payload) {
    const log = await WebhookLog.create({
        webhookId: webhook._id,
        url: webhook.url,
        event: event,
        payload: payload,
        status: 'pending'
    });

    try {
        const response = await axios.post(
            webhook.url,
            {
                event: event,
                timestamp: new Date().toISOString(),
                data: payload
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Secret': webhook.secret || '',
                    'User-Agent': 'ZKTeco-Integration/1.0'
                },
                timeout: WEBHOOK_TIMEOUT,
                validateStatus: (status) => status < 500 // Don't throw on 4xx
            }
        );

        await WebhookLog.findByIdAndUpdate(log._id, {
            status: 'success',
            statusCode: response.status,
            response: JSON.stringify(response.data),
            processedAt: new Date()
        });

        return { success: true, logId: log._id };
    } catch (error) {
        const statusCode = error.response?.status || 0;
        const retries = log.retries + 1;

        await WebhookLog.findByIdAndUpdate(log._id, {
            status: retries >= WEBHOOK_MAX_RETRIES ? 'failed' : 'pending',
            statusCode: statusCode,
            response: error.message,
            retries: retries,
            processedAt: new Date()
        });

        // Retry if not exceeded max retries
        if (retries < WEBHOOK_MAX_RETRIES) {
            setTimeout(() => {
                sendWebhook(webhook, event, payload);
            }, 1000 * retries); // Exponential backoff
        }

        return { success: false, error: error.message, logId: log._id };
    }
}

/**
 * Get webhook logs
 */
export async function getWebhookLogs(filters = {}) {
    const query = {};
    
    if (filters.webhookId) query.webhookId = filters.webhookId;
    if (filters.status) query.status = filters.status;
    if (filters.event) query.event = filters.event;
    if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    return await WebhookLog.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 100)
        .populate('webhookId', 'url');
}


