#!/bin/bash
cd "$(dirname "$0")" || exit 1
exec ./node_modules/.bin/vite preview --port 4173 --host 0.0.0.0
