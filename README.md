# ZKTeco SenseFace 2A - Full Integration

A complete, production-ready system to integrate ZKTeco SenseFace 2A devices (ADMS / PUSH) with a Node.js + Express backend and MongoDB.

## Features

- ✅ Accept PUSH (ADMS) events from ZKTeco SenseFace 2A devices
- ✅ Store attendance logs in MongoDB
- ✅ Forward events to external systems via webhooks
- ✅ Admin APIs to manage devices and users
- ✅ Command queue system to send commands to devices
- ✅ Security features (rate limiting, JWT authentication, validation)
- ✅ Audit logging
- ✅ Production-ready error handling

## Prerequisites

- Node.js 18+ (with ES modules support)
- MongoDB 6.0+
- npm or yarn

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd Facerecgo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `MONGO_URI`: MongoDB connection string
   - `PORT`: Server port (default: 8090)
   - `JWT_SECRET`: Secret key for JWT tokens (change in production!)

4. **Start MongoDB:**
   Make sure MongoDB is running on your system:
   ```bash
   # macOS (if installed via Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Or run MongoDB in a container
   docker run -d -p 27017:27017 --name mongodb mongo:6
   ```

5. **Start the server:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### Device Endpoints (ZKTeco Communication)

These endpoints are used by ZKTeco devices:

- **GET `/iclock/ping`** - Device connectivity check
  ```bash
  curl http://localhost:8090/iclock/ping
  # Returns: OK
  ```

- **GET `/iclock/getrequest?SN=<device_sn>`** - Device polls for commands
  ```bash
  curl "http://localhost:8090/iclock/getrequest?SN=123456"
  ```

- **POST `/iclock/cdata`** - Receive attendance data from device
  ```bash
  curl -X POST http://localhost:8090/iclock/cdata \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data 'SN=123456&table=ATTLOG&CardNo=EMP100&Time=2025-01-15+12:00:00&Status=0&Verify=1'
  ```

### Admin Endpoints

All admin endpoints require JWT authentication. Get a token first:

```bash
# Login (placeholder - implement proper auth)
curl -X POST http://localhost:8090/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}'
```

Then use the token in subsequent requests:
```bash
curl -H "Authorization: Bearer <your-token>" http://localhost:8090/api/devices
```

#### Devices

- **POST `/api/devices`** - Register a new device
  ```json
  {
    "sn": "123456",
    "name": "Main Entrance",
    "ip": "192.168.1.100",
    "port": 80
  }
  ```

- **GET `/api/devices`** - List all devices
  - Query params: `page`, `limit`, `search`

- **GET `/api/devices/:sn`** - Get device by SN

- **PUT `/api/devices/:sn`** - Update device

- **DELETE `/api/devices/:sn`** - Delete device

#### Users

- **POST `/api/users`** - Create a new user
  ```json
  {
    "empId": "EMP001",
    "name": "John Doe",
    "cardNo": "12345",
    "devices": ["123456"]
  }
  ```

- **GET `/api/users`** - List all users
  - Query params: `page`, `limit`, `search`

- **GET `/api/users/:empId`** - Get user by employee ID

- **PUT `/api/users/:empId`** - Update user

- **DELETE `/api/users/:empId`** - Delete user

#### Attendance

- **GET `/api/attendance`** - Query attendance logs
  - Query params: `page`, `limit`, `deviceSN`, `empId`, `startDate`, `endDate`
  ```bash
  curl "http://localhost:8090/api/attendance?empId=EMP001&startDate=2025-01-01&endDate=2025-01-31" \
    -H "Authorization: Bearer <token>"
  ```

#### Commands

- **POST `/api/devices/:sn/command`** - Queue a command for device
  ```json
  {
    "command": "RESTART",
    "args": {}
  }
  ```

- **GET `/api/devices/:sn/commands`** - Get commands for a device

#### Webhooks

- **POST `/api/webhooks`** - Register a webhook
  ```json
  {
    "url": "https://example.com/webhook",
    "events": ["attendance", "device_status", "user_enrolled"],
    "secret": "your-webhook-secret"
  }
  ```

- **GET `/api/webhooks`** - List all webhooks

- **GET `/api/webhooks/:id/logs`** - Get webhook delivery logs

- **PUT `/api/webhooks/:id`** - Update webhook

- **DELETE `/api/webhooks/:id`** - Delete webhook

## Configuration

### Environment Variables

See `.env.example` for all available options:

- `MONGO_URI`: MongoDB connection string
- `PORT`: Server port
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: Secret for JWT tokens
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window
- `WEBHOOK_TIMEOUT_MS`: Webhook request timeout
- `WEBHOOK_MAX_RETRIES`: Max webhook retry attempts

## Security Features

1. **Rate Limiting**: Prevents abuse with configurable limits
2. **JWT Authentication**: Secure admin API access
3. **Input Validation**: Validates device SN and request data
4. **Body Size Limits**: Prevents large payload attacks
5. **Audit Logging**: Tracks all admin actions
6. **Device Validation**: Only registered devices can send data

## Database Schema

### Collections

- **devices**: Registered ZKTeco devices
- **users**: Employee/user information
- **attendance**: Attendance logs from devices
- **commands**: Queued commands for devices
- **webhooks**: Webhook configurations
- **webhook_logs**: Webhook delivery logs
- **audit_logs**: Admin action audit trail

## Testing

### Test Device Ping
```bash
curl http://localhost:8090/iclock/ping
```

### Simulate Attendance Data
```bash
curl -X POST http://localhost:8090/iclock/cdata \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'SN=TEST123&table=ATTLOG&CardNo=EMP001&Time=2025-01-15+10:30:00&Status=0&Verify=1'
```

### Test with ngrok (for devices behind NAT)

1. Install ngrok: `brew install ngrok` or download from ngrok.com
2. Start ngrok: `ngrok http 8090`
3. Use the ngrok URL in your device configuration

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if MongoDB is running
   - Verify `MONGO_URI` in `.env`
   - Check firewall settings

2. **Device Not Sending Data**
   - Verify device SN is registered
   - Check device server URL configuration
   - Review server logs for errors
   - Test with curl to verify endpoint works

3. **Wrong Payload Format**
   - Some firmware versions send different formats
   - Check `raw` field in attendance records
   - Adjust parsing logic in `routes/deviceRoutes.js` if needed

4. **Device Time Mismatch**
   - Queue a `SYNC_TIME` command
   - Or configure time sync in device UI

### Logs

Check console output for:
- Device ping requests
- Attendance data received
- Command processing
- Webhook delivery status
- Error messages

## Production Deployment

### Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Use HTTPS (TLS) - set up reverse proxy (Nginx)
- [ ] Configure firewall rules
- [ ] Set up proper authentication (replace placeholder login)
- [ ] Enable MongoDB authentication
- [ ] Set up monitoring and alerting
- [ ] Configure log rotation
- [ ] Set up database backups

### Recommended Setup

1. **Use PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start index.js --name zkteco-api
   pm2 save
   pm2 startup
   ```

2. **Set up Nginx reverse proxy** (for TLS termination)

3. **Configure MongoDB with authentication**

4. **Set up monitoring** (e.g., PM2 monitoring, MongoDB monitoring)

## Scaling & Reliability

- Use message queue (Redis/RabbitMQ) for webhook processing
- Deploy multiple instances behind load balancer
- Use MongoDB replica set for high availability
- Implement database indexes for performance
- Set up TTL indexes for data retention policies

## Next Steps

- Implement proper user authentication system
- Add user roles and permissions (RBAC)
- Create admin web UI
- Add real-time notifications (WebSocket)
- Implement data export features
- Add reporting and analytics

## License

MIT

## Support

For ZKTeco device-specific issues, refer to:
- ZKTeco documentation
- Device firmware version compatibility
- ZKBio API documentation


