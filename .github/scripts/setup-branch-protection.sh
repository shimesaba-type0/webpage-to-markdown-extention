#!/bin/bash
set -e

REPO_OWNER="shimesaba-type0"
REPO_NAME="webpage-to-markdown-extention"
BRANCH="main"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}GitHub Branch Protection Setup${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Repository: ${GREEN}${REPO_OWNER}/${REPO_NAME}${NC}"
echo -e "Branch: ${GREEN}${BRANCH}${NC}"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo ""
    echo "Please install it from: https://cli.github.com/"
    echo ""
    echo "Installation instructions:"
    echo "  - macOS: brew install gh"
    echo "  - Linux: See https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo "  - Windows: See https://github.com/cli/cli#windows"
    exit 1
fi

# Check if authenticated with GitHub CLI
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI${NC}"
    echo ""
    echo "Please run: ${YELLOW}gh auth login${NC}"
    exit 1
fi

echo -e "${YELLOW}Applying branch protection rules...${NC}"
echo ""

# Branch protection configuration JSON payload
PROTECTION_PAYLOAD=$(cat <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0,
    "require_last_push_approval": false,
    "bypass_pull_request_allowances": {
      "users": [],
      "teams": [],
      "apps": []
    }
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF
)

# Apply branch protection
if gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}/protection" \
  --input - <<< "$PROTECTION_PAYLOAD" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Branch protection rules applied successfully${NC}"
else
    echo -e "${RED}✗ Failed to apply branch protection rules${NC}"
    echo ""
    echo "This might be due to:"
    echo "  - Insufficient permissions (need admin access)"
    echo "  - The branch '${BRANCH}' does not exist"
    echo "  - Network connectivity issues"
    exit 1
fi

echo ""
echo -e "${YELLOW}Verifying configuration...${NC}"
echo ""

# Verify configuration
if gh api \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}/protection" 2>&1 | grep -q "required_pull_request_reviews"; then
    echo -e "${GREEN}✓ Configuration verified successfully${NC}"
    echo ""
    echo -e "${BLUE}Applied protection rules:${NC}"
    echo -e "  ${GREEN}✓${NC} Pull requests required before merging"
    echo -e "  ${GREEN}✓${NC} Review approvals: 0 (owner-only repository)"
    echo -e "  ${GREEN}✓${NC} Linear history required"
    echo -e "  ${GREEN}✓${NC} Force pushes: disabled"
    echo -e "  ${GREEN}✓${NC} Branch deletions: disabled"
    echo -e "  ${GREEN}✓${NC} Rules enforced for administrators"
    echo -e "  ${GREEN}✓${NC} Conversation resolution: recommended"
else
    echo -e "${YELLOW}⚠ Configuration verification incomplete${NC}"
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}Branch protection setup completed!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "You can view the settings at:"
echo "https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/branches"
echo ""
