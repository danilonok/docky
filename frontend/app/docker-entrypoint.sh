#!/bin/sh
# Writes the deployment's runtime configuration, then hands off to Caddy.
#
# This is what makes one frontend image serve both editions: the bundle is
# identical, and which copy it shows is decided here, from the environment, at
# container start. Rebuilding to change edition would defeat the point.
set -eu

# Matches the fallback in src/config/runtime.js, and for the same reason: the
# neutral edition is the one that is never wrong by accident.
edition="${DOCKY_EDITION:-cloud}"

case "$edition" in
	selfhosted | cloud) ;;
	*)
		echo "docky: unknown DOCKY_EDITION '$edition', refusing to start." >&2
		echo "docky: expected 'selfhosted' or 'cloud'." >&2
		exit 1
		;;
esac

printf '{"edition":"%s"}\n' "$edition" > /srv/config.json
echo "docky: serving the '$edition' edition."

exec "$@"
