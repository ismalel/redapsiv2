# REDAPSI v2 - Postman Collection

This directory contains the Postman collection and environment files for the REDAPSI v2 API.

## Files
- `redapsi.postman_collection.json`: The API collection with all implemented endpoints.
- `redapsi.postman_environment.json`: Local development environment.

## How to use

1.  **Import to Postman**:
    - Open Postman.
    - Click **Import** and select both JSON files.
2.  **Select Environment**:
    - In the top-right corner, select **REDAPSI Local**.
3.  **Authentication**:
    - Run the **Auth > Login** request first.
    - The `access_token` and `refresh_token` will be automatically saved to your environment.
    - All subsequent requests use the `{{access_token}}` variable for Bearer authentication.

## Features
- **Automated Tokens**: Login request includes a script to update variables.
- **Role Based**: Includes folders for Psychologist and Consultant specific actions.
- **Onboarding**: Step-by-step onboarding requests for consultants.
