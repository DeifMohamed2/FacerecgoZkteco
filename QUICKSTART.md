# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB running (local or remote)

## Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/zkteco
   PORT=8090
   NODE_ENV=development
   JWT_SECRET=change-this-to-a-random-secret-in-production
   ```

3. **Start MongoDB:**
   ```bash
   # macOS (Homebrew)
   brew services start mongodb-community
   
   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:6
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

   You should see:
   ```
   ✓ Connected to MongoDB
   ✓ Server running on port 8090
   ```

## Quick Test

1. **Test device ping:**
   ```bash
   curl http://localhost:8090/iclock/ping
   # Should return: OK
   ```

2. **Register a device:**
   ```bash
   # First, get a token
   curl -X POST http://localhost:8090/api/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"username":"admin","password":"admin"}'
   
   # Use the token to register device
   curl -X POST http://localhost:8090/api/devices \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{"sn":"123456","name":"Test Device","ip":"192.168.1.100"}'
   ```

3. **Simulate attendance:**
   ```bash
   curl -X POST http://localhost:8090/iclock/cdata \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     --data 'SN=123456&table=ATTLOG&CardNo=EMP001&Time=2025-01-15+10:30:00&Status=0&Verify=1'
   ```

## Device Configuration

In your ZKTeco SenseFace 2A device:

1. Go to **Communication** settings
2. Set **Server IP** to your server's IP address or domain
3. Set **Server Port** to `8090` (or your configured PORT)
4. Set **Server Path** to `/iclock/cdata`
5. Enable **ADMS/PUSH** mode
6. Set **Device SN** (must match the SN you register in the API)

## Next Steps

- Read the full [README.md](README.md) for detailed API documentation
- Configure webhooks for event forwarding
- Set up proper authentication (replace placeholder login)
- Review security settings for production

## Troubleshooting

- **Can't connect to MongoDB**: Check if MongoDB is running and MONGO_URI is correct
- **Port already in use**: Change PORT in .env file
- **Device not sending data**: Verify device SN is registered and server URL is correct


