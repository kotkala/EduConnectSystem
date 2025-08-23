#!/bin/bash

# EduConnect System - GitHub Packages Setup Script
# This script helps set up GitHub Packages for the EduConnect System

set -e

echo "🚀 EduConnect System - GitHub Packages Setup"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    print_error "Bun is not installed. Please install Bun first:"
    echo "curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

print_success "Bun is installed: $(bun --version)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if GitHub token is set
if [ -z "$GITHUB_TOKEN" ]; then
    print_warning "GITHUB_TOKEN environment variable is not set."
    echo ""
    echo "To set up GitHub Packages authentication:"
    echo "1. Go to GitHub Settings → Developer settings → Personal access tokens"
    echo "2. Create a token with 'read:packages' and 'write:packages' scopes"
    echo "3. Export the token: export GITHUB_TOKEN=your_token_here"
    echo ""
    read -p "Do you want to continue without authentication? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies
print_status "Installing dependencies..."
bun install

# Run linting
print_status "Running linting..."
bun run lint

# Build the project
print_status "Building the project..."
bun run build

print_success "Project built successfully!"

# Check if .npmrc exists and is configured
if [ ! -f ".npmrc" ]; then
    print_warning ".npmrc file not found. Creating one..."
    cat > .npmrc << EOF
@kotkala:registry=https://npm.pkg.github.com
registry=https://registry.npmjs.org/
//npm.pkg.github.com/:_authToken=\${GITHUB_TOKEN}
always-auth=true
EOF
    print_success ".npmrc file created"
else
    print_success ".npmrc file already exists"
fi

# Function to publish package
publish_package() {
    local version_type=$1
    
    print_status "Publishing package with version bump: $version_type"
    
    # Update version
    if [ "$version_type" != "current" ]; then
        print_status "Updating version..."
        bun version $version_type
    fi
    
    # Publish to GitHub Packages
    print_status "Publishing to GitHub Packages..."
    if bun publish; then
        print_success "Package published successfully!"
        
        # Get current version
        CURRENT_VERSION=$(node -p "require('./package.json').version")
        print_success "Published version: $CURRENT_VERSION"
        
        echo ""
        echo "📦 Package Information:"
        echo "   Name: @kotkala/educonnect-system"
        echo "   Version: $CURRENT_VERSION"
        echo "   Registry: https://npm.pkg.github.com"
        echo ""
        echo "🔧 To install this package:"
        echo "   echo '@kotkala:registry=https://npm.pkg.github.com' >> .npmrc"
        echo "   bun add @kotkala/educonnect-system"
        
    else
        print_error "Failed to publish package"
        exit 1
    fi
}

# Ask user what they want to do
echo ""
echo "What would you like to do?"
echo "1) Publish with patch version bump (0.1.0 → 0.1.1)"
echo "2) Publish with minor version bump (0.1.0 → 0.2.0)"
echo "3) Publish with major version bump (0.1.0 → 1.0.0)"
echo "4) Publish current version without bump"
echo "5) Dry run (test publishing without actually publishing)"
echo "6) Exit"

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        publish_package "patch"
        ;;
    2)
        publish_package "minor"
        ;;
    3)
        publish_package "major"
        ;;
    4)
        publish_package "current"
        ;;
    5)
        print_status "Running dry run..."
        bun publish --dry-run
        print_success "Dry run completed"
        ;;
    6)
        print_status "Exiting..."
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

print_success "Setup completed successfully! 🎉"
