#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔥 Starting Firebase Backend Deployment..."

# Check if firebase CLI is available
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: firebase CLI is not installed.${NC}"
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Deploy Firestore Rules
echo -e "\n📝 Deploying Firestore Rules..."
if firebase deploy --only firestore:rules; then
    echo -e "${GREEN}✓ Firestore Rules deployed successfully${NC}"
else
    echo -e "${RED}✗ Failed to deploy Firestore Rules${NC}"
    exit 1
fi

# Deploy Firestore Indexes
echo -e "\n📇 Deploying Firestore Indexes..."
if firebase deploy --only firestore:indexes; then
    echo -e "${GREEN}✓ Firestore Indexes deployed successfully${NC}"
else
    echo -e "${RED}✗ Failed to deploy Firestore Indexes${NC}"
    exit 1
fi

# Functions deployment (commented out as not currently used)
# if [ -f "firebase.json" ] && grep -q "functions" "firebase.json"; then
#     echo -e "\nλ Deploying Cloud Functions..."
#     if firebase deploy --only functions; then
#         echo -e "${GREEN}✓ Cloud Functions deployed successfully${NC}"
#     else
#         echo -e "${RED}✗ Failed to deploy Cloud Functions${NC}"
#         exit 1
#     fi
# fi

echo -e "\n${GREEN}✨ Firebase Backend Deployment Complete!${NC}"
echo "Deployed resources:"
echo " - Firestore Security Rules"
echo " - Firestore Indexes"
