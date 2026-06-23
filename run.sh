#!/bin/bash

# Color codes for output formatting
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}===============================================${NC}"
echo -e "${CYAN}   Header Scanner - Test, Lint, Build & Start  ${NC}"
echo -e "${CYAN}===============================================${NC}"

# Function to run a step and check for success
run_step() {
    local step_name="$1"
    local command="$2"
    
    echo -e "\n${YELLOW}[*] Starting: ${step_name}...${NC}"
    echo -e "${CYAN}Executing: ${command}${NC}\n"
    
    eval "$command"
    local status=$?
    
    if [ $status -ne 0 ]; then
        echo -e "\n${RED}[X] Error: ${step_name} failed with exit code ${status}.${NC}"
        exit $status
    else
        echo -e "${GREEN}[✓] Success: ${step_name} completed successfully!${NC}"
    fi
}

# 1. Run Tests
run_step "Unit Tests" "npm run test"

# 2. Run Secret Scan
run_step "Secret Scan" "node scripts/scan-secrets.js"

# 3. Run Linting
run_step "Linter Check" "npm run lint"

# 4. Run Build
run_step "Production Build" "npm run build"

# 4. Start Application
echo -e "\n${GREEN}[✓] All checks passed! Starting the application...${NC}"
echo -e "${CYAN}Executing: npm run start${NC}\n"
npm run start
