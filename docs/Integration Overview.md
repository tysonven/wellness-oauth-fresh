# WellnessLiving to GoHighLevel Integration Overview

## Introduction

This document provides an overview of the integration between WellnessLiving and GoHighLevel, explaining the purpose, architecture, data flow, and key components of the integration.

## Purpose

The WellnessLiving to GoHighLevel integration enables businesses to synchronize data between WellnessLiving (a business management platform for wellness businesses) and GoHighLevel (a marketing automation and CRM platform). This integration allows businesses to:

1. Maintain a single source of truth for customer data
2. Automate marketing and communication workflows based on WellnessLiving activities
3. Synchronize appointment bookings, class schedules, and service offerings between systems
4. Leverage GoHighLevel's marketing capabilities while using WellnessLiving's specialized wellness business management features

## Architecture Overview

The integration follows a client-server architecture with a middleware layer that handles authentication, data mapping, and synchronization between the two platforms:

```
┌─────────────────┐      ┌───────────────────────────┐      ┌────────────────┐
│                 │      │                           │      │                │
│  WellnessLiving │◄────►│  Integration Middleware   │◄────►│  GoHighLevel   │
│     API         │      │                           │      │     API        │
│                 │      │                           │      │                │
└─────────────────┘      └───────────────────────────┘      └────────────────┘
```

### Key Components

1. **WellnessLivingClient**: Handles authentication and communication with the WellnessLiving API Proxy
2. **GoHighLevelClient**: Manages authentication and communication with the GoHighLevel API
3. **DataMapper**: Transforms data between WellnessLiving and GoHighLevel formats
4. **SyncManager**: Orchestrates the synchronization process and handles error recovery
5. **Configuration**: Manages environment-specific settings and credentials

## Authentication

### WellnessLiving Authentication

The integration uses OAuth2 client credentials flow to authenticate with the WellnessLiving API Proxy:

1. Client credentials (client ID and client secret) are securely stored in configuration
2. The integration requests an access token from WellnessLiving's token endpoint
3. The token is automatically refreshed when it expires
4. All API requests include the access token in the Authorization header

### Cloudflare Security Bypass

WellnessLiving's API is protected by Cloudflare security. To bypass this security layer, the integration includes a custom header in all API requests:

```
x-firewall-rule: MorningLightStudio-HJutxWaYn5-flag
```

This header was provided by WellnessLiving support and allows the integration to access the API without IP whitelisting, making it compatible with serverless environments like Vercel.

### GoHighLevel Authentication

The integration uses API key authentication for GoHighLevel:

1. An API key is securely stored in configuration
2. All API requests include the API key in the Authorization header

## Data Flow

The integration synchronizes the following data types between WellnessLiving and GoHighLevel:

1. **Locations**: Physical business locations
2. **Services**: Appointment services offered by the business
3. **Staff**: Staff members who provide services
4. **Classes**: Group fitness or wellness classes
5. **Clients**: Customer information
6. **Appointments**: Scheduled appointments between clients and staff

The data flow follows this general pattern:

1. Fetch data from WellnessLiving API
2. Transform data using the DataMapper
3. Create or update corresponding data in GoHighLevel
4. Store mapping information for future synchronization

## Synchronization Process

The integration supports both full synchronization and incremental updates:

1. **Full Sync**: Synchronizes all data between systems, typically run during initial setup
2. **Incremental Sync**: Synchronizes only changed data, run on a scheduled basis

The synchronization process includes:

1. Error handling and retry logic for transient failures
2. Batch processing to handle large datasets efficiently
3. Logging and monitoring for troubleshooting

## Deployment

The integration is designed to be deployed as a serverless application on Vercel, with the following considerations:

1. Environment variables for secure credential storage
2. Scheduled functions for regular synchronization
3. Webhook endpoints for real-time updates
4. Cloudflare bypass header for reliable API access regardless of server IP

## Next Steps

The integration is currently in the final testing phase, with the following steps remaining:

1. Complete end-to-end testing with real data
2. Obtain production credentials from WellnessLiving
3. Implement scheduled sync process
4. Deploy to production environment

## References

- [WellnessLiving API Documentation](https://wellnessliving.com/api/documentation)
- [GoHighLevel API Documentation](https://developers.gohighlevel.com)
