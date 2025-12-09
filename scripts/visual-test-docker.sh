#!/bin/bash
# Run visual tests in Docker to match CI environment
#
# Usage:
#   ./scripts/visual-test-docker.sh                    # Run all visual tests
#   ./scripts/visual-test-docker.sh --update           # Update all snapshots
#   ./scripts/visual-test-docker.sh --update input     # Update specific component
#   ./scripts/visual-test-docker.sh button             # Run specific component test
#   ./scripts/visual-test-docker.sh --stop             # Stop the container
#   ./scripts/visual-test-docker.sh --rebuild          # Rebuild CSS and rerun

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.visual.yml"
SERVICE_NAME="visual-tests"

cd "$PROJECT_ROOT"

# Check if container is running
is_running() {
  docker compose -f "$COMPOSE_FILE" ps --status running 2>/dev/null | grep -q "$SERVICE_NAME"
}

# Start container if not running
ensure_running() {
  if ! is_running; then
    echo "Starting visual test container..."
    docker compose -f "$COMPOSE_FILE" up -d
    echo "Waiting for container to be ready..."
    # Wait for pnpm install to complete
    while ! docker compose -f "$COMPOSE_FILE" logs 2>&1 | grep -q "Ready!"; do
      sleep 2
      echo -n "."
    done
    echo " Ready!"
  fi
}

# Run command in container
run_in_container() {
  docker compose -f "$COMPOSE_FILE" exec -T "$SERVICE_NAME" bash -c "$1"
}

# Parse arguments
UPDATE_FLAG=""
GREP_PATTERN=""
REBUILD=false

case "${1:-}" in
  --stop)
    echo "Stopping visual test container..."
    docker compose -f "$COMPOSE_FILE" down
    exit 0
    ;;
  --rebuild)
    ensure_running
    echo "Rebuilding CSS..."
    run_in_container "pnpm nx build css --skip-nx-cache"
    shift
    ;;
  --update)
    UPDATE_FLAG="--update-snapshots"
    shift
    if [[ -n "${1:-}" ]]; then
      GREP_PATTERN="--grep \"$1\""
      shift
    fi
    ;;
  --help|-h)
    echo "Usage: $0 [options] [component]"
    echo ""
    echo "Options:"
    echo "  --update [component]  Update snapshots (all or specific)"
    echo "  --stop                Stop the Docker container"
    echo "  --rebuild             Rebuild CSS before running tests"
    echo "  --help                Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all visual tests"
    echo "  $0 button             # Run button tests only"
    echo "  $0 --update           # Update all snapshots"
    echo "  $0 --update input     # Update input snapshots"
    exit 0
    ;;
  *)
    if [[ -n "${1:-}" ]]; then
      GREP_PATTERN="--grep \"$1\""
      shift
    fi
    ;;
esac

ensure_running

echo "Running visual tests..."
TEST_CMD="npx playwright test --config=packages/css/playwright.config.ts ${UPDATE_FLAG} ${GREP_PATTERN}"
run_in_container "$TEST_CMD"

echo "Done!"
