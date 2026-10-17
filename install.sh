#!/usr/bin/env bash
#
# Sakura Terminal installer
# Usage:  ./install.sh          (install/update)
#         ./install.sh remove   (uninstall)
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="Sakura Terminal"
DESKTOP_ID="com.sakura.terminal"
DESKTOP_FILE="$HOME/.local/share/applications/${DESKTOP_ID}.desktop"
ICON_DEST="$HOME/.local/share/icons/sakura-icon.png"
LAUNCHER="$HOME/.local/bin/sakura"

remove() {
  rm -f "$DESKTOP_FILE" "$ICON_DEST" "$LAUNCHER"
  update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
  kbuildsycoca6 2>/dev/null || kbuildsycoca5 2>/dev/null || true
  echo "Sakura Terminal removed."
  exit 0
}
[ "${1:-}" = "remove" ] && remove

echo "== ${APP_NAME} installer =="

# --- 1. Verify ALL required app files (incl. animation assets) ---
REQUIRED_FILES=(
  "package.json"
  "src/main.js"
  "src/preload.js"
  "src/renderer.js"
  "src/index.html"
  "src/styles.css"
  "sakura.bashrc"
  "public/Sakura.png"
)
MISSING=0
for f in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$REPO_DIR/$f" ]; then
    echo "ERROR: missing required file: $f"
    MISSING=1
  fi
done
if [ "$MISSING" -eq 1 ]; then
  echo ""
  echo "The installation is incomplete (see files above)."
  echo "If you cloned the repo, try:  git pull  or re-clone."
  exit 1
fi

# --- 2. Check prerequisites ---
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js not found. Install Node.js >= 18 first: https://nodejs.org"
  exit 1
fi
NODE_VER="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_VER" -lt 18 ]; then
  echo "ERROR: Node.js >= 18 required (found $(node --version))."
  exit 1
fi

# --- 3. Syntax-check the JS files (catches corrupted downloads early) ---
echo "-- Verifying code integrity..."
for js in src/main.js src/preload.js src/renderer.js; do
  if ! node --check "$REPO_DIR/$js" >/dev/null 2>&1; then
    echo "ERROR: $js has a syntax error - refusing to install a broken app."
    exit 1
  fi
done

# --- 4. Build deps for node-pty (best effort, sudo) ---
if command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y gcc gcc-c++ make >/dev/null 2>&1 || \
    echo "WARN: could not verify build tools; npm install may fail."
elif command -v apt >/dev/null 2>&1; then
  sudo apt-get install -y build-essential >/dev/null 2>&1 || \
    echo "WARN: could not verify build tools; npm install may fail."
fi

# --- 5. Install npm dependencies ---
echo "-- Installing dependencies (this rebuilds node-pty, takes a minute)..."
cd "$REPO_DIR"
npm install

# --- 6. Resolve ABSOLUTE paths (survives nvm setups) ---
NODE_BIN="$(command -v node)"
NPM_BIN="$(command -v npm)"

# --- 7. Launcher script ---
echo "-- Creating launcher..."
mkdir -p "$HOME/.local/bin"
cat > "$LAUNCHER" <<LAUNCHER_EOF
#!/bin/bash
export PATH="$(dirname "$NODE_BIN"):\$PATH"
cd "$REPO_DIR"
"$NPM_BIN" start &
LAUNCHER_EOF
chmod +x "$LAUNCHER"

# --- 8. Icon ---
echo "-- Installing icon..."
mkdir -p "$HOME/.local/share/icons"
cp "$REPO_DIR/public/Sakura.png" "$ICON_DEST"

# --- 9. Desktop entry (icon ALWAYS points to the installed copy) ---
echo "-- Registering desktop entry..."
mkdir -p "$HOME/.local/share/applications"
cat > "$DESKTOP_FILE" <<DESKTOP_EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=${APP_NAME}
Comment=AI-assisted terminal with Lumo integration
Exec=${LAUNCHER}
Path=${REPO_DIR}
Icon=${ICON_DEST}
Terminal=false
Categories=Utility;Development;
StartupWMClass=Sakura
StartupNotify=true
DESKTOP_EOF
chmod +x "$DESKTOP_FILE"
update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
kbuildsycoca6 2>/dev/null || kbuildsycoca5 2>/dev/null || true

echo ""
echo "== Done! =="
echo "Launch 'Sakura Terminal' from your app grid, or run:  sakura"
echo "Look for the pink sakura icon."
echo "(If it doesn't appear in the grid, log out and back in.)"
