#!/bin/bash

# Debug Extension Loading Script
# Checks if the extension files are correct

echo "=== Webpage to Markdown Extension Debug ==="
echo ""

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: manifest.json not found"
    echo "   Please run this script from the extension root directory"
    exit 1
fi

echo "✅ Found manifest.json"
echo ""

# Check manifest.json for 'type: module'
echo "Checking manifest.json for 'type: module'..."
if grep -q '"type".*:.*"module"' manifest.json; then
    echo "❌ ERROR: Found 'type: module' in manifest.json"
    echo "   This is the problem! Remove it from the background section."
    exit 1
else
    echo "✅ No 'type: module' found (correct)"
fi
echo ""

# Check service-worker.js exists
if [ ! -f "src/background/service-worker.js" ]; then
    echo "❌ Error: src/background/service-worker.js not found"
    exit 1
fi

echo "✅ Found service-worker.js"
echo ""

# Check service-worker.js uses importScripts
echo "Checking service-worker.js for importScripts..."
if grep -q "importScripts" src/background/service-worker.js; then
    echo "✅ Found importScripts (correct for Classic Worker)"
else
    echo "❌ ERROR: importScripts not found"
    echo "   Service worker should use importScripts, not import statements"
    exit 1
fi
echo ""

# Check for ES6 import statements (should not exist)
if grep -q "^import " src/background/service-worker.js; then
    echo "❌ ERROR: Found ES6 import statements"
    echo "   Service worker should use importScripts, not import"
    exit 1
else
    echo "✅ No ES6 import statements (correct)"
fi
echo ""

# Display manifest background config
echo "Current background configuration:"
echo "---"
grep -A 2 '"background"' manifest.json
echo "---"
echo ""

# Final verdict
echo "=== Configuration Check Complete ==="
echo ""
echo "✅ All checks passed!"
echo ""
echo "If Chrome still shows errors:"
echo "1. Delete the extension from chrome://extensions/"
echo "2. Clear Service Worker cache: chrome://serviceworker-internals/"
echo "3. Restart Chrome completely"
echo "4. Reload extension from: $(pwd)"
echo ""
echo "Expected Service Worker output:"
echo "  [Service Worker] Starting..."
echo "  [Service Worker] Loaded successfully"
